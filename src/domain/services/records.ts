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
import type { Result } from '@/domain/models/result';
import type { RecordPoint } from '@/domain/models/recordPoint';

/** Selects the metric (single or average) a progression is computed over. */
type Metric = (result: Result) => number;

const NON_RESULT_THRESHOLD = 0;

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

/** Return the personal-record singles, with their dates, in chronological order. */
export function singleRecordProgression(
  results: Result[],
  competitionDates: Record<string, string>,
): RecordPoint[] {
  return recordProgression(results, competitionDates, (result) => result.single);
}

/** Return the personal-record averages, with their dates, in chronological order. */
export function averageRecordProgression(
  results: Result[],
  competitionDates: Record<string, string>,
): RecordPoint[] {
  return recordProgression(results, competitionDates, (result) => result.average);
}

/**
 * Return every individual solve, with its date, in chronological order. Each
 * result contributes all of its attempts (not just the round's best), keeping
 * their within-round order; non-positive solves (DNF/DNS, or unused slots) are
 * skipped. A result missing its solves contributes none.
 */
export function allSolvesOverTime(
  results: Result[],
  competitionDates: Record<string, string>,
): RecordPoint[] {
  const datedResults = [...results].sort((first, second) =>
    competitionDates[first.competitionId].localeCompare(competitionDates[second.competitionId]),
  );
  return datedResults.flatMap((result) => {
    const date = competitionDates[result.competitionId];
    return (result.solves ?? [])
      .filter((solve) => solve > NON_RESULT_THRESHOLD)
      .map((solve) => ({ date, value: solve }));
  });
}

/**
 * Return every attempted average, with its date, in chronological order. Unlike
 * the average progression this keeps every attempt, not only the record-setters;
 * non-positive averages (DNF/DNS, or formats without an average) are skipped.
 */
export function averageResultsOverTime(
  results: Result[],
  competitionDates: Record<string, string>,
): RecordPoint[] {
  return resultsOverTime(results, competitionDates, (result) => result.average);
}

// Shared by the over-time series: a metric's attempted values, with dates, in
// chronological order, dropping the non-positive (non-result) ones.
function resultsOverTime(
  results: Result[],
  competitionDates: Record<string, string>,
  metric: Metric,
): RecordPoint[] {
  const datedResults = [...results].sort((first, second) =>
    competitionDates[first.competitionId].localeCompare(competitionDates[second.competitionId]),
  );
  return datedResults
    .filter((result) => metric(result) > NON_RESULT_THRESHOLD)
    .map((result) => ({ date: competitionDates[result.competitionId], value: metric(result) }));
}

function recordProgression(
  results: Result[],
  competitionDates: Record<string, string>,
  metric: Metric,
): RecordPoint[] {
  // ISO yyyy-mm-dd dates sort chronologically as strings; sort is stable, so
  // results sharing a date keep their original order (the later, faster record
  // then overwrites the earlier one below).
  const datedResults = [...results].sort((first, second) =>
    competitionDates[first.competitionId].localeCompare(competitionDates[second.competitionId]),
  );
  const flags = personalRecordFlags(datedResults.map(metric));
  // Keyed by date so only the best record per date survives; a Map preserves the
  // first-seen (chronological) order of its keys for the returned progression.
  const recordsByDate = new Map<string, RecordPoint>();
  datedResults.forEach((result, index) => {
    if (flags[index]) {
      const date = competitionDates[result.competitionId];
      recordsByDate.set(date, { date, value: metric(result) });
    }
  });
  return Array.from(recordsByDate.values());
}
