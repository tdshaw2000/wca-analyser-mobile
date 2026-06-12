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
