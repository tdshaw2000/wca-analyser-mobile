/**
 * Domain model: a personal-record value and the date it was set — one point on a
 * competitor's PR progression for an event. Pure TypeScript — no React, RN,
 * network, or SQLite imports allowed here.
 *
 * Ported from the Python source's RecordPoint dataclass (records.py).
 */
export interface RecordPoint {
  /** Competition start date the record was set on (ISO yyyy-mm-dd). */
  date: string;
  /** The record value, in centiseconds. */
  value: number;
}
