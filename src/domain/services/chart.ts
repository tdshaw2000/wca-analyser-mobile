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

const CENTISECONDS_PER_SECOND = 100;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PAD_WIDTH = 2;
const PAD_CHARACTER = '0';
// The result axis is padded by this fraction of the range at each end so the
// extreme records do not sit hard against the chart edges.
const RESULT_AXIS_PADDING_FRACTION = 0.05;
const AXIS_FLOOR = 0;
const NO_FULL_MINUTE = 0;
const LAST_INDEX_OFFSET = 1;

export interface ValueBounds {
  min: number;
  max: number;
}

export interface DateBounds {
  min: string;
  max: string;
}

/** Turn a record progression into chart points carrying date, plotted value, and label. */
export function toRecordSeries(progression: RecordPoint[]): ChartPoint[] {
  return progression.map((record) => ({
    date: record.date,
    value: record.value,
    display: formatTime(record.value),
  }));
}

/** The padded value range to draw the result axis over, never dropping below zero. */
export function resultBounds(points: ChartPoint[]): ValueBounds {
  const values = points.map((point) => point.value);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const range = highest - lowest;
  const padding = (range || highest) * RESULT_AXIS_PADDING_FRACTION;
  return { min: Math.max(AXIS_FLOOR, lowest - padding), max: highest + padding };
}

/** The earliest and latest dates across the points, for the time axis span. */
export function dateBounds(points: ChartPoint[]): DateBounds {
  const dates = points.map((point) => point.date).sort();
  return { min: dates[0], max: dates[dates.length - LAST_INDEX_OFFSET] };
}

/** Render a result-axis tick: whole seconds, as "m:ss" once it reaches a minute. */
export function formatAxisTick(centiseconds: number): string {
  const totalSeconds = Math.round(centiseconds / CENTISECONDS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  if (minutes > NO_FULL_MINUTE) {
    return `${minutes}:${String(seconds).padStart(SECONDS_PAD_WIDTH, PAD_CHARACTER)}`;
  }
  return String(seconds);
}
