/**
 * A small hand-rolled SVG line chart of a personal-record progression. Given the
 * chart points from domain/services/chart, it draws a line through them with a
 * marker at each record.
 *
 * The vertical axis is oriented so the best (lowest) time sits at the bottom: a
 * PR progression is a running minimum, so the line descends left-to-right and
 * reads as improvement. A zero vertical range (a single point, or equal values)
 * is centred rather than divided by, so coordinates stay finite.
 */
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import type { ChartPoint } from '@/domain/models/chartPoint';
import { colors } from '@/ui/theme/colors';

export const CHART_POINT_TEST_ID = 'chart-point';

const VIEWBOX_WIDTH = 300;
const VIEWBOX_HEIGHT = 160;
const PADDING = 16;
const MARKER_RADIUS = 4;
const LINE_WIDTH = 2;
const PLOT_WIDTH = VIEWBOX_WIDTH - PADDING * 2;
const PLOT_HEIGHT = VIEWBOX_HEIGHT - PADDING * 2;
const HORIZONTAL_CENTRE = VIEWBOX_WIDTH / 2;
const VERTICAL_CENTRE = VIEWBOX_HEIGHT / 2;
const ZERO_RANGE = 0;
const EMPTY_COUNT = 0;
const SINGLE_POINT = 1;

interface RecordChartProps {
  points: ChartPoint[];
}

interface PlottedPoint {
  x: number;
  y: number;
}

function plot(points: ChartPoint[]): PlottedPoint[] {
  const values = points.map((point) => point.value);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const range = highest - lowest;
  const lastIndex = points.length - SINGLE_POINT;

  return points.map((point, index) => {
    const x =
      points.length === SINGLE_POINT
        ? HORIZONTAL_CENTRE
        : PADDING + (index / lastIndex) * PLOT_WIDTH;
    const y =
      range === ZERO_RANGE
        ? VERTICAL_CENTRE
        : VIEWBOX_HEIGHT - PADDING - ((point.value - lowest) / range) * PLOT_HEIGHT;
    return { x, y };
  });
}

export function RecordChart({ points }: RecordChartProps) {
  if (points.length === EMPTY_COUNT) return null;

  const plotted = plot(points);
  const polylinePoints = plotted.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <View style={styles.container}>
      <Svg width="100%" height={VIEWBOX_HEIGHT} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.primary}
          strokeWidth={LINE_WIDTH}
        />
        {plotted.map(({ x, y }, index) => (
          <Circle
            key={points[index].date}
            testID={CHART_POINT_TEST_ID}
            cx={x}
            cy={y}
            r={MARKER_RADIUS}
            fill={colors.primary}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
});
