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
// Averages chosen so each competition sets an average PR (a steady improvement) —
// a different shape from the single progression (whose middle solve is not a
// record), proving the hook computes the two metrics independently.
const EARLIEST_AVERAGE = 2050;
const MIDDLE_AVERAGE = 1990;
const LATEST_AVERAGE = 1850;

// Each round's individual attempts (best included), so the all-results series can
// be checked: every solve, not just the round's best.
const EARLIEST_SOLVES = [EARLIEST_SINGLE, 2000, 1900];
const MIDDLE_SOLVES = [MIDDLE_SINGLE, 2200, 2300];
const LATEST_SOLVES = [LATEST_SINGLE, 1550, 1600];

// Out of date order, with a middle single that is slower than the earliest (so not
// a single record, though its average still is).
const RESULTS: Result[] = [
  {
    single: MIDDLE_SINGLE,
    average: MIDDLE_AVERAGE,
    solves: MIDDLE_SOLVES,
    competitionId: MIDDLE_COMPETITION_ID,
  },
  {
    single: EARLIEST_SINGLE,
    average: EARLIEST_AVERAGE,
    solves: EARLIEST_SOLVES,
    competitionId: EARLIEST_COMPETITION_ID,
  },
  {
    single: LATEST_SINGLE,
    average: LATEST_AVERAGE,
    solves: LATEST_SOLVES,
    competitionId: LATEST_COMPETITION_ID,
  },
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
const EXPECTED_AVERAGE_PROGRESSION = [
  { date: EARLIEST_DATE, value: EARLIEST_AVERAGE },
  { date: MIDDLE_DATE, value: MIDDLE_AVERAGE },
  { date: LATEST_DATE, value: LATEST_AVERAGE },
];
// The all-results series keep every solve / every average, in date order.
const EXPECTED_ALL_SINGLES = [
  { date: EARLIEST_DATE, value: EARLIEST_SINGLE },
  { date: EARLIEST_DATE, value: 2000 },
  { date: EARLIEST_DATE, value: 1900 },
  { date: MIDDLE_DATE, value: MIDDLE_SINGLE },
  { date: MIDDLE_DATE, value: 2200 },
  { date: MIDDLE_DATE, value: 2300 },
  { date: LATEST_DATE, value: LATEST_SINGLE },
  { date: LATEST_DATE, value: 1550 },
  { date: LATEST_DATE, value: 1600 },
];
const EXPECTED_ALL_AVERAGES = [
  { date: EARLIEST_DATE, value: EARLIEST_AVERAGE },
  { date: MIDDLE_DATE, value: MIDDLE_AVERAGE },
  { date: LATEST_DATE, value: LATEST_AVERAGE },
];
// Each day's fastest/slowest solve, pooled from its round above, in date order.
const EXPECTED_DAILY_RANGES = [
  { date: EARLIEST_DATE, fastest: EARLIEST_SINGLE, slowest: 2000 },
  { date: MIDDLE_DATE, fastest: MIDDLE_SINGLE, slowest: 2300 },
  { date: LATEST_DATE, fastest: LATEST_SINGLE, slowest: 1600 },
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
    expect(result.current.averages).toEqual([]);
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

  it('exposes the average-record progression alongside the singles', async () => {
    getResultsMock.mockResolvedValue(RESULTS);
    getCompetitionDatesMock.mockResolvedValue(COMPETITION_DATES);

    const { result } = await renderProgression();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.averages).toEqual(EXPECTED_AVERAGE_PROGRESSION);
  });

  it('exposes every solve and every average over time for the scatter', async () => {
    getResultsMock.mockResolvedValue(RESULTS);
    getCompetitionDatesMock.mockResolvedValue(COMPETITION_DATES);

    const { result } = await renderProgression();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allSingles).toEqual(EXPECTED_ALL_SINGLES);
    expect(result.current.allAverages).toEqual(EXPECTED_ALL_AVERAGES);
  });

  it('exposes each day’s solve range for the daily-range band', async () => {
    getResultsMock.mockResolvedValue(RESULTS);
    getCompetitionDatesMock.mockResolvedValue(COMPETITION_DATES);

    const { result } = await renderProgression();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.dailyRanges).toEqual(EXPECTED_DAILY_RANGES);
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
