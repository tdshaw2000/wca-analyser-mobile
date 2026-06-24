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
import type { DailySolveRange } from '@/domain/models/dailySolveRange';

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
// The narrowest time window a zoom can reach. Records are dated to the day, so
// zooming below a day reveals nothing new and only risks a degenerate span.
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MINIMUM_WINDOW_SPAN_MS = MILLISECONDS_PER_DAY;

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

/** The fastest (lower) and slowest (upper) bounds of a shaded daily-range band. */
export interface DailyRangeSeries {
  lower: ChartPoint[];
  upper: ChartPoint[];
}

/**
 * Split each day's solve range into the fastest (lower) and slowest (upper)
 * bound of a band. Both bounds share the single's scale and carry their own
 * formatted time, so a chart can shade the area between them.
 */
export function toDailyRangeSeries(dailyRanges: DailySolveRange[]): DailyRangeSeries {
  return {
    lower: dailyRanges.map((range) => boundPoint(range.date, range.fastest)),
    upper: dailyRanges.map((range) => boundPoint(range.date, range.slowest)),
  };
}

function boundPoint(date: string, value: number): ChartPoint {
  return { date, value, display: formatTime(value) };
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

/** A visible slice of the time axis, in epoch milliseconds. */
export interface TimeWindow {
  start: number;
  end: number;
}

/** The full extent of the data on the time axis, in epoch milliseconds. */
export interface TimeRange {
  min: number;
  max: number;
}

function clamp(value: number, lowest: number, highest: number): number {
  return Math.min(Math.max(value, lowest), highest);
}

/**
 * Re-window the time axis under a pinch. scaleFactor > 1 zooms in (narrows the
 * span); the focusFraction (0..1) is the point within the current window held
 * fixed under the gesture. The result is clamped so it neither widens past the
 * full data range nor zooms below the one-day floor, and is shifted to sit
 * flush against an edge rather than spilling beyond it. Net-new logic: the web's
 * Chart.js zoom plugin handled this internally, so there is no source to port.
 */
export function zoomWindow(
  window: TimeWindow,
  fullRange: TimeRange,
  scaleFactor: number,
  focusFraction: number,
): TimeWindow {
  const fullSpan = fullRange.max - fullRange.min;
  if (fullSpan <= MINIMUM_WINDOW_SPAN_MS) {
    return { start: fullRange.min, end: fullRange.max };
  }
  const currentSpan = window.end - window.start;
  const newSpan = clamp(currentSpan / scaleFactor, MINIMUM_WINDOW_SPAN_MS, fullSpan);
  if (newSpan >= fullSpan) {
    return { start: fullRange.min, end: fullRange.max };
  }
  const focusMs = window.start + focusFraction * currentSpan;
  const desiredStart = focusMs - focusFraction * newSpan;
  const start = clamp(desiredStart, fullRange.min, fullRange.max - newSpan);
  return { start, end: start + newSpan };
}

/**
 * Slide the visible window along the time axis by a fraction of its own span,
 * keeping the span fixed. A positive delta moves forward in time. The window is
 * clamped so it never slides past either edge of the data. Net-new logic, as
 * with zoomWindow.
 */
export function panWindow(
  window: TimeWindow,
  fullRange: TimeRange,
  deltaFraction: number,
): TimeWindow {
  const span = window.end - window.start;
  const shiftedStart = window.start + deltaFraction * span;
  const start = clamp(shiftedStart, fullRange.min, fullRange.max - span);
  return { start, end: start + span };
}

/**
 * The points that frame a time window for one series: those inside it, plus the
 * nearest point on each side. The bracketing points matter because a connecting
 * line can cross the window even when no vertex falls inside it — without them,
 * zooming into the gap between two records finds nothing and the result axis
 * snaps back to the full-career scale. Ported from records-chart.js.
 */
export function pointsFramingWindow(
  points: ChartPoint[],
  windowStartMs: number,
  windowEndMs: number,
): ChartPoint[] {
  const framing: ChartPoint[] = [];
  let nearestBefore: ChartPoint | null = null;
  let nearestAfter: ChartPoint | null = null;
  for (const point of points) {
    const timestamp = Date.parse(point.date);
    if (timestamp < windowStartMs) {
      if (nearestBefore === null || timestamp > Date.parse(nearestBefore.date)) {
        nearestBefore = point;
      }
    } else if (timestamp > windowEndMs) {
      if (nearestAfter === null || timestamp < Date.parse(nearestAfter.date)) {
        nearestAfter = point;
      }
    } else {
      framing.push(point);
    }
  }
  if (nearestBefore !== null) {
    framing.push(nearestBefore);
  }
  if (nearestAfter !== null) {
    framing.push(nearestAfter);
  }
  return framing;
}

/**
 * Refit the value axis to a time window: the result bounds over the points
 * framing the window across every series, so a zoomed-in period fills the
 * vertical space rather than being squashed against the full-career scale. Falls
 * back to the bounds over all points when nothing frames the window. The core of
 * the web's rescaleResultAxisToWindow.
 */
export function windowedValueBounds(series: ChartPoint[][], window: TimeWindow): ValueBounds {
  const framing = series.flatMap((points) =>
    pointsFramingWindow(points, window.start, window.end),
  );
  return resultBounds(framing.length === 0 ? series.flat() : framing);
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
