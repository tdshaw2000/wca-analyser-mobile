import {
  toRecordSeries,
  toDailyRangeSeries,
  resultBounds,
  dateBounds,
  formatAxisTick,
  pointsFramingWindow,
  zoomWindow,
} from '@/domain/services/chart';
import type { ChartPoint } from '@/domain/models/chartPoint';
import type { RecordPoint } from '@/domain/models/recordPoint';
import type { DailySolveRange } from '@/domain/models/dailySolveRange';

// Ported from the Python source's tests/test_chart.py — the timed-event cases
// only. Multi-Blind (333mbf) and Fewest-Moves (333fm), which need the eventId
// and isAverage arguments, are a later slice. Singles are centiseconds.
const EARLIEST_DATE = '2023-11-18';
const LATEST_DATE = '2024-11-01';
const EARLIEST_SINGLE = 1807;
const LATEST_SINGLE = 1498;
const EARLIEST_DISPLAY = '18.07';
const LATEST_DISPLAY = '14.98';

const PROGRESSION: RecordPoint[] = [
  { date: EARLIEST_DATE, value: EARLIEST_SINGLE },
  { date: LATEST_DATE, value: LATEST_SINGLE },
];

describe('toRecordSeries', () => {
  it('carries each record date, centisecond value, and formatted time', () => {
    expect(toRecordSeries(PROGRESSION)).toEqual([
      { date: EARLIEST_DATE, value: EARLIEST_SINGLE, display: EARLIEST_DISPLAY },
      { date: LATEST_DATE, value: LATEST_SINGLE, display: LATEST_DISPLAY },
    ]);
  });

  it('maps an empty progression to an empty series', () => {
    expect(toRecordSeries([])).toEqual([]);
  });
});

describe('toDailyRangeSeries', () => {
  const EARLIEST_SLOWEST = 2100;
  const LATEST_SLOWEST = 1700;
  const EARLIEST_SLOWEST_DISPLAY = '21.00';
  const LATEST_SLOWEST_DISPLAY = '17.00';
  const RANGES: DailySolveRange[] = [
    { date: EARLIEST_DATE, fastest: EARLIEST_SINGLE, slowest: EARLIEST_SLOWEST },
    { date: LATEST_DATE, fastest: LATEST_SINGLE, slowest: LATEST_SLOWEST },
  ];

  it('splits each day into a fastest (lower) and slowest (upper) bound', () => {
    expect(toDailyRangeSeries(RANGES)).toEqual({
      lower: [
        { date: EARLIEST_DATE, value: EARLIEST_SINGLE, display: EARLIEST_DISPLAY },
        { date: LATEST_DATE, value: LATEST_SINGLE, display: LATEST_DISPLAY },
      ],
      upper: [
        { date: EARLIEST_DATE, value: EARLIEST_SLOWEST, display: EARLIEST_SLOWEST_DISPLAY },
        { date: LATEST_DATE, value: LATEST_SLOWEST, display: LATEST_SLOWEST_DISPLAY },
      ],
    });
  });

  it('maps no ranges to empty bounds', () => {
    expect(toDailyRangeSeries([])).toEqual({ lower: [], upper: [] });
  });
});

// Axis helpers ported from the Python source's static/records-chart.js (which has
// no pytest — the JS is the spec). They put both progressions on a shared scale.
function chartPoint(date: string, value: number): ChartPoint {
  return { date, value, display: String(value) };
}

describe('resultBounds', () => {
  it('pads the value range by five percent at each end', () => {
    const bounds = resultBounds([chartPoint('2024-01-01', 1000), chartPoint('2024-02-01', 2000)]);

    // range 1000 -> padding 50.
    expect(bounds).toEqual({ min: 950, max: 2050 });
  });

  it('pads a zero range by five percent of the value itself', () => {
    const bounds = resultBounds([chartPoint('2024-01-01', 2000)]);

    // range 0 -> padding is 5% of 2000 = 100.
    expect(bounds).toEqual({ min: 1900, max: 2100 });
  });

  it('never drops the lower bound below zero', () => {
    const bounds = resultBounds([chartPoint('2024-01-01', 5), chartPoint('2024-02-01', 1000)]);

    // 5 - (995 * 0.05) is negative, so it clamps to 0.
    expect(bounds.min).toBe(0);
  });
});

describe('dateBounds', () => {
  it('returns the earliest and latest dates across the points', () => {
    const bounds = dateBounds([
      chartPoint('2024-11-01', 1),
      chartPoint('2023-11-18', 1),
      chartPoint('2024-03-02', 1),
    ]);

    expect(bounds).toEqual({ min: '2023-11-18', max: '2024-11-01' });
  });
});

// Ported from records-chart.js's pointsFramingWindow. The bracketing points
// matter because a connecting line can cross a time window even when no vertex
// falls inside it; without them, zooming into the gap between two records would
// find nothing and the result axis would snap back to the full-career scale.
describe('pointsFramingWindow', () => {
  const POINT_JAN = chartPoint('2024-01-01', 100);
  const POINT_FEB = chartPoint('2024-02-01', 200);
  const POINT_MAR = chartPoint('2024-03-01', 300);
  const POINT_APR = chartPoint('2024-04-01', 400);
  const SERIES = [POINT_JAN, POINT_FEB, POINT_MAR, POINT_APR];

  it('returns the points inside the window plus the nearest point each side', () => {
    const start = Date.parse('2024-02-15');
    const end = Date.parse('2024-03-15');

    // POINT_MAR is inside; POINT_FEB brackets before, POINT_APR brackets after.
    expect(pointsFramingWindow(SERIES, start, end)).toEqual([POINT_MAR, POINT_FEB, POINT_APR]);
  });

  it('still returns the bracketing points when the window falls between two records', () => {
    const start = Date.parse('2024-02-10');
    const end = Date.parse('2024-02-20');

    // Nothing inside; POINT_FEB brackets before, POINT_MAR brackets after.
    expect(pointsFramingWindow(SERIES, start, end)).toEqual([POINT_FEB, POINT_MAR]);
  });

  it('returns an empty array for an empty series', () => {
    expect(pointsFramingWindow([], Date.parse('2024-01-01'), Date.parse('2024-12-31'))).toEqual([]);
  });
});

// Net-new logic with no Python/web source: the Chart.js zoom plugin did this
// internally. zoomWindow turns a pinch scale into a new, clamped time window.
// scaleFactor > 1 zooms in (narrows the span); the focusFraction (0..1) is the
// point within the current window that stays put under the pinch.
describe('zoomWindow', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const FULL_RANGE = { min: 0, max: 100 * DAY_MS };

  it('zooms in by narrowing the span around the focus point', () => {
    const zoomed = zoomWindow({ start: 0, end: 100 * DAY_MS }, FULL_RANGE, 2, 0.5);

    // span 100d / 2 = 50d, centred on the midpoint (day 50) -> days 25..75.
    expect(zoomed).toEqual({ start: 25 * DAY_MS, end: 75 * DAY_MS });
  });

  it('clamps a zoom-out back to the full data range', () => {
    const zoomed = zoomWindow({ start: 25 * DAY_MS, end: 75 * DAY_MS }, FULL_RANGE, 0.5, 0.5);

    // span 50d / 0.5 = 100d = the full span, so it can not widen further.
    expect(zoomed).toEqual({ start: 0, end: 100 * DAY_MS });
  });

  it('floors the span at one day so it can not zoom in indefinitely', () => {
    const zoomed = zoomWindow({ start: 0, end: 2 * DAY_MS }, FULL_RANGE, 10, 0);

    // 2d / 10 = 0.2d, floored to 1d; focus 0 keeps the left edge fixed.
    expect(zoomed).toEqual({ start: 0, end: DAY_MS });
  });

  it('shifts the window so it never spills past the full range edge', () => {
    const zoomed = zoomWindow({ start: 60 * DAY_MS, end: 100 * DAY_MS }, FULL_RANGE, 0.5, 0.5);

    // span 40d / 0.5 = 80d; centred it would start at day 40, but that ends past
    // day 100, so it shifts left to sit flush against the right edge (days 20..100).
    expect(zoomed).toEqual({ start: 20 * DAY_MS, end: 100 * DAY_MS });
  });
});

describe('formatAxisTick', () => {
  it('renders sub-minute values as whole seconds', () => {
    expect(formatAxisTick(1498)).toBe('15');
  });

  it('renders a minute-or-more value as minutes and zero-padded seconds', () => {
    expect(formatAxisTick(7674)).toBe('1:17');
  });

  it('zero-pads the seconds on an exact minute', () => {
    expect(formatAxisTick(6000)).toBe('1:00');
  });
});
