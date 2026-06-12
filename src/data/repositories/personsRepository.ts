/**
 * Repository for competitor (person) data. The anti-corruption boundary between
 * the raw WCA API and the domain: it fetches via wcaGet and maps wire DTOs into
 * clean domain models. Ported from search_persons in the Python source's
 * wca_client.py.
 */
import { wcaGet } from '@/data/api/wcaClient';
import type { WcaPersonSearchDto } from '@/data/api/types';
import type { Person } from '@/domain/models/person';

const PERSONS_SEARCH_ENDPOINT = '/persons';
const SEARCH_QUERY_PARAMETER = 'q';

function toPerson(dto: WcaPersonSearchDto): Person {
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
