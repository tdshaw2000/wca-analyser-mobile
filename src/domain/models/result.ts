/**
 * Domain model: a competitor's single and average for one event at one
 * competition. Decoupled from the raw API wire format (see src/data/api/types.ts).
 * Pure TypeScript — no React, RN, network, or SQLite imports allowed here.
 *
 * Ported from the Python source's Result dataclass (wca_client.py). Singles are
 * centiseconds; a non-positive single is a DNF/DNS and is skipped by the PR
 * computation (a later domain service).
 */
export interface Result {
  /** Best single, in centiseconds. Non-positive means DNF/DNS. */
  single: number;
  /** Best average, in centiseconds. Non-positive / 0 means none recorded. */
  average: number;
  /** The competition this result was set at, e.g. "RubiksUKChampionship2024". */
  competitionId: string;
}
