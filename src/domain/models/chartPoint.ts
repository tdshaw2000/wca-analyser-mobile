/**
 * Domain model: one point of a personal-record progression shaped for charting.
 * Pure TypeScript — no React, RN, network, or SQLite imports allowed here.
 *
 * Ported from the chart points produced by the Python source's chart.py. That
 * code keys the points "x"/"y"/"display" to feed Chart.js on the web; we render
 * with hand-rolled SVG instead, so the domain layer carries semantic names
 * (matching RecordPoint's date/value) rather than a charting lib's wire format.
 */
export interface ChartPoint {
  /** Competition start date the record was set on (ISO yyyy-mm-dd). */
  date: string;
  /** The value plotted on the chart's vertical axis (centiseconds for timed events). */
  value: number;
  /** The human-readable label for this point (e.g. "14.98"). */
  display: string;
}
