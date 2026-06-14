import { namedEvents, eventName, defaultEventId, DEFAULT_EVENT_ID } from '@/domain/services/events';
import type { NamedEvent } from '@/domain/models/namedEvent';

// Ported from the Python source's tests/test_events.py.
const COMPETED_EVENT_IDS = ['pyram', '333', '222'];
const EXPECTED_NAMED_EVENTS: NamedEvent[] = [
  { eventId: '222', name: '2x2x2 Cube' },
  { eventId: '333', name: '3x3x3 Cube' },
  { eventId: 'pyram', name: 'Pyraminx' },
];

const UNKNOWN_EVENT_ID = '999unknown';

describe('namedEvents', () => {
  it('returns the named events sorted alphabetically by name', () => {
    expect(namedEvents(COMPETED_EVENT_IDS)).toEqual(EXPECTED_NAMED_EVENTS);
  });

  // Divergence from Python (which would KeyError): an unknown id keeps the raw id
  // as its name so a new WCA event can never crash the screen.
  it('falls back to the raw id as the name for an unknown event', () => {
    expect(namedEvents([UNKNOWN_EVENT_ID])).toEqual([
      { eventId: UNKNOWN_EVENT_ID, name: UNKNOWN_EVENT_ID },
    ]);
  });
});

describe('defaultEventId', () => {
  // 3x3x3 is the universal event, so it is the preferred default when present.
  it('returns 3x3x3 when the competitor competed in it', () => {
    expect(defaultEventId(['pyram', '333', '222'])).toBe(DEFAULT_EVENT_ID);
  });

  // A blind/feet-only competitor may never have done 3x3x3; fall back to the
  // first event by the same alphabetical-by-name order the picker shows.
  it('returns the first event by display name when 3x3x3 is absent', () => {
    // '555' (5x5x5 Cube) sorts before 'pyram' (Pyraminx).
    expect(defaultEventId(['pyram', '555'])).toBe('555');
  });

  it('returns an empty string for no events', () => {
    expect(defaultEventId([])).toBe('');
  });
});

describe('eventName', () => {
  it('maps a known event id to its display name', () => {
    expect(eventName('333')).toBe('3x3x3 Cube');
  });

  it('falls back to the raw id for an unknown event', () => {
    expect(eventName(UNKNOWN_EVENT_ID)).toBe(UNKNOWN_EVENT_ID);
  });
});
