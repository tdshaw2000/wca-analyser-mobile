import { renderHook, waitFor, act } from '@testing-library/react-native';

import { useCompetitorProfile } from '@/hooks/useCompetitorProfile';
import { getProfile } from '@/data/repositories/personsRepository';
import type { Profile } from '@/domain/models/profile';

// The repository is mocked: the hook is the UI<->data bridge, so we test how it
// drives getProfile and exposes { data, loading, error, reload } — not the
// fetching itself (covered by personsRepository.test.ts). No device needed.
jest.mock('@/data/repositories/personsRepository');
const getProfileMock = getProfile as jest.MockedFunction<typeof getProfile>;

const WCA_ID = '2007VALK01';
const PROFILE: Profile = {
  person: {
    name: 'Mats Valk',
    wcaId: WCA_ID,
    profileUrl: 'https://www.worldcubeassociation.org/persons/2007VALK01',
    avatarThumbUrl: 'https://avatars.worldcubeassociation.org/2007VALK01_thumb.jpg',
  },
  eventIds: ['222', '333', 'pyram'],
};

beforeEach(() => {
  getProfileMock.mockReset();
});

describe('useCompetitorProfile', () => {
  it('does not fetch while the wca id is empty', async () => {
    const { result } = await renderHook((id: string) => useCompetitorProfile(id), {
      initialProps: '',
    });

    expect(getProfileMock).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches and exposes the profile for a wca id', async () => {
    getProfileMock.mockResolvedValue(PROFILE);

    const { result } = await renderHook((id: string) => useCompetitorProfile(id), {
      initialProps: WCA_ID,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getProfileMock).toHaveBeenCalledWith(WCA_ID);
    expect(result.current.data).toEqual(PROFILE);
    expect(result.current.error).toBeNull();
  });

  it('reports loading while the fetch is in flight', async () => {
    let resolveProfile!: (profile: Profile) => void;
    getProfileMock.mockReturnValue(
      new Promise<Profile>((resolve) => {
        resolveProfile = resolve;
      }),
    );

    const { result } = await renderHook((id: string) => useCompetitorProfile(id), {
      initialProps: WCA_ID,
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveProfile(PROFILE);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(PROFILE);
  });

  it('exposes the error and clears data when the fetch fails', async () => {
    const failure = new Error('Network request failed');
    getProfileMock.mockRejectedValue(failure);

    const { result } = await renderHook((id: string) => useCompetitorProfile(id), {
      initialProps: WCA_ID,
    });

    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('re-runs the fetch for the current wca id when reload is called', async () => {
    getProfileMock.mockResolvedValue(PROFILE);

    const { result } = await renderHook((id: string) => useCompetitorProfile(id), {
      initialProps: WCA_ID,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getProfileMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(getProfileMock).toHaveBeenCalledTimes(2));
  });
});
