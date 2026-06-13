import { getCompetitionDates } from '@/data/repositories/competitionsRepository';
import { wcaGet } from '@/data/api/wcaClient';

// Ported from the Python source's tests/test_wca_client.py
// (get_competition_dates cases). wcaGet is mocked so the repository's
// DTO->domain mapping and request shape are tested in isolation, with no network.
jest.mock('@/data/api/wcaClient');
const wcaGetMock = wcaGet as jest.MockedFunction<typeof wcaGet>;

const WCA_ID = '2023SHAW10';
const FIRST_COMPETITION_ID = 'WestonsuperMareAutumn2023';
const SECOND_COMPETITION_ID = 'RubiksUKChampionship2024';
const FIRST_COMPETITION_START_DATE = '2023-11-18';
const SECOND_COMPETITION_START_DATE = '2024-11-01';

// The API element also carries end_date, name, etc.; we only consume id and
// start_date — the start date is what orders results for PR computation.
const COMPETITIONS_RESPONSE = [
  {
    id: FIRST_COMPETITION_ID,
    start_date: FIRST_COMPETITION_START_DATE,
    end_date: '2023-11-19',
  },
  {
    id: SECOND_COMPETITION_ID,
    start_date: SECOND_COMPETITION_START_DATE,
    end_date: '2024-11-03',
  },
];

beforeEach(() => {
  wcaGetMock.mockReset();
});

describe('getCompetitionDates', () => {
  it('maps each competition to its start date', async () => {
    wcaGetMock.mockResolvedValue(COMPETITIONS_RESPONSE);

    const dates = await getCompetitionDates(WCA_ID);

    expect(dates).toEqual({
      [FIRST_COMPETITION_ID]: FIRST_COMPETITION_START_DATE,
      [SECOND_COMPETITION_ID]: SECOND_COMPETITION_START_DATE,
    });
  });

  it('requests the competitions for the competitor', async () => {
    wcaGetMock.mockResolvedValue([]);

    await getCompetitionDates(WCA_ID);

    expect(wcaGetMock).toHaveBeenCalledWith(`/persons/${WCA_ID}/competitions`);
  });

  it('returns an empty map when the competitor has no competitions', async () => {
    wcaGetMock.mockResolvedValue([]);

    await expect(getCompetitionDates(WCA_ID)).resolves.toEqual({});
  });
});
