/**
 * Shaping of personal-record data into a series for charting. Pure domain logic
 * ported from the Python source's chart.py.
 *
 * This slice covers timed events only (e.g. "333"): the plotted value is the raw
 * centisecond value and the label is its formatted time. The Multi-Blind ("333mbf",
 * plotted by points) and Fewest-Moves ("333fm", averages scaled to moves) cases
 * from chart.py — which need an eventId and isAverage argument — are a later slice.
 */
import { formatTime } from '@/domain/services/formatting';
import type { ChartPoint } from '@/domain/models/chartPoint';
import type { RecordPoint } from '@/domain/models/recordPoint';

/** Turn a record progression into chart points carrying date, plotted value, and label. */
export function toRecordSeries(progression: RecordPoint[]): ChartPoint[] {
  return progression.map((record) => ({
    date: record.date,
    value: record.value,
    display: formatTime(record.value),
  }));
}
