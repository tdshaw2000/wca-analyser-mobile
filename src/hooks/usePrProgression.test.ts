import { renderHook, waitFor, act } from '@testing-library/react-native';

import { usePrProgression } from '@/hooks/usePrProgression';
import { getResults } from '@/data/repositories/resultsRepository';
import { getCompetitionDates } from '@/data/repositories/competitionsRepository';
import type { Result } from '@/domain/models/result';

// Only the repositories (the I/O boundary) are mocked. The real
// singleRecordProgression runs, so this verifies the hook genuinely composes the
// fetched results + dates into a progression — not just that it calls a mock.
jest.mock('@/data/repositories/resultsRepository');
jest.mock('@/data/repositories/competitionsRepository');
const getResultsMock = getResults as jest.MockedFunction<typeof getResults>;
const getCompetitionDatesMock = getCompetitionDates as jest.MockedFunction<
  typeof getCompetitionDates
>;

const WCA_ID = '2007VALK01';
const EVENT_ID = '333';

const EARLIEST_COMPETITION_ID = 'WestonsuperMareAutumn2023';
const MIDDLE_COMPETITION_ID = 'BirminghamSummer2024';
const LATEST_COMPETITION_ID = 'RubiksUKChampionship2024';
const EARLIEST_DATE = '2023-11-18';
const MIDDLE_DATE = '2024-08-17';
const LATEST_DATE = '2024-11-01';
const EARLIEST_SINGLE = 1807;
const MIDDLE_SINGLE = 2134;
const LATEST_SINGLE = 1498;

// Out of date order, with a middle solve that is slower than the earliest (so not
// a record). average is irrelevant to a single progression; 0 stands in.
const RESULTS: Result[] = [
  { single: MIDDLE_SINGLE, average: 0, competitionId: MIDDLE_COMPETITION_ID },
  { single: EARLIEST_SINGLE, average: 0, competitionId: EARLIEST_COMPETITION_ID },
  { single: LATEST_SINGLE, average: 0, competitionId: LATEST_COMPETITION_ID },
];
const COMPETITION_DATES: Record<string, string> = {
  [EARLIEST_COMPETITION_ID]: EARLIEST_DATE,
  [MIDDLE_COMPETITION_ID]: MIDDLE_DATE,
  [LATEST_COMPETITION_ID]: LATEST_DATE,
};
const EXPECTED_PROGRESSION = [
  { date: EARLIEST_DATE, value: EARLIEST_SINGLE },
  { date: LATEST_DATE, value: LATEST_SINGLE },
];

function renderProgression(initialProps = { wcaId: WCA_ID, eventId: EVENT_ID }) {
  // Param is typed so renderHook infers its Props generic (and thus result.current);
  // an untyped destructure leaves Props as unknown.
  return renderHook(
    ({ wcaId, eventId }: { wcaId: string; eventId: string }) => usePrProgression(wcaId, eventId),
    { initialProps },
  );
}

beforeEach(() => {
  getResultsMock.mockReset();
  getCompetitionDatesMock.mockReset();
});

describe('usePrProgression', () => {
  it('does not fetch while the wca id or event id is empty', async () => {
    const { result } = await renderProgression({ wcaId: '', eventId: '' });

    expect(getResultsMock).not.toHaveBeenCalled();
    expect(getCompetitionDatesMock).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches results and dates and exposes the single-record progression', async () => {
    getResultsMock.mockResolvedValue(RESULTS);
    getCompetitionDatesMock.mockResolvedValue(COMPETITION_DATES);

    const { result } = await renderProgression();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getResultsMock).toHaveBeenCalledWith(WCA_ID, EVENT_ID);
    expect(getCompetitionDatesMock).toHaveBeenCalledWith(WCA_ID);
    expect(result.current.data).toEqual(EXPECTED_PROGRESSION);
    expect(result.current.error).toBeNull();
  });

  it('reports loading while the fetches are in flight', async () => {
    let resolveResults!: (results: Result[]) => void;
    getResultsMock.mockReturnValue(
      new Promise<Result[]>((resolve) => {
        resolveResults = resolve;
      }),
    );
    getCompetitionDatesMock.mockResolvedValue(COMPETITION_DATES);

    const { result } = await renderProgression();

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveResults(RESULTS);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(EXPECTED_PROGRESSION);
  });

  it('exposes the error and clears data when a fetch fails', async () => {
    const failure = new Error('Network request failed');
    getResultsMock.mockRejectedValue(failure);
    getCompetitionDatesMock.mockResolvedValue(COMPETITION_DATES);

    const { result } = await renderProgression();

    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('re-runs the fetch for the current ids when reload is called', async () => {
    getResultsMock.mockResolvedValue(RESULTS);
    getCompetitionDatesMock.mockResolvedValue(COMPETITION_DATES);

    const { result } = await renderProgression();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getResultsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(getResultsMock).toHaveBeenCalledTimes(2));
  });
});
