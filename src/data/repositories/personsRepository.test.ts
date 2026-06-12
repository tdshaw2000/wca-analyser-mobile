import { searchPersons } from '@/data/repositories/personsRepository';
import { wcaGet } from '@/data/api/wcaClient';

// Ported from the Python source's tests/test_wca_client.py (search_persons cases).
// wcaGet is mocked so the repository's DTO->domain mapping and request shape are
// tested in isolation, with no network — the TS equivalent of the Python tests'
// mocked HTTP transport.
jest.mock('@/data/api/wcaClient');
const wcaGetMock = wcaGet as jest.MockedFunction<typeof wcaGet>;

const SEARCH_NAME = 'Mats Valk';
const EXPECTED_NAME = 'Mats Valk';
const EXPECTED_WCA_ID = '2007VALK01';
const EXPECTED_PROFILE_URL = 'https://www.worldcubeassociation.org/persons/2007VALK01';
const EXPECTED_AVATAR_THUMB_URL =
  'https://avatars.worldcubeassociation.org/2007VALK01_thumb.jpg';

const SINGLE_PERSON_RESPONSE = [
  {
    person: {
      name: EXPECTED_NAME,
      wca_id: EXPECTED_WCA_ID,
      url: EXPECTED_PROFILE_URL,
      avatar: { thumb_url: EXPECTED_AVATAR_THUMB_URL },
    },
  },
];

beforeEach(() => {
  wcaGetMock.mockReset();
});

describe('searchPersons', () => {
  it('maps each match to a Person with name, wca id, profile url and avatar', async () => {
    wcaGetMock.mockResolvedValue(SINGLE_PERSON_RESPONSE);

    const results = await searchPersons(SEARCH_NAME);

    expect(results).toEqual([
      {
        name: EXPECTED_NAME,
        wcaId: EXPECTED_WCA_ID,
        profileUrl: EXPECTED_PROFILE_URL,
        avatarThumbUrl: EXPECTED_AVATAR_THUMB_URL,
      },
    ]);
  });

  it('sends the searched name as the q query parameter to /persons', async () => {
    wcaGetMock.mockResolvedValue([]);

    await searchPersons(SEARCH_NAME);

    expect(wcaGetMock).toHaveBeenCalledWith('/persons', { query: { q: SEARCH_NAME } });
  });

  it('returns an empty list when there are no matches', async () => {
    wcaGetMock.mockResolvedValue([]);

    await expect(searchPersons('no such competitor')).resolves.toEqual([]);
  });
});
