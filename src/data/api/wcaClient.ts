/**
 * Low-level HTTP client for the public WCA API.
 *
 * Responsibilities:
 *  - know the base URL
 *  - build query strings
 *  - send the request with sensible headers
 *  - turn non-OK responses (incl. HTTP 429 rate limiting) and network failures
 *    into a single typed error (WcaApiError) the rest of the app can reason about
 *
 * It does NOT know about competitions, persons, etc. — that's the repositories'
 * job. No React/RN imports; just fetch (which React Native provides globally).
 */

export const WCA_API_BASE_URL = 'https://www.worldcubeassociation.org/api/v0';

/** A single typed error for everything that can go wrong talking to the WCA API. */
export class WcaApiError extends Error {
  /** HTTP status code, or 0 for a network-level failure (offline, DNS, etc.). */
  readonly status: number;
  /** Seconds to wait before retrying, parsed from the Retry-After header on 429s. */
  readonly retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = 'WcaApiError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  /** True when the failure was a lost/absent network connection. */
  get isOffline(): boolean {
    return this.status === 0;
  }
}

export interface WcaGetOptions {
  /** Query params; undefined values are skipped. */
  query?: Record<string, string | number | undefined>;
  /** Lets callers cancel in-flight requests (e.g. on screen unmount). */
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: WcaGetOptions['query']): string {
  // Built manually rather than via URL/URLSearchParams: React Native's URL
  // implementation is incomplete and can mishandle query params at runtime.
  const base = `${WCA_API_BASE_URL}${path}`;
  if (!query) return base;
  const pairs = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return pairs.length > 0 ? `${base}?${pairs.join('&')}` : base;
}

/** GET a JSON resource from the WCA API. Throws WcaApiError on any failure. */
export async function wcaGet<T>(path: string, options: WcaGetOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        // Identify ourselves as a good API citizen. Read-only, no auth, no secrets.
        'User-Agent': 'wca-analyser-mobile (read-only public client)',
      },
      signal: options.signal,
    });
  } catch (err) {
    // Re-throw genuine cancellations so callers can ignore them.
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw new WcaApiError('Network request failed. Check your connection and try again.', 0);
  }

  if (response.status === 429) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    throw new WcaApiError(
      'The WCA API is rate-limiting requests. Please wait a moment and try again.',
      429,
      Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
    );
  }

  if (!response.ok) {
    throw new WcaApiError(`WCA API request failed (HTTP ${response.status}).`, response.status);
  }

  return (await response.json()) as T;
}
