/**
 * Repository for competitor (person) data. The anti-corruption boundary between
 * the raw WCA API and the domain: it fetches via wcaGet and maps wire DTOs into
 * clean domain models. Ported from search_persons and get_profile in the Python
 * source's wca_client.py.
 */
import { wcaGet } from '@/data/api/wcaClient';
import type { WcaPersonDto, WcaPersonProfileDto, WcaPersonSearchDto } from '@/data/api/types';
import type { Person } from '@/domain/models/person';
import type { Profile } from '@/domain/models/profile';

const PERSONS_SEARCH_ENDPOINT = '/persons';
const PERSON_PROFILE_ENDPOINT = '/persons';
const SEARCH_QUERY_PARAMETER = 'q';

// Both the search element and the profile response wrap the same person object,
// so the mapping is shared between searchPersons and getProfile.
function toPerson(dto: { person: WcaPersonDto }): Person {
  const { person } = dto;
  return {
    name: person.name,
    wcaId: person.wca_id,
    profileUrl: person.url,
    avatarThumbUrl: person.avatar.thumb_url,
  };
}

/** Return the competitors whose names match the given search term. */
export async function searchPersons(name: string): Promise<Person[]> {
  const matches = await wcaGet<WcaPersonSearchDto[]>(PERSONS_SEARCH_ENDPOINT, {
    query: { [SEARCH_QUERY_PARAMETER]: name },
  });
  return matches.map(toPerson);
}

/** Return a competitor's identity (incl. avatar) and the events they've competed in. */
export async function getProfile(wcaId: string): Promise<Profile> {
  const profile = await wcaGet<WcaPersonProfileDto>(`${PERSON_PROFILE_ENDPOINT}/${wcaId}`);
  return {
    person: toPerson(profile),
    eventIds: Object.keys(profile.personal_records),
  };
}
