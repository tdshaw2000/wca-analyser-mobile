import {
  allSolvesOverTime,
  averageRecordProgression,
  averageResultsOverTime,
  dailySolveRangeOverTime,
  personalRecordFlags,
  singleRecordProgression,
} from '@/domain/services/records';
import type { Result } from '@/domain/models/result';

// Ported from the Python source's tests/test_records.py. Singles are
// centiseconds; a non-positive value is a DNF/DNS and can never be a record.
const FIRST_SOLVE = 1807;
const IMPROVED_SOLVE = 1777;
const SLOWER_SOLVE = 2134;
const NEW_BEST_SOLVE = 1355;
const DID_NOT_FINISH = -1;
const DID_NOT_START = -2;

describe('personalRecordFlags', () => {
  it('marks each solve that beats every preceding solve', () => {
    const flags = personalRecordFlags([
      FIRST_SOLVE,
      IMPROVED_SOLVE,
      SLOWER_SOLVE,
      NEW_BEST_SOLVE,
    ]);

    expect(flags).toEqual([true, true, false, true]);
  });

  it('never flags a did-not-finish or did-not-start (non-positive) value', () => {
    const flags = personalRecordFlags([
      DID_NOT_FINISH,
      FIRST_SOLVE,
      DID_NOT_START,
      NEW_BEST_SOLVE,
    ]);

    expect(flags).toEqual([false, true, false, true]);
  });
});

const EARLIEST_COMPETITION_ID = 'WestonsuperMareAutumn2023';
const MIDDLE_COMPETITION_ID = 'BirminghamSummer2024';
const LATEST_COMPETITION_ID = 'RubiksUKChampionship2024';

const EARLIEST_DATE = '2023-11-18';
const MIDDLE_DATE = '2024-08-17';
const LATEST_DATE = '2024-11-01';

const EARLIEST_SINGLE = 1807;
const MIDDLE_SINGLE = 2134;
const LATEST_SINGLE = 1498;
const SAME_DATE_FASTER_SINGLE = 1777;

const COMPETITION_DATES: Record<string, string> = {
  [EARLIEST_COMPETITION_ID]: EARLIEST_DATE,
  [MIDDLE_COMPETITION_ID]: MIDDLE_DATE,
  [LATEST_COMPETITION_ID]: LATEST_DATE,
};

// average is irrelevant to single progression; 0 stands in for "not under test".
function single(value: number, competitionId: string): Result {
  return { single: value, average: 0, competitionId };
}

describe('singleRecordProgression', () => {
  it('returns only the chronological single records, in date order', () => {
    const results = [
      single(MIDDLE_SINGLE, MIDDLE_COMPETITION_ID),
      single(EARLIEST_SINGLE, EARLIEST_COMPETITION_ID),
      single(LATEST_SINGLE, LATEST_COMPETITION_ID),
    ];

    const progression = singleRecordProgression(results, COMPETITION_DATES);

    // The middle solve (slower than the earliest) is not a record and is dropped.
    expect(progression).toEqual([
      { date: EARLIEST_DATE, value: EARLIEST_SINGLE },
      { date: LATEST_DATE, value: LATEST_SINGLE },
    ]);
  });

  it('keeps only the best record per date when several land on one date', () => {
    const datesForOneDate: Record<string, string> = {
      [EARLIEST_COMPETITION_ID]: EARLIEST_DATE,
      [LATEST_COMPETITION_ID]: LATEST_DATE,
    };
    const results = [
      single(EARLIEST_SINGLE, EARLIEST_COMPETITION_ID),
      single(SAME_DATE_FASTER_SINGLE, EARLIEST_COMPETITION_ID),
      single(LATEST_SINGLE, LATEST_COMPETITION_ID),
    ];

    const progression = singleRecordProgression(results, datesForOneDate);

    expect(progression).toEqual([
      { date: EARLIEST_DATE, value: SAME_DATE_FASTER_SINGLE },
      { date: LATEST_DATE, value: LATEST_SINGLE },
    ]);
  });
});

const EARLIEST_AVERAGE = 2456;
const MIDDLE_AVERAGE = 2890;
const LATEST_AVERAGE = 2012;

describe('averageRecordProgression', () => {
  it('returns only the chronological average records, in date order', () => {
    const results: Result[] = [
      { single: MIDDLE_SINGLE, average: MIDDLE_AVERAGE, competitionId: MIDDLE_COMPETITION_ID },
      { single: EARLIEST_SINGLE, average: EARLIEST_AVERAGE, competitionId: EARLIEST_COMPETITION_ID },
      { single: LATEST_SINGLE, average: LATEST_AVERAGE, competitionId: LATEST_COMPETITION_ID },
    ];

    const progression = averageRecordProgression(results, COMPETITION_DATES);

    // The middle average (slower than the earliest) is not a record and is dropped.
    expect(progression).toEqual([
      { date: EARLIEST_DATE, value: EARLIEST_AVERAGE },
      { date: LATEST_DATE, value: LATEST_AVERAGE },
    ]);
  });
});

describe('averageResultsOverTime', () => {
  it('keeps every attempted average chronologically, including non-records', () => {
    const results: Result[] = [
      { single: MIDDLE_SINGLE, average: MIDDLE_AVERAGE, competitionId: MIDDLE_COMPETITION_ID },
      { single: EARLIEST_SINGLE, average: EARLIEST_AVERAGE, competitionId: EARLIEST_COMPETITION_ID },
      { single: LATEST_SINGLE, average: LATEST_AVERAGE, competitionId: LATEST_COMPETITION_ID },
    ];

    const points = averageResultsOverTime(results, COMPETITION_DATES);

    // Unlike the progression, the slower middle average is kept — every attempt shows.
    expect(points).toEqual([
      { date: EARLIEST_DATE, value: EARLIEST_AVERAGE },
      { date: MIDDLE_DATE, value: MIDDLE_AVERAGE },
      { date: LATEST_DATE, value: LATEST_AVERAGE },
    ]);
  });

  it('skips results whose average is a did-not-finish (non-positive)', () => {
    const results: Result[] = [
      { single: DID_NOT_FINISH, average: EARLIEST_AVERAGE, competitionId: EARLIEST_COMPETITION_ID },
      { single: LATEST_SINGLE, average: DID_NOT_FINISH, competitionId: LATEST_COMPETITION_ID },
      { single: LATEST_SINGLE, average: LATEST_AVERAGE, competitionId: MIDDLE_COMPETITION_ID },
    ];

    const points = averageResultsOverTime(results, COMPETITION_DATES);

    // The DNF average is dropped; a missing single does not exclude its average.
    expect(points).toEqual([
      { date: EARLIEST_DATE, value: EARLIEST_AVERAGE },
      { date: MIDDLE_DATE, value: LATEST_AVERAGE },
    ]);
  });
});

describe('allSolvesOverTime', () => {
  it('keeps every individual solve chronologically, in within-round order', () => {
    const earliestSolves = [EARLIEST_SINGLE, 2100, DID_NOT_FINISH, 1950, 2050];
    const latestSolves = [LATEST_SINGLE, 1600, 1700];
    const results: Result[] = [
      { single: LATEST_SINGLE, average: 0, solves: latestSolves, competitionId: LATEST_COMPETITION_ID },
      { single: EARLIEST_SINGLE, average: 0, solves: earliestSolves, competitionId: EARLIEST_COMPETITION_ID },
    ];

    const points = allSolvesOverTime(results, COMPETITION_DATES);

    // Earliest round first, its solves in order with the DNF dropped, then latest.
    expect(points).toEqual([
      { date: EARLIEST_DATE, value: EARLIEST_SINGLE },
      { date: EARLIEST_DATE, value: 2100 },
      { date: EARLIEST_DATE, value: 1950 },
      { date: EARLIEST_DATE, value: 2050 },
      { date: LATEST_DATE, value: LATEST_SINGLE },
      { date: LATEST_DATE, value: 1600 },
      { date: LATEST_DATE, value: 1700 },
    ]);
  });

  it('skips did-not-finish, did-not-start and unused (non-positive) solves', () => {
    const solvesWithNonResults = [DID_NOT_FINISH, DID_NOT_START, 0, EARLIEST_SINGLE];
    const results: Result[] = [
      {
        single: EARLIEST_SINGLE,
        average: 0,
        solves: solvesWithNonResults,
        competitionId: EARLIEST_COMPETITION_ID,
      },
    ];

    const points = allSolvesOverTime(results, COMPETITION_DATES);

    expect(points).toEqual([{ date: EARLIEST_DATE, value: EARLIEST_SINGLE }]);
  });
});

describe('dailySolveRangeOverTime', () => {
  const EARLIEST_FASTEST = 1750;
  const EARLIEST_SLOWEST = 2200;

  it('spans the fastest to slowest solve, pooled across a date’s rounds', () => {
    // Two rounds fall on the earliest date; their solves pool into one range.
    const firstRoundSolves = [EARLIEST_SINGLE, 2100, 1950];
    const secondRoundSolves = [EARLIEST_FASTEST, EARLIEST_SLOWEST];
    const latestSolves = [LATEST_SINGLE, 1600, 1700];
    const results: Result[] = [
      { single: LATEST_SINGLE, average: 0, solves: latestSolves, competitionId: LATEST_COMPETITION_ID },
      { single: EARLIEST_SINGLE, average: 0, solves: firstRoundSolves, competitionId: EARLIEST_COMPETITION_ID },
      { single: EARLIEST_FASTEST, average: 0, solves: secondRoundSolves, competitionId: EARLIEST_COMPETITION_ID },
    ];

    const ranges = dailySolveRangeOverTime(results, COMPETITION_DATES);

    expect(ranges).toEqual([
      { date: EARLIEST_DATE, fastest: EARLIEST_FASTEST, slowest: EARLIEST_SLOWEST },
      { date: LATEST_DATE, fastest: LATEST_SINGLE, slowest: 1700 },
    ]);
  });

  it('skips dates whose solves are all non-results', () => {
    const finishedAndNonResults = [DID_NOT_FINISH, DID_NOT_START, 0, EARLIEST_SINGLE];
    const allNonResults = [DID_NOT_FINISH, 0];
    const results: Result[] = [
      { single: EARLIEST_SINGLE, average: 0, solves: finishedAndNonResults, competitionId: EARLIEST_COMPETITION_ID },
      { single: DID_NOT_FINISH, average: 0, solves: allNonResults, competitionId: LATEST_COMPETITION_ID },
    ];

    const ranges = dailySolveRangeOverTime(results, COMPETITION_DATES);

    expect(ranges).toEqual([
      { date: EARLIEST_DATE, fastest: EARLIEST_SINGLE, slowest: EARLIEST_SINGLE },
    ]);
  });
});
