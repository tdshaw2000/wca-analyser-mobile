/**
 * Domain model: a competitor returned by a WCA search or profile fetch. Decoupled
 * from the raw API wire format (see src/data/api/types.ts). Pure TypeScript — no
 * React, RN, network, or SQLite imports allowed here.
 *
 * Ported from the Python source's Person dataclass (wca_client.py).
 */
export interface Person {
  name: string;
  /** WCA ID, e.g. "2007VALK01". */
  wcaId: string;
  /** Public WCA profile URL. */
  profileUrl: string;
  /** Thumbnail avatar URL; empty string when the competitor has no avatar. */
  avatarThumbUrl: string;
}
