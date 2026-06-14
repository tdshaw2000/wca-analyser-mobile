import { toRecordSeries, resultBounds, dateBounds, formatAxisTick } from '@/domain/services/chart';
import type { ChartPoint } from '@/domain/models/chartPoint';
import type { RecordPoint } from '@/domain/models/recordPoint';

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
