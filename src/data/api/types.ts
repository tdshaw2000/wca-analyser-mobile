/**
 * Raw WCA API "wire" types — the exact JSON shapes returned by
 * https://www.worldcubeassociation.org/api/v0/. Only the fields we actually
 * consume are declared (the real responses contain many more).
 *
 * These DTOs stay in the data layer. Repositories map them into clean domain
 * models (src/domain/models) so the rest of the app never depends on the wire
 * format.
 */

/** The nested person object shared by search results and profile responses. */
export interface WcaPersonDto {
  name: string;
  wca_id: string;
  url: string;
  avatar: { thumb_url: string };
}

/** One element of the /persons search response: { person: {...} }. */
export interface WcaPersonSearchDto {
  person: WcaPersonDto;
}

/**
 * The /persons/{wca_id} profile response. personal_records is a map keyed by
 * event id; we only consume its keys (the events the competitor has competed
 * in), so the record values are left unmodelled.
 */
export interface WcaPersonProfileDto {
  person: WcaPersonDto;
  personal_records: Record<string, unknown>;
}
