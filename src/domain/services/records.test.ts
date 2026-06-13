import { personalRecordFlags, singleRecordProgression } from '@/domain/services/records';
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
