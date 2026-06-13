import { getProfile, searchPersons } from '@/data/repositories/personsRepository';
import { wcaGet } from '@/data/api/wcaClient';

// Ported from the Python source's tests/test_wca_client.py
// (search_persons + get_profile cases).
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

// The profile endpoint carries a distinct avatar from search, and a
// personal_records object whose KEYS are the events the competitor has competed
// in. A separate thumb url proves getProfile reads the avatar off the profile
// response (we want it on the competitor page), not off the earlier search row.
const PROFILE_AVATAR_THUMB_URL =
  'https://avatars.worldcubeassociation.org/2007VALK01_profile_thumb.jpg';
const COMPETED_EVENT_IDS = ['333', '222', 'pyram'];
const PROFILE_RESPONSE = {
  person: {
    name: EXPECTED_NAME,
    wca_id: EXPECTED_WCA_ID,
    url: EXPECTED_PROFILE_URL,
    avatar: { thumb_url: PROFILE_AVATAR_THUMB_URL },
  },
  personal_records: {
    '333': { single: { best: 1355 }, average: { best: 1646 } },
    '222': { single: { best: 585 }, average: { best: 708 } },
    pyram: { single: { best: 911 }, average: { best: 1147 } },
  },
};

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

describe('getProfile', () => {
  it('maps the profile to the competitor (with avatar) and their competed events', async () => {
    wcaGetMock.mockResolvedValue(PROFILE_RESPONSE);

    const profile = await getProfile(EXPECTED_WCA_ID);

    expect(profile.person).toEqual({
      name: EXPECTED_NAME,
      wcaId: EXPECTED_WCA_ID,
      profileUrl: EXPECTED_PROFILE_URL,
      avatarThumbUrl: PROFILE_AVATAR_THUMB_URL,
    });
    // Order-independent: personal_records is a JSON object (a map), so its key
    // order is not meaningful — we pin down which events came back, not a
    // platform-specific iteration order. See the test commit's note.
    expect(profile.eventIds).toHaveLength(COMPETED_EVENT_IDS.length);
    expect(profile.eventIds).toEqual(expect.arrayContaining(COMPETED_EVENT_IDS));
  });

  it('fetches the competitor profile from /persons/{wcaId} exactly once', async () => {
    wcaGetMock.mockResolvedValue(PROFILE_RESPONSE);

    await getProfile(EXPECTED_WCA_ID);

    expect(wcaGetMock).toHaveBeenCalledTimes(1);
    expect(wcaGetMock).toHaveBeenCalledWith(`/persons/${EXPECTED_WCA_ID}`);
  });
});
