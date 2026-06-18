/**
 * Domain model: the fastest and slowest finished solve on a single date.
 * Pure TypeScript — no React, RN, network, or SQLite imports allowed here.
 *
 * Spans the day's solves regardless of which round they fell in; both bounds
 * are raw centiseconds, so they share the single's scale (a chart can shade the
 * area between them). Ported from the Python source's records.py DailySolveRange.
 */
export interface DailySolveRange {
  /** Competition start date the solves were done on (ISO yyyy-mm-dd). */
  date: string;
  /** The fastest (lowest) finished solve of the day, in centiseconds. */
  fastest: number;
  /** The slowest (highest) finished solve of the day, in centiseconds. */
  slowest: number;
}
