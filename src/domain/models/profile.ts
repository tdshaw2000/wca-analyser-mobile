/**
 * Domain model: a competitor's identity plus the events they have competed in.
 * Built from a single profile fetch (see the profile DTO in src/data/api/types.ts).
 * Pure TypeScript — no React, RN, network, or SQLite imports allowed here.
 *
 * Ported from the Python source's Profile dataclass (wca_client.py).
 */
import type { Person } from '@/domain/models/person';

export interface Profile {
  person: Person;
  /**
   * Ids of the events the competitor has competed in (i.e. holds a personal
   * record for), e.g. ["222", "333", "pyram"]. Order is not significant: these
   * come from the keys of the API's personal_records map.
   */
  eventIds: string[];
}
