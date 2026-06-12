/**
 * Competitions repository: the boundary between the outside world and the app.
 * It fetches raw DTOs via the API client and maps them into clean domain
 * models. This mapping is the "anti-corruption layer" — if the WCA API renames
 * a field, only this file changes.
 *
 * (A SQLite/AsyncStorage cache, if we ever add one, would live behind this same
 * function so callers never know or care where the data came from.)
 */
import type { WcaCompetitionDto } from '@/data/api/types';
import { wcaGet } from '@/data/api/wcaClient';
import type { Competition } from '@/domain/models/competition';

function toDomain(dto: WcaCompetitionDto): Competition {
  return {
    id: dto.id,
    name: dto.name,
    city: dto.city,
    countryIso2: dto.country_iso2,
    startDate: dto.start_date,
    endDate: dto.end_date,
    eventIds: dto.event_ids ?? [],
  };
}

export interface ListCompetitionsOptions {
  /** How many to fetch (WCA API caps this at 100). */
  perPage?: number;
  signal?: AbortSignal;
}

/** Fetch a page of competitions from the WCA API as domain models. */
export async function listCompetitions(
  options: ListCompetitionsOptions = {},
): Promise<Competition[]> {
  const { perPage = 25, signal } = options;
  const dtos = await wcaGet<WcaCompetitionDto[]>('/competitions', {
    query: { per_page: perPage },
    signal,
  });
  return dtos.map(toDomain);
}
