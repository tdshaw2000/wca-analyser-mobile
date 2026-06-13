/**
 * Detection of personal records (PRs) within a competitor's results.
 *
 * The WCA API does not flag PRs; we compute them ourselves. A result is a PR
 * when it beats all of that competitor's prior results for the same event, with
 * results taken in competition-date order. Singles/averages are centiseconds;
 * non-positive values are DNF/DNS and can never be a record.
 *
 * Pure TypeScript — no React, RN, network, or SQLite imports allowed here.
 * Ported from the Python source's records.py.
 */

/** Flag each value that beats every preceding value, in the order given. */
export function personalRecordFlags(values: number[]): boolean[] {
  const flags: boolean[] = [];
  let bestSoFar: number | null = null;
  for (const value of values) {
    const isAttempted = value > 0;
    const isRecord = isAttempted && (bestSoFar === null || value < bestSoFar);
    flags.push(isRecord);
    if (isRecord) bestSoFar = value;
  }
  return flags;
}
