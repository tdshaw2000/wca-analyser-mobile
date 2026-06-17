import { getResults } from '@/data/repositories/resultsRepository';
import { wcaGet } from '@/data/api/wcaClient';

// Ported from the Python source's tests/test_wca_client.py (get_results cases).
// wcaGet is mocked so the repository's DTO->domain mapping and request shape are
// tested in isolation, with no network.
jest.mock('@/data/api/wcaClient');
const wcaGetMock = wcaGet as jest.MockedFunction<typeof wcaGet>;

const WCA_ID = '2023SHAW10';
const EVENT_ID = '333';
const FIRST_COMPETITION_ID = 'WestonsuperMareAutumn2023';
const SECOND_COMPETITION_ID = 'RubiksUKChampionship2024';
const FIRST_SINGLE = 1807;
const SECOND_SINGLE = 1498;
const FIRST_AVERAGE = 2177;
const SECOND_AVERAGE = 1646;
// Each result's individual attempts (the round's solves), best included.
const FIRST_ATTEMPTS = [FIRST_SINGLE, 2100, 1950, 2200, 2050];
const SECOND_ATTEMPTS = [SECOND_SINGLE, 1600, 1700, 1550, 1650];

// The API returns more fields per result (event_id, round_type_id, …); we only
// consume the single (best), average, individual attempts and competition.
const RESULTS_RESPONSE = [
  {
    best: FIRST_SINGLE,
    average: FIRST_AVERAGE,
    attempts: FIRST_ATTEMPTS,
    event_id: EVENT_ID,
    competition_id: FIRST_COMPETITION_ID,
    round_type_id: 'd',
  },
  {
    best: SECOND_SINGLE,
    average: SECOND_AVERAGE,
    attempts: SECOND_ATTEMPTS,
    event_id: EVENT_ID,
    competition_id: SECOND_COMPETITION_ID,
    round_type_id: 'f',
  },
];

beforeEach(() => {
  wcaGetMock.mockReset();
});

describe('getResults', () => {
  it('maps each result to its single, average, solves and competition', async () => {
    wcaGetMock.mockResolvedValue(RESULTS_RESPONSE);

    const results = await getResults(WCA_ID, EVENT_ID);

    expect(results).toEqual([
      {
        single: FIRST_SINGLE,
        average: FIRST_AVERAGE,
        solves: FIRST_ATTEMPTS,
        competitionId: FIRST_COMPETITION_ID,
      },
      {
        single: SECOND_SINGLE,
        average: SECOND_AVERAGE,
        solves: SECOND_ATTEMPTS,
        competitionId: SECOND_COMPETITION_ID,
      },
    ]);
  });

  it('requests the event results for the competitor', async () => {
    wcaGetMock.mockResolvedValue([]);

    await getResults(WCA_ID, EVENT_ID);

    expect(wcaGetMock).toHaveBeenCalledWith(`/persons/${WCA_ID}/results`, {
      query: { event_id: EVENT_ID },
    });
  });

  it('returns an empty list when the competitor has no results for the event', async () => {
    wcaGetMock.mockResolvedValue([]);

    await expect(getResults(WCA_ID, 'minx')).resolves.toEqual([]);
  });
});
