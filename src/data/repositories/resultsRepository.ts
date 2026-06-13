/**
 * Repository for competitor results. The anti-corruption boundary between the
 * raw WCA API and the domain: it fetches via wcaGet and maps wire DTOs into
 * clean Result domain models. Ported from get_results in the Python source's
 * wca_client.py.
 */
import { wcaGet } from '@/data/api/wcaClient';
import type { WcaResultDto } from '@/data/api/types';
import type { Result } from '@/domain/models/result';

const PERSONS_ENDPOINT = '/persons';
const RESULTS_PATH_SEGMENT = 'results';
const EVENT_QUERY_PARAMETER = 'event_id';

function toResult(dto: WcaResultDto): Result {
  return {
    single: dto.best,
    average: dto.average,
    competitionId: dto.competition_id,
  };
}

/** Return a competitor's results for one event, in the WCA API's response order. */
export async function getResults(wcaId: string, eventId: string): Promise<Result[]> {
  const results = await wcaGet<WcaResultDto[]>(
    `${PERSONS_ENDPOINT}/${wcaId}/${RESULTS_PATH_SEGMENT}`,
    { query: { [EVENT_QUERY_PARAMETER]: eventId } },
  );
  return results.map(toResult);
}
