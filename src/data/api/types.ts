/**
 * Raw WCA API "wire" types — the exact JSON shapes returned by
 * https://www.worldcubeassociation.org/api/v0/. Only the fields we actually
 * consume are declared (the real responses contain many more).
 *
 * These DTOs stay in the data layer. Repositories map them into clean domain
 * models (src/domain/models) so the rest of the app never depends on the wire
 * format.
 */
export interface WcaCompetitionDto {
  id: string;
  name: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  event_ids: string[];
}
