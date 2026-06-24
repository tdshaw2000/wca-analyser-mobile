import { render, screen, fireEvent } from '@testing-library/react-native';
import { processColor } from 'react-native';

import {
  RecordChart,
  buildScale,
  SINGLE_POINT_TEST_ID,
  AVERAGE_POINT_TEST_ID,
  SINGLE_LINE_TEST_ID,
  AVERAGE_LINE_TEST_ID,
  Y_TICK_TEST_ID,
  SINGLE_COLOUR,
  AVERAGE_COLOUR,
  BAND_FILL_COLOUR,
  SINGLE_LEGEND_TEST_ID,
  AVERAGE_LEGEND_TEST_ID,
  BAND_TEST_ID,
  BAND_LEGEND_TEST_ID,
} from '@/ui/components/RecordChart';
import type { ChartPoint } from '@/domain/models/chartPoint';
import type { DailyRangeSeries } from '@/domain/services/chart';

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
// Each day's fastest (lower) and slowest (upper) solve, shaded as a band on the
// all-results scatter.
const BAND: DailyRangeSeries = {
  lower: [
    { date: '2023-11-18', value: 1807, display: '18.07' },
    { date: '2024-11-01', value: 1498, display: '14.98' },
  ],
  upper: [
    { date: '2023-11-18', value: 2100, display: '21.00' },
    { date: '2024-11-01', value: 1700, display: '17.00' },
  ],
};

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

  it('connects each series with a line by default', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} />);

    expect(screen.getAllByTestId(SINGLE_LINE_TEST_ID)).toHaveLength(1);
    expect(screen.getAllByTestId(AVERAGE_LINE_TEST_ID)).toHaveLength(1);
  });

  it('omits the connecting lines in points-only (scatter) mode', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} connected={false} />);

    // The markers still plot every point; only the joining lines are gone.
    expect(screen.queryAllByTestId(SINGLE_LINE_TEST_ID)).toHaveLength(0);
    expect(screen.queryAllByTestId(AVERAGE_LINE_TEST_ID)).toHaveLength(0);
    expect(screen.getAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(SINGLES.length);
    expect(screen.getAllByTestId(AVERAGE_POINT_TEST_ID)).toHaveLength(AVERAGES.length);
  });

  it('gives every marker a unique key when several solves share a date', async () => {
    // The all-results scatter plots every solve, so many points land on one
    // competition date — markers keyed by date alone would collide.
    const sameDate = '2024-01-01';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await render(
      <RecordChart
        singles={[
          { date: sameDate, value: 1807, display: '18.07' },
          { date: sameDate, value: 1900, display: '19.00' },
          { date: sameDate, value: 2000, display: '20.00' },
        ]}
        averages={[]}
        connected={false}
      />,
    );

    const duplicateKeyWarning = errorSpy.mock.calls.find((call) =>
      String(call[0]).includes('same key'),
    );
    errorSpy.mockRestore();
    expect(duplicateKeyWarning).toBeUndefined();
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

  it('hides the single series when its legend entry is pressed', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} />);

    await fireEvent.press(screen.getByTestId(SINGLE_LEGEND_TEST_ID));

    expect(screen.queryAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(0);
    // The average series is untouched.
    expect(screen.getAllByTestId(AVERAGE_POINT_TEST_ID)).toHaveLength(AVERAGES.length);
  });

  it('shows the single series again when its legend entry is pressed twice', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} />);

    await fireEvent.press(screen.getByTestId(SINGLE_LEGEND_TEST_ID));
    await fireEvent.press(screen.getByTestId(SINGLE_LEGEND_TEST_ID));

    expect(screen.getAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(SINGLES.length);
  });

  it('toggles the average series independently of the single', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} />);

    await fireEvent.press(screen.getByTestId(AVERAGE_LEGEND_TEST_ID));

    expect(screen.queryAllByTestId(AVERAGE_POINT_TEST_ID)).toHaveLength(0);
    expect(screen.getAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(SINGLES.length);
  });

  it('shades a daily-range band when band bounds are provided', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} band={BAND} connected={false} />);

    const band = screen.getByTestId(BAND_TEST_ID);
    expect(band.props.fill.payload).toBe(processColor(BAND_FILL_COLOUR));
  });

  it('omits the band when no band bounds are provided', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} connected={false} />);

    expect(screen.queryByTestId(BAND_TEST_ID)).toBeNull();
  });

  it('hides the band when its legend entry is pressed', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} band={BAND} connected={false} />);

    await fireEvent.press(screen.getByTestId(BAND_LEGEND_TEST_ID));

    expect(screen.queryByTestId(BAND_TEST_ID)).toBeNull();
    // The single markers are untouched.
    expect(screen.getAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(SINGLES.length);
  });

  it('shows the band again when its legend entry is pressed twice', async () => {
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} band={BAND} connected={false} />);

    await fireEvent.press(screen.getByTestId(BAND_LEGEND_TEST_ID));
    await fireEvent.press(screen.getByTestId(BAND_LEGEND_TEST_ID));

    expect(screen.getByTestId(BAND_TEST_ID)).toBeTruthy();
  });

  // buildScale is the pure window -> pixel mapping behind the chart. Driving it
  // directly proves a zoomed window re-maps the axes, without simulating gestures
  // (the gesture feel itself is a manual Expo Go check). A plain plot rectangle:
  // a 40px y-axis gutter on the left, 12px padding elsewhere, in a 320x212 box.
  const RECT = {
    left: 40,
    right: 320,
    top: 12,
    bottom: 200,
    width: 280,
    height: 188,
    centreX: 180,
    centreY: 106,
  };

  describe('buildScale', () => {
    const WINDOW = { start: Date.parse('2024-02-15'), end: Date.parse('2024-03-15') };
    const VALUE_BOUNDS = { min: 1900, max: 4100 };

    it('maps the window edges onto the plot rectangle edges', () => {
      const scale = buildScale(WINDOW, VALUE_BOUNDS, RECT);

      expect(scale.x('2024-02-15')).toBe(RECT.left);
      expect(scale.x('2024-03-15')).toBe(RECT.right);
    });

    it('maps the value bounds onto the plot top and bottom, slower times at the top', () => {
      const scale = buildScale(WINDOW, VALUE_BOUNDS, RECT);

      // The higher (slower) value sits at the top so a descending line reads as
      // improvement; the bounds drive this, so a zoomed window fills the height.
      expect(scale.y(VALUE_BOUNDS.max)).toBe(RECT.top);
      expect(scale.y(VALUE_BOUNDS.min)).toBe(RECT.bottom);
    });
  });

  it('keeps the y-axis fixed when a series is hidden', async () => {
    // Hiding the single series must not rescale the axis, so the still-visible
    // average markers keep their exact y-coordinates. (Comparing the numeric cy
    // values, not the SVG tick elements, keeps the assertion off react-native-svg
    // internals.)
    await render(<RecordChart singles={SINGLES} averages={AVERAGES} />);
    const before = screen.getAllByTestId(AVERAGE_POINT_TEST_ID).map((marker) => marker.props.cy);

    await fireEvent.press(screen.getByTestId(SINGLE_LEGEND_TEST_ID));

    const after = screen.getAllByTestId(AVERAGE_POINT_TEST_ID).map((marker) => marker.props.cy);
    expect(after).toEqual(before);
  });
});
