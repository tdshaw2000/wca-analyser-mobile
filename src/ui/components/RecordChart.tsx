/**
 * A hand-rolled SVG line chart of a competitor's personal-record progression,
 * overlaying the single and average series on one shared scale. Ported from the
 * Python source's static/records-chart.js (a Chart.js line chart): single in
 * blue, average in green, with the average omitted entirely when an event has no
 * average results.
 *
 * Both series share one time x-axis (positioned by actual date, so the lines
 * align) and one padded result y-axis (resultBounds over both). The y-axis is
 * labelled with time ticks; the higher (slower) times sit at the top, so a
 * progression — a running minimum — descends and reads as improvement.
 */
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { dateBounds, resultBounds, formatAxisTick } from '@/domain/services/chart';
import type { ChartPoint } from '@/domain/models/chartPoint';
import { colors } from '@/ui/theme/colors';

// Series colours match the Python chart (records-chart.js).
export const SINGLE_COLOUR = '#2563eb';
export const AVERAGE_COLOUR = '#449964';
export const SINGLE_POINT_TEST_ID = 'chart-point-single';
export const AVERAGE_POINT_TEST_ID = 'chart-point-average';
export const Y_TICK_TEST_ID = 'chart-y-tick';

const SINGLE_LABEL = 'Single';
const AVERAGE_LABEL = 'Average';
const TIME_AXIS_CAPTION = 'Time →';

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 200;
const PADDING = 12;
const AXIS_GUTTER_WIDTH = 40; // left strip reserved for the y-axis time labels
const PLOT_LEFT = AXIS_GUTTER_WIDTH;
const PLOT_RIGHT = VIEWBOX_WIDTH - PADDING;
const PLOT_TOP = PADDING;
const PLOT_BOTTOM = VIEWBOX_HEIGHT - PADDING;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const HORIZONTAL_CENTRE = PLOT_LEFT + PLOT_WIDTH / 2;
const VERTICAL_CENTRE = PLOT_TOP + PLOT_HEIGHT / 2;

const MARKER_RADIUS = 3.5;
const LINE_WIDTH = 2;
const GRIDLINE_WIDTH = 1;
const TICK_COUNT = 5;
const TICK_LABEL_FONT_SIZE = 9;
const TICK_LABEL_GAP = 4;

const EMPTY_COUNT = 0;
const ZERO_SPAN = 0;
const FIRST_TICK = 0;

interface RecordChartProps {
  singles: ChartPoint[];
  averages: ChartPoint[];
}

interface Scale {
  x: (date: string) => number;
  y: (value: number) => number;
}

function buildScale(allPoints: ChartPoint[]): Scale {
  const values = resultBounds(allPoints);
  const dates = dateBounds(allPoints);
  const earliest = Date.parse(dates.min);
  const dateSpan = Date.parse(dates.max) - earliest;
  const valueSpan = values.max - values.min;

  return {
    x: (date) =>
      dateSpan === ZERO_SPAN
        ? HORIZONTAL_CENTRE
        : PLOT_LEFT + ((Date.parse(date) - earliest) / dateSpan) * PLOT_WIDTH,
    y: (value) =>
      valueSpan === ZERO_SPAN
        ? VERTICAL_CENTRE
        : PLOT_TOP + ((values.max - value) / valueSpan) * PLOT_HEIGHT,
  };
}

function polylinePoints(points: ChartPoint[], scale: Scale): string {
  return points.map((point) => `${scale.x(point.date)},${scale.y(point.value)}`).join(' ');
}

function seriesMarkers(points: ChartPoint[], scale: Scale, testID: string, colour: string) {
  return points.map((point) => (
    <Circle
      key={point.date}
      testID={testID}
      cx={scale.x(point.date)}
      cy={scale.y(point.value)}
      r={MARKER_RADIUS}
      fill={colour}
    />
  ));
}

// Evenly spaced result-axis ticks between the padded bounds, each a gridline plus
// a time label down the left gutter.
function yAxisTicks(allPoints: ChartPoint[]) {
  const { min, max } = resultBounds(allPoints);
  const lastTick = TICK_COUNT - 1;
  return Array.from({ length: TICK_COUNT }, (_unused, index) => {
    const value = min + ((max - min) * index) / lastTick;
    const y = PLOT_TOP + ((max - value) / (max - min || 1)) * PLOT_HEIGHT;
    return { value, y };
  });
}

function ChartLegend({ showAverage }: { showAverage: boolean }) {
  return (
    <View style={styles.legend}>
      <LegendEntry colour={SINGLE_COLOUR} label={SINGLE_LABEL} />
      {showAverage ? <LegendEntry colour={AVERAGE_COLOUR} label={AVERAGE_LABEL} /> : null}
    </View>
  );
}

function LegendEntry({ colour, label }: { colour: string; label: string }) {
  return (
    <View style={styles.legendEntry}>
      <View style={[styles.legendSwatch, { backgroundColor: colour }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

export function RecordChart({ singles, averages }: RecordChartProps) {
  const allPoints = [...singles, ...averages];
  if (allPoints.length === EMPTY_COUNT) return null;

  const scale = buildScale(allPoints);
  const ticks = yAxisTicks(allPoints);

  return (
    <View style={styles.container}>
      <ChartLegend showAverage={averages.length > EMPTY_COUNT} />
      <Svg width="100%" height={VIEWBOX_HEIGHT} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
        {ticks.map((tick, index) => (
          <Fragment key={tick.value}>
            <Line
              x1={PLOT_LEFT}
              y1={tick.y}
              x2={PLOT_RIGHT}
              y2={tick.y}
              stroke={colors.border}
              strokeWidth={GRIDLINE_WIDTH}
            />
            <SvgText
              testID={Y_TICK_TEST_ID}
              x={PLOT_LEFT - TICK_LABEL_GAP}
              y={tick.y}
              fontSize={TICK_LABEL_FONT_SIZE}
              fill={colors.muted}
              textAnchor="end"
              alignmentBaseline={index === FIRST_TICK ? 'hanging' : 'middle'}
            >
              {formatAxisTick(tick.value)}
            </SvgText>
          </Fragment>
        ))}
        <Polyline
          points={polylinePoints(singles, scale)}
          fill="none"
          stroke={SINGLE_COLOUR}
          strokeWidth={LINE_WIDTH}
        />
        {averages.length > EMPTY_COUNT ? (
          <Polyline
            points={polylinePoints(averages, scale)}
            fill="none"
            stroke={AVERAGE_COLOUR}
            strokeWidth={LINE_WIDTH}
          />
        ) : null}
        {seriesMarkers(singles, scale, SINGLE_POINT_TEST_ID, SINGLE_COLOUR)}
        {seriesMarkers(averages, scale, AVERAGE_POINT_TEST_ID, AVERAGE_COLOUR)}
      </Svg>
      <Text style={styles.caption}>{TIME_AXIS_CAPTION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 4 },
  legendEntry: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 2 },
  legendLabel: { fontSize: 12, color: colors.muted },
  caption: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 2 },
});
