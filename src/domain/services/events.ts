/**
 * Display names for the World Cube Association events. Pure domain logic ported
 * from the Python source's events.py.
 */
import type { NamedEvent } from '@/domain/models/namedEvent';

const EVENT_NAMES: Record<string, string> = {
  '222': '2x2x2 Cube',
  '333': '3x3x3 Cube',
  '444': '4x4x4 Cube',
  '555': '5x5x5 Cube',
  '666': '6x6x6 Cube',
  '777': '7x7x7 Cube',
  '333bf': '3x3x3 Blindfolded',
  '333fm': '3x3x3 Fewest Moves',
  '333oh': '3x3x3 One-Handed',
  clock: 'Clock',
  minx: 'Megaminx',
  pyram: 'Pyraminx',
  skewb: 'Skewb',
  sq1: 'Square-1',
  '444bf': '4x4x4 Blindfolded',
  '555bf': '5x5x5 Blindfolded',
  '333mbf': '3x3x3 Multi-Blind',
  '333ft': '3x3x3 With Feet',
  magic: 'Magic',
  mmagic: 'Master Magic',
  '333mbo': '3x3x3 Multi-Blind Old Style',
};

const BEFORE = -1;
const AFTER = 1;
const SAME = 0;

/**
 * The display name for an event id. Unlike the Python source (which KeyErrors on
 * an unknown id), this falls back to the raw id so a new WCA event cannot crash
 * a screen that shows event names.
 */
export function eventName(eventId: string): string {
  return EVENT_NAMES[eventId] ?? eventId;
}

/** The named events for the given ids, sorted alphabetically by display name. */
export function namedEvents(eventIds: string[]): NamedEvent[] {
  const events = eventIds.map((eventId) => ({ eventId, name: eventName(eventId) }));
  return events.sort((first, second) => {
    if (first.name < second.name) return BEFORE;
    if (first.name > second.name) return AFTER;
    return SAME;
  });
}
