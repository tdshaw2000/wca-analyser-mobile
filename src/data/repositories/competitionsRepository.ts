/**
 * Repository for competition data. The anti-corruption boundary between the raw
 * WCA API and the domain: it fetches via wcaGet and maps wire DTOs into a plain
 * competition-id -> start-date map. Ported from get_competition_dates in the
 * Python source's wca_client.py.
 */
import { wcaGet } from '@/data/api/wcaClient';
import type { WcaCompetitionDto } from '@/data/api/types';

const PERSONS_ENDPOINT = '/persons';
const COMPETITIONS_PATH_SEGMENT = 'competitions';

/** Return a competitor's competitions mapped to their start dates (ISO yyyy-mm-dd). */
export async function getCompetitionDates(wcaId: string): Promise<Record<string, string>> {
  const competitions = await wcaGet<WcaCompetitionDto[]>(
    `${PERSONS_ENDPOINT}/${wcaId}/${COMPETITIONS_PATH_SEGMENT}`,
  );
  return Object.fromEntries(
    competitions.map((competition) => [competition.id, competition.start_date]),
  );
}
