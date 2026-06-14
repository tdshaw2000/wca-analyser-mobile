import { render, screen } from '@testing-library/react-native';

import { RecordChart, CHART_POINT_TEST_ID } from '@/ui/components/RecordChart';
import type { ChartPoint } from '@/domain/models/chartPoint';

// A progression descends over time (PRs are a running minimum). Values are the
// charted numbers; display labels are irrelevant to the geometry asserted here.
const POINTS: ChartPoint[] = [
  { date: '2023-11-18', value: 1807, display: '18.07' },
  { date: '2024-03-02', value: 1655, display: '16.55' },
  { date: '2024-11-01', value: 1498, display: '14.98' },
];

// Every value identical: the vertical range is zero, which must not divide-by-zero.
const FLAT_POINTS: ChartPoint[] = [
  { date: '2023-11-18', value: 1807, display: '18.07' },
  { date: '2024-11-01', value: 1807, display: '18.07' },
];

describe('RecordChart', () => {
  it('draws one marker per record point', async () => {
    await render(<RecordChart points={POINTS} />);

    expect(screen.getAllByTestId(CHART_POINT_TEST_ID)).toHaveLength(POINTS.length);
  });

  it('renders nothing when there are no points', async () => {
    await render(<RecordChart points={[]} />);

    expect(screen.queryAllByTestId(CHART_POINT_TEST_ID)).toHaveLength(0);
  });

  it('keeps marker coordinates finite when every value is equal (zero range)', async () => {
    await render(<RecordChart points={FLAT_POINTS} />);

    for (const marker of screen.getAllByTestId(CHART_POINT_TEST_ID)) {
      expect(Number.isFinite(Number(marker.props.cx))).toBe(true);
      expect(Number.isFinite(Number(marker.props.cy))).toBe(true);
    }
  });
});
