/**
 * Domain model: the clean shape of a WCA competition that the UI and business
 * logic work with. This is intentionally decoupled from the raw WCA API wire
 * format (see src/data/api/types.ts) so that API changes don't ripple into the
 * UI. Pure TypeScript — no React, RN, network, or SQLite imports allowed here.
 */
export interface Competition {
  id: string;
  name: string;
  city: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "GB", "US", "BR". */
  countryIso2: string;
  /** ISO date string, e.g. "2027-01-08". */
  startDate: string;
  /** ISO date string, e.g. "2027-01-10". */
  endDate: string;
  /** WCA event ids held at the competition, e.g. ["333", "222", "444"]. */
  eventIds: string[];
}
