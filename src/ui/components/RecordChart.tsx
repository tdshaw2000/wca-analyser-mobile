/**
 * A hand-rolled SVG line chart of a competitor's personal-record progression,
 * overlaying the single and average series on one shared scale. Ported from the
 * Python source's static/records-chart.js (a Chart.js line chart): single in
 * blue, average in green, with the average omitted entirely when an event has no
 * average results. With connected={false} the joining lines are dropped, giving
 * a points-only scatter (reused for the "All results" chart).
 *
 * Both series share one time x-axis (positioned by actual date, so the lines
 * align) and one padded result y-axis (resultBounds over both). The y-axis is
 * labelled with time ticks; the higher (slower) times sit at the top, so a
 * progression — a running minimum — descends and reads as improvement.
 */
import { Fragment, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

import { dateBounds, windowedValueBounds, formatAxisTick } from '@/domain/services/chart';
import type { DailyRangeSeries, TimeWindow, ValueBounds } from '@/domain/services/chart';
import type { ChartPoint } from '@/domain/models/chartPoint';
import { ChartLegend } from '@/ui/components/ChartLegend';
import type { ChartLegendEntry } from '@/ui/components/ChartLegend';
import { colors } from '@/ui/theme/colors';

// Series colours match the Python chart (records-chart.js).
export const SINGLE_COLOUR = '#2563eb';
export const AVERAGE_COLOUR = '#449964';
// A translucent wash of the Single colour, so the daily-range band reads as the
// spread of the singles it envelopes (matches scatter-chart.js's BAND_FILL_COLOUR).
export const BAND_FILL_COLOUR = 'rgba(37, 99, 235, 0.15)';
export const SINGLE_POINT_TEST_ID = 'chart-point-single';
export const AVERAGE_POINT_TEST_ID = 'chart-point-average';
export const SINGLE_LINE_TEST_ID = 'chart-line-single';
export const AVERAGE_LINE_TEST_ID = 'chart-line-average';
export const BAND_TEST_ID = 'chart-band';
export const SINGLE_LEGEND_TEST_ID = 'chart-legend-single';
export const AVERAGE_LEGEND_TEST_ID = 'chart-legend-average';
export const BAND_LEGEND_TEST_ID = 'chart-legend-band';
export const Y_TICK_TEST_ID = 'chart-y-tick';

const SINGLE_LABEL = 'Single';
const AVERAGE_LABEL = 'Average';
// Title-cased on mobile (the web reads "Daily range"); set per the user's request.
const BAND_LABEL = 'Daily Range';
const TIME_AXIS_CAPTION = 'Time →';

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 200;
// Width-to-height ratio of the viewBox. The chart area takes the full available
// width and derives its height from this, so the SVG fills edge-to-edge without
// letterboxing (the aspect ratios match, so the uniform scale leaves no gutters).
const CHART_ASPECT_RATIO = VIEWBOX_WIDTH / VIEWBOX_HEIGHT;
// In landscape the full screen width would make the aspect-locked chart taller
// than the viewport, so cap its height to a fraction of the window and derive
// the matching max width — keeping the ratio (no letterboxing) and centring it.
const LANDSCAPE_CHART_HEIGHT_FRACTION = 0.45;
const PADDING = 12;
const AXIS_GUTTER_WIDTH = 40; // left strip reserved for the y-axis time labels

interface PlotRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centreX: number;
  centreY: number;
}

// The plot rectangle inside a viewBox of the given size: a fixed left gutter for
// the y-axis labels and uniform padding elsewhere. Derived from the actual box
// so the chart can fill a portrait or a wide landscape area with the same code.
function plotRect(viewBoxWidth: number, viewBoxHeight: number): PlotRect {
  const left = AXIS_GUTTER_WIDTH;
  const right = viewBoxWidth - PADDING;
  const top = PADDING;
  const bottom = viewBoxHeight - PADDING;
  const width = right - left;
  const height = bottom - top;
  return { left, right, top, bottom, width, height, centreX: left + width / 2, centreY: top + height / 2 };
}

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
  /**
   * Whether to join each series' points with a line. True (the default) draws the
   * record progression; false gives a points-only scatter (the "All results"
   * chart), matching the web's showLine: false.
   */
  connected?: boolean;
  /**
   * Optional fastest/slowest-per-day bounds shaded as a translucent band behind
   * the points (the all-results scatter's "Daily Range"). Omitted on the
   * progression chart and for events without a band (e.g. Multi-Blind).
   */
  band?: DailyRangeSeries;
}

interface Scale {
  x: (date: string) => number;
  y: (value: number) => number;
}

// The pure mapping from a visible time window and value bounds onto plot pixels.
// x is driven by the window (so a zoom re-spreads the dates) and y by the bounds
// (so a zoom refits the height); both are precomputed by the caller, keeping this
// a plain coordinate transform with no knowledge of zoom.
export function buildScale(window: TimeWindow, valueBounds: ValueBounds, rect: PlotRect): Scale {
  const dateSpan = window.end - window.start;
  const valueSpan = valueBounds.max - valueBounds.min;

  return {
    x: (date) =>
      dateSpan === ZERO_SPAN
        ? rect.centreX
        : rect.left + ((Date.parse(date) - window.start) / dateSpan) * rect.width,
    y: (value) =>
      valueSpan === ZERO_SPAN
        ? rect.centreY
        : rect.top + ((valueBounds.max - value) / valueSpan) * rect.height,
  };
}

function polylinePoints(points: ChartPoint[], scale: Scale): string {
  return points.map((point) => `${scale.x(point.date)},${scale.y(point.value)}`).join(' ');
}

// A closed ring tracing the slowest (upper) bound left-to-right, then back along
// the fastest (lower) bound, so the polygon shades the area between the two.
function bandPolygonPoints(band: DailyRangeSeries, scale: Scale): string {
  const upper = band.upper.map((point) => `${scale.x(point.date)},${scale.y(point.value)}`);
  const lower = [...band.lower]
    .reverse()
    .map((point) => `${scale.x(point.date)},${scale.y(point.value)}`);
  return [...upper, ...lower].join(' ');
}

function seriesMarkers(points: ChartPoint[], scale: Scale, testID: string, colour: string) {
  // The scatter plots every solve, so many points share a date; the index keeps
  // each marker's key unique (date alone would collide).
  return points.map((point, index) => (
    <Circle
      key={`${point.date}-${index}`}
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
function yAxisTicks(bounds: ValueBounds, rect: PlotRect) {
  const { min, max } = bounds;
  const lastTick = TICK_COUNT - 1;
  return Array.from({ length: TICK_COUNT }, (_unused, index) => {
    const value = min + ((max - min) * index) / lastTick;
    const y = rect.top + ((max - value) / (max - min || 1)) * rect.height;
    return { value, y };
  });
}

export function RecordChart({ singles, averages, connected = true, band }: RecordChartProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  // Landscape fills the width and caps the height, so the box is wider than the
  // portrait 1.6 shape. We measure its real pixels and use them as the viewBox
  // so the plot stretches edge-to-edge with no letterboxing.
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  // Each series can be hidden via its legend entry; both start visible.
  const [singleVisible, setSingleVisible] = useState(true);
  const [averageVisible, setAverageVisible] = useState(true);
  const [bandVisible, setBandVisible] = useState(true);

  // The scale and ticks are computed over ALL points regardless of visibility, so
  // hiding a series never rescales the axes (faithful to the web chart).
  const allPoints = [...singles, ...averages];
  if (allPoints.length === EMPTY_COUNT) return null;

  const hasAverage = averages.length > EMPTY_COUNT;
  const hasBand = band !== undefined && band.upper.length > EMPTY_COUNT;
  const entries: ChartLegendEntry[] = [
    {
      label: SINGLE_LABEL,
      colour: SINGLE_COLOUR,
      visible: singleVisible,
      onToggle: () => setSingleVisible((shown) => !shown),
      testID: SINGLE_LEGEND_TEST_ID,
    },
  ];
  if (hasAverage) {
    entries.push({
      label: AVERAGE_LABEL,
      colour: AVERAGE_COLOUR,
      visible: averageVisible,
      onToggle: () => setAverageVisible((shown) => !shown),
      testID: AVERAGE_LEGEND_TEST_ID,
    });
  }
  if (hasBand) {
    entries.push({
      label: BAND_LABEL,
      colour: BAND_FILL_COLOUR,
      visible: bandVisible,
      onToggle: () => setBandVisible((shown) => !shown),
      testID: BAND_LEGEND_TEST_ID,
    });
  }

  const useMeasured = isLandscape && measured !== null;
  const viewBoxWidth = useMeasured ? measured.width : VIEWBOX_WIDTH;
  const viewBoxHeight = useMeasured ? measured.height : VIEWBOX_HEIGHT;
  const rect = plotRect(viewBoxWidth, viewBoxHeight);
  // The whole-career window: the chart spans every record until a gesture zooms
  // in. Both series and the full window feed the value rescale, so the axes are
  // computed over all points regardless of which series are hidden.
  const dates = dateBounds(allPoints);
  const window: TimeWindow = { start: Date.parse(dates.min), end: Date.parse(dates.max) };
  const valueBounds = windowedValueBounds([singles, averages], window);
  const scale = buildScale(window, valueBounds, rect);
  const ticks = yAxisTicks(valueBounds, rect);
  const chartAreaSize = isLandscape
    ? { height: windowHeight * LANDSCAPE_CHART_HEIGHT_FRACTION }
    : styles.chartAreaPortrait;

  function measure(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setMeasured((previous) =>
      previous?.width === width && previous?.height === height ? previous : { width, height },
    );
  }

  return (
    <View style={styles.container}>
      <ChartLegend entries={entries} />
      <View style={[styles.chartArea, chartAreaSize]} onLayout={measure}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
        {ticks.map((tick, index) => (
          <Fragment key={tick.value}>
            <Line
              x1={rect.left}
              y1={tick.y}
              x2={rect.right}
              y2={tick.y}
              stroke={colors.border}
              strokeWidth={GRIDLINE_WIDTH}
            />
            <SvgText
              testID={Y_TICK_TEST_ID}
              x={rect.left - TICK_LABEL_GAP}
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
        {band && hasBand && bandVisible ? (
          <Polygon
            testID={BAND_TEST_ID}
            points={bandPolygonPoints(band, scale)}
            fill={BAND_FILL_COLOUR}
            stroke="none"
          />
        ) : null}
        {connected && singleVisible ? (
          <Polyline
            testID={SINGLE_LINE_TEST_ID}
            points={polylinePoints(singles, scale)}
            fill="none"
            stroke={SINGLE_COLOUR}
            strokeWidth={LINE_WIDTH}
          />
        ) : null}
        {connected && hasAverage && averageVisible ? (
          <Polyline
            testID={AVERAGE_LINE_TEST_ID}
            points={polylinePoints(averages, scale)}
            fill="none"
            stroke={AVERAGE_COLOUR}
            strokeWidth={LINE_WIDTH}
          />
        ) : null}
        {singleVisible ? seriesMarkers(singles, scale, SINGLE_POINT_TEST_ID, SINGLE_COLOUR) : null}
        {hasAverage && averageVisible
          ? seriesMarkers(averages, scale, AVERAGE_POINT_TEST_ID, AVERAGE_COLOUR)
          : null}
        </Svg>
      </View>
      <Text style={styles.caption}>{TIME_AXIS_CAPTION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  chartArea: { width: '100%' },
  chartAreaPortrait: { aspectRatio: CHART_ASPECT_RATIO },
  caption: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 2 },
});
