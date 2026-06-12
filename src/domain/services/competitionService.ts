/**
 * Business rules for competitions. This is the kind of place your ported Python
 * logic will live: pure functions that take already-fetched, typed domain
 * models and apply rules (sorting, filtering, derived values). No network, no
 * React, no RN — pure and unit-testable.
 */
import type { Competition } from '@/domain/models/competition';

/** Sort competitions by start date, soonest first. */
export function sortByStartDate(competitions: Competition[]): Competition[] {
  // localeCompare on ISO date strings (YYYY-MM-DD) gives correct chronological order.
  return [...competitions].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Competitions whose start date is today or later, soonest first. */
export function upcoming(competitions: Competition[], today: string): Competition[] {
  return sortByStartDate(competitions.filter((c) => c.startDate >= today));
}
