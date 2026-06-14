/**
 * Domain model: a WCA event identified by its id and shown by its display name.
 * Pure TypeScript — no React, RN, network, or SQLite imports allowed here.
 *
 * Ported from the Python source's Event dataclass (events.py); named NamedEvent
 * to avoid shadowing TypeScript's global DOM `Event` type.
 */
export interface NamedEvent {
  /** The WCA event id, e.g. "333". */
  eventId: string;
  /** The human-readable event name, e.g. "3x3x3 Cube". */
  name: string;
}
