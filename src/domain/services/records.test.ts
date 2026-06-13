import { personalRecordFlags } from '@/domain/services/records';

// Ported from the Python source's tests/test_records.py (personal_record_flags
// cases). Singles are centiseconds; a non-positive value is a DNF/DNS and can
// never be a personal record.
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
