import { render, screen } from '@testing-library/react-native';
import { processColor } from 'react-native';

import {
  RecordChart,
  SINGLE_POINT_TEST_ID,
  AVERAGE_POINT_TEST_ID,
  Y_TICK_TEST_ID,
  SINGLE_COLOUR,
  AVERAGE_COLOUR,
} from '@/ui/components/RecordChart';
import type { ChartPoint } from '@/domain/models/chartPoint';

// Singles and averages are set on different dates, so the chart must share one
// time axis to overlay them. Values are the charted numbers; display is the label.
const SINGLES: ChartPoint[] = [
  { date: '2023-11-18', value: 1807, display: '18.07' },
  { date: '2024-03-02', value: 1655, display: '16.55' },
  { date: '2024-11-01', value: 1498, display: '14.98' },
];
const AVERAGES: ChartPoint[] = [
  { date: '2023-12-01', value: 2050, display: '20.50' },
  { date: '2024-09-10', value: 1990, display: '19.90' },
];

describe('RecordChart', () => {
  it('draws a marker per single point in the single colour', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} />);

    const markers = screen.getAllByTestId(SINGLE_POINT_TEST_ID);
    expect(markers).toHaveLength(SINGLES.length);
    // react-native-svg normalises a colour string to an ARGB int (== processColor).
    for (const marker of markers) {
      expect(marker.props.fill.payload).toBe(processColor(SINGLE_COLOUR));
    }
  });

  it('draws a marker per average point in the average colour', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} />);

    const markers = screen.getAllByTestId(AVERAGE_POINT_TEST_ID);
    expect(markers).toHaveLength(AVERAGES.length);
    for (const marker of markers) {
      expect(marker.props.fill.payload).toBe(processColor(AVERAGE_COLOUR));
    }
  });

  it('omits the average series entirely when there are no averages', async () => {
    await render(<RecordChart singles={SINGLES} averages={[]} />);

    expect(screen.getAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(SINGLES.length);
    expect(screen.queryAllByTestId(AVERAGE_POINT_TEST_ID)).toHaveLength(0);
  });

  it('labels the result axis with formatted time ticks', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} />);

    expect(screen.getAllByTestId(Y_TICK_TEST_ID).length).toBeGreaterThan(0);
  });

  it('renders nothing when both series are empty', async () => {
    await render(<RecordChart singles={[]} averages={[]} />);

    expect(screen.queryAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(0);
    expect(screen.queryAllByTestId(AVERAGE_POINT_TEST_ID)).toHaveLength(0);
  });

  it('keeps coordinates finite when a single point gives zero range', async () => {
    await render(
      <RecordChart singles={[{ date: '2024-01-01', value: 1807, display: '18.07' }]} averages={[]} />,
    );

    for (const marker of screen.getAllByTestId(SINGLE_POINT_TEST_ID)) {
      expect(Number.isFinite(Number(marker.props.cx))).toBe(true);
      expect(Number.isFinite(Number(marker.props.cy))).toBe(true);
    }
  });
});
