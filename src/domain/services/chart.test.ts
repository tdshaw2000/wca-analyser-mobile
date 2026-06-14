import { toRecordSeries } from '@/domain/services/chart';
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
