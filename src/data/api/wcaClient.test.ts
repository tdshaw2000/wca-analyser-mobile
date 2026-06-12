import { wcaGet, WcaApiError, WCA_API_BASE_URL } from '@/data/api/wcaClient';

// Backfill spec for the generic WCA HTTP client. fetch is mocked so these run
// as fast unit tests with no network. Covers URL/query building and the mapping
// of every failure mode onto a single typed WcaApiError.

/** Build a minimal Response-like stub matching what wcaGet reads off it. */
function fakeResponse({
  status = 200,
  ok = status >= 200 && status < 300,
  headers = {},
  json = {},
}: {
  status?: number;
  ok?: boolean;
  headers?: Record<string, string>;
  json?: unknown;
} = {}) {
  return {
    status,
    ok,
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => json,
  };
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  (globalThis as { fetch: unknown }).fetch = fetchMock;
});

describe('wcaGet', () => {
  it('hits the WCA base URL + path and returns parsed JSON on success', async () => {
    const body = { id: 'WC2023', name: 'World Championship 2023' };
    fetchMock.mockResolvedValue(fakeResponse({ json: body }));

    const result = await wcaGet<typeof body>('/competitions/WC2023');

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      `${WCA_API_BASE_URL}/competitions/WC2023`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('builds a query string, encoding values and skipping undefined params', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ json: [] }));

    await wcaGet('/search/persons', {
      query: { q: 'Feliks Z', page: 2, country: undefined },
    });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toBe(`${WCA_API_BASE_URL}/search/persons?q=Feliks%20Z&page=2`);
    expect(calledUrl).not.toContain('country');
  });

  it('sends an Accept: application/json header', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ json: {} }));

    await wcaGet('/competitions');

    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> };
    expect(init.headers.Accept).toBe('application/json');
  });

  it('maps HTTP 429 to a WcaApiError carrying the Retry-After seconds', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 429, ok: false, headers: { 'Retry-After': '30' } }),
    );

    await expect(wcaGet('/competitions')).rejects.toMatchObject({
      name: 'WcaApiError',
      status: 429,
      retryAfterSeconds: 30,
    });
  });

  it('leaves retryAfterSeconds undefined on a 429 without a Retry-After header', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ status: 429, ok: false }));

    const error = (await wcaGet('/competitions').catch((e) => e)) as WcaApiError;
    expect(error).toBeInstanceOf(WcaApiError);
    expect(error.retryAfterSeconds).toBeUndefined();
  });

  it('maps other non-OK responses to a WcaApiError with that status', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ status: 500, ok: false }));

    await expect(wcaGet('/competitions')).rejects.toMatchObject({
      name: 'WcaApiError',
      status: 500,
    });
  });

  it('maps a network failure to an offline WcaApiError (status 0)', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const error = (await wcaGet('/competitions').catch((e) => e)) as WcaApiError;
    expect(error).toBeInstanceOf(WcaApiError);
    expect(error.status).toBe(0);
    expect(error.isOffline).toBe(true);
  });

  it('rethrows an AbortError unchanged so callers can ignore cancellations', async () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    fetchMock.mockRejectedValue(abort);

    await expect(wcaGet('/competitions')).rejects.toBe(abort);
  });
});
