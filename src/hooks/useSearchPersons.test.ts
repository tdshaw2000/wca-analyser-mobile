import { renderHook, waitFor, act } from '@testing-library/react-native';

import { useSearchPersons } from '@/hooks/useSearchPersons';
import { searchPersons } from '@/data/repositories/personsRepository';
import type { Person } from '@/domain/models/person';

// The repository is mocked: the hook is the UI<->data bridge, so we test how it
// drives searchPersons and exposes { data, loading, error, reload } — not the
// fetching itself (covered by personsRepository.test.ts). No device needed.
jest.mock('@/data/repositories/personsRepository');
const searchPersonsMock = searchPersons as jest.MockedFunction<typeof searchPersons>;

const QUERY = 'Mats Valk';
const PERSON: Person = {
  name: 'Mats Valk',
  wcaId: '2007VALK01',
  profileUrl: 'https://www.worldcubeassociation.org/persons/2007VALK01',
  avatarThumbUrl: 'https://avatars.worldcubeassociation.org/2007VALK01_thumb.jpg',
};

beforeEach(() => {
  searchPersonsMock.mockReset();
});

describe('useSearchPersons', () => {
  it('does not search while the query is empty', async () => {
    const { result } = await renderHook((q: string) => useSearchPersons(q), {
      initialProps: '',
    });

    expect(searchPersonsMock).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches and exposes the matching persons for a query', async () => {
    searchPersonsMock.mockResolvedValue([PERSON]);

    const { result } = await renderHook((q: string) => useSearchPersons(q), {
      initialProps: QUERY,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(searchPersonsMock).toHaveBeenCalledWith(QUERY);
    expect(result.current.data).toEqual([PERSON]);
    expect(result.current.error).toBeNull();
  });

  it('reports loading while the search is in flight', async () => {
    let resolveSearch!: (persons: Person[]) => void;
    searchPersonsMock.mockReturnValue(
      new Promise<Person[]>((resolve) => {
        resolveSearch = resolve;
      }),
    );

    const { result } = await renderHook((q: string) => useSearchPersons(q), {
      initialProps: QUERY,
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveSearch([PERSON]);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([PERSON]);
  });

  it('exposes the error when the search fails', async () => {
    const failure = new Error('Network request failed');
    searchPersonsMock.mockRejectedValue(failure);

    const { result } = await renderHook((q: string) => useSearchPersons(q), {
      initialProps: QUERY,
    });

    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('re-runs the search for the current query when reload is called', async () => {
    searchPersonsMock.mockResolvedValue([PERSON]);

    const { result } = await renderHook((q: string) => useSearchPersons(q), {
      initialProps: QUERY,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(searchPersonsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(searchPersonsMock).toHaveBeenCalledTimes(2));
  });
});
