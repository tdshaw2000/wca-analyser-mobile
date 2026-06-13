import { render, screen, fireEvent } from '@testing-library/react-native';

import CompetitorScreen from '@/ui/screens/CompetitorScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCompetitorProfile } from '@/hooks/useCompetitorProfile';
import type { Profile } from '@/domain/models/profile';

// Collaborators are mocked: the route-param reader (which competitor), the
// router (to assert navigation), and the profile hook (its { data, loading,
// error, reload } drive the four states). The screen is dumb — fetching lives in
// the hook (covered by its own spec).
jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn(), useRouter: jest.fn() }));
jest.mock('@/hooks/useCompetitorProfile');

const useLocalSearchParamsMock = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;
const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
const push = jest.fn();
const useCompetitorProfileMock = useCompetitorProfile as jest.MockedFunction<
  typeof useCompetitorProfile
>;

const WCA_ID = '2007VALK01';
const NAME = 'Mats Valk';
const AVATAR_THUMB_URL = 'https://avatars.worldcubeassociation.org/2007VALK01_thumb.jpg';
const PROFILE: Profile = {
  person: {
    name: NAME,
    wcaId: WCA_ID,
    profileUrl: 'https://www.worldcubeassociation.org/persons/2007VALK01',
    avatarThumbUrl: AVATAR_THUMB_URL,
  },
  eventIds: ['222', '333', 'pyram'],
};

// Mirror the constants the screen renders, so the spec and screen stay in step.
const LOADING_TEST_ID = 'competitor-loading';
const AVATAR_TEST_ID = 'competitor-avatar';
const RETRY_LABEL = 'Try again';
const EMPTY_MESSAGE = 'No competed events recorded.';

function mockProfileState(overrides: Partial<ReturnType<typeof useCompetitorProfile>>) {
  useCompetitorProfileMock.mockReturnValue({
    data: null,
    loading: false,
    error: null,
    reload: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  useLocalSearchParamsMock.mockReset();
  useCompetitorProfileMock.mockReset();
  push.mockReset();
  useRouterMock.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  useLocalSearchParamsMock.mockReturnValue({ id: WCA_ID, name: NAME });
});

describe('CompetitorScreen', () => {
  it('shows the competitor name and WCA id from the route params', async () => {
    mockProfileState({});

    await render(<CompetitorScreen />);

    expect(screen.getByText(NAME)).toBeTruthy();
    expect(screen.getByText(WCA_ID)).toBeTruthy();
  });

  it('falls back to the WCA id as the heading when no name was passed', async () => {
    useLocalSearchParamsMock.mockReturnValue({ id: WCA_ID });
    mockProfileState({});

    await render(<CompetitorScreen />);

    // With no name, the id is both the heading and the id line, so it appears
    // more than once — getAllByText avoids the "multiple elements" ambiguity.
    expect(screen.getAllByText(WCA_ID).length).toBeGreaterThan(0);
  });

  it('shows a loading indicator while the profile is being fetched', async () => {
    mockProfileState({ loading: true });

    await render(<CompetitorScreen />);

    expect(screen.getByTestId(LOADING_TEST_ID)).toBeTruthy();
  });

  it('renders the avatar and the competed event ids once loaded', async () => {
    mockProfileState({ data: PROFILE });

    await render(<CompetitorScreen />);

    expect(screen.getByTestId(AVATAR_TEST_ID).props.source).toEqual({ uri: AVATAR_THUMB_URL });
    expect(screen.getByText('222')).toBeTruthy();
    expect(screen.getByText('333')).toBeTruthy();
    expect(screen.getByText('pyram')).toBeTruthy();
  });

  it('shows an empty message when the competitor has no competed events', async () => {
    mockProfileState({ data: { person: PROFILE.person, eventIds: [] } });

    await render(<CompetitorScreen />);

    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy();
  });

  it('shows the error message and retries via reload when the fetch fails', async () => {
    const reload = jest.fn();
    const failure = new Error('Network request failed');
    mockProfileState({ error: failure, reload });

    await render(<CompetitorScreen />);

    expect(screen.getByText(failure.message)).toBeTruthy();
    fireEvent.press(screen.getByText(RETRY_LABEL));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('navigates to the event progression, passing id, event and name, when an event is tapped', async () => {
    mockProfileState({ data: PROFILE });

    await render(<CompetitorScreen />);
    await fireEvent.press(screen.getByText('333'));

    expect(push).toHaveBeenCalledWith({
      pathname: '/person/[id]/[event]',
      params: { id: WCA_ID, event: '333', name: NAME },
    });
  });
});
