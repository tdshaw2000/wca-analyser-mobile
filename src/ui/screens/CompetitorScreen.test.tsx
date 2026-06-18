import { render, screen, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

import CompetitorScreen from '@/ui/screens/CompetitorScreen';
import { useLocalSearchParams } from 'expo-router';
import { useCompetitorProfile } from '@/hooks/useCompetitorProfile';
import { usePrProgression } from '@/hooks/usePrProgression';
import { EVENT_PICKER_TEST_ID } from '@/ui/components/EventPicker';
import { ALL_RESULTS_TEST_ID } from '@/ui/components/EventProgression';
import type { Profile } from '@/domain/models/profile';
import type { RecordPoint } from '@/domain/models/recordPoint';

// Event selection now lives on this screen: the profile hook supplies the
// competitor's events, the screen defaults to 3x3x3, and the progression hook is
// driven by the picker's selection. Both hooks (and the route params) are mocked
// so the four states and the selection behaviour are deterministic.
jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('@/hooks/useCompetitorProfile');
jest.mock('@/hooks/usePrProgression');

const useLocalSearchParamsMock = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;
const useCompetitorProfileMock = useCompetitorProfile as jest.MockedFunction<
  typeof useCompetitorProfile
>;
const usePrProgressionMock = usePrProgression as jest.MockedFunction<typeof usePrProgression>;

const WCA_ID = '2007VALK01';
const NAME = 'Mats Valk';
const AVATAR_THUMB_URL = 'https://avatars.worldcubeassociation.org/2007VALK01_thumb.jpg';
const DEFAULT_EVENT_ID = '333';
const DEFAULT_EVENT_NAME = '3x3x3 Cube';
const OTHER_EVENT_ID = 'pyram';
const PROFILE: Profile = {
  person: {
    name: NAME,
    wcaId: WCA_ID,
    profileUrl: 'https://www.worldcubeassociation.org/persons/2007VALK01',
    avatarThumbUrl: AVATAR_THUMB_URL,
  },
  eventIds: ['222', '333', 'pyram'],
};

const RECORD_DATE = '2024-11-01';
const RECORD_TIME = '14.98';
const SINGLES: RecordPoint[] = [{ date: RECORD_DATE, value: 1498 }];
const ALL_SINGLES: RecordPoint[] = [
  { date: RECORD_DATE, value: 1498 },
  { date: RECORD_DATE, value: 1655 },
];
const ALL_AVERAGES: RecordPoint[] = [{ date: RECORD_DATE, value: 1700 }];

const LOADING_TEST_ID = 'competitor-loading';
const AVATAR_TEST_ID = 'competitor-avatar';
const RETRY_LABEL = 'Try again';
const EMPTY_MESSAGE = 'No competed events recorded.';
const PROFILE_LINK_LABEL = 'View WCA profile';

function mockProfileState(overrides: Partial<ReturnType<typeof useCompetitorProfile>>) {
  useCompetitorProfileMock.mockReturnValue({
    data: null,
    loading: false,
    error: null,
    reload: jest.fn(),
    ...overrides,
  });
}

function mockProgressionState(overrides: Partial<ReturnType<typeof usePrProgression>>) {
  usePrProgressionMock.mockReturnValue({
    data: [],
    averages: [],
    allSingles: [],
    allAverages: [],
    dailyRanges: [],
    loading: false,
    error: null,
    reload: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  useLocalSearchParamsMock.mockReset();
  useCompetitorProfileMock.mockReset();
  usePrProgressionMock.mockReset();
  useLocalSearchParamsMock.mockReturnValue({ id: WCA_ID, name: NAME });
  mockProgressionState({});
});

describe('CompetitorScreen', () => {
  it('shows the competitor name and WCA id from the route params', async () => {
    mockProfileState({});

    await render(<CompetitorScreen />);

    expect(screen.getByText(NAME)).toBeTruthy();
    expect(screen.getByText(WCA_ID)).toBeTruthy();
  });

  it('shows a loading indicator while the profile is being fetched', async () => {
    mockProfileState({ loading: true });

    await render(<CompetitorScreen />);

    expect(screen.getByTestId(LOADING_TEST_ID)).toBeTruthy();
  });

  it('renders the avatar once the profile has loaded', async () => {
    mockProfileState({ data: PROFILE });

    await render(<CompetitorScreen />);

    expect(screen.getByTestId(AVATAR_TEST_ID).props.source).toEqual({ uri: AVATAR_THUMB_URL });
  });

  it('drives the progression with 3x3x3 by default once the profile loads', async () => {
    mockProfileState({ data: PROFILE });

    await render(<CompetitorScreen />);

    expect(usePrProgressionMock).toHaveBeenLastCalledWith(WCA_ID, DEFAULT_EVENT_ID);
    const picker = screen.getByTestId(EVENT_PICKER_TEST_ID);
    expect(picker.props.items[picker.props.selectedIndex].label).toBe(DEFAULT_EVENT_NAME);
  });

  it('shows the progression for the selected event', async () => {
    mockProfileState({ data: PROFILE });
    mockProgressionState({ data: SINGLES });

    await render(<CompetitorScreen />);

    expect(screen.getByText(RECORD_DATE)).toBeTruthy();
    expect(screen.getByText(RECORD_TIME)).toBeTruthy();
  });

  it('shows the all-results scatter for the selected event', async () => {
    mockProfileState({ data: PROFILE });
    mockProgressionState({ data: SINGLES, allSingles: ALL_SINGLES, allAverages: ALL_AVERAGES });

    await render(<CompetitorScreen />);

    expect(screen.getByTestId(ALL_RESULTS_TEST_ID)).toBeTruthy();
  });

  it('switches the progression to the event picked from the dropdown', async () => {
    mockProfileState({ data: PROFILE });

    await render(<CompetitorScreen />);
    await fireEvent(screen.getByTestId(EVENT_PICKER_TEST_ID), 'onValueChange', OTHER_EVENT_ID);

    expect(usePrProgressionMock).toHaveBeenLastCalledWith(WCA_ID, OTHER_EVENT_ID);
  });

  it('opens the WCA profile in the default browser when the profile link is pressed', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    mockProfileState({ data: PROFILE });

    await render(<CompetitorScreen />);
    await fireEvent.press(screen.getByText(PROFILE_LINK_LABEL));

    expect(openURL).toHaveBeenCalledWith(PROFILE.person.profileUrl);
    openURL.mockRestore();
  });

  it('shows an empty message and no picker when there are no competed events', async () => {
    mockProfileState({ data: { person: PROFILE.person, eventIds: [] } });

    await render(<CompetitorScreen />);

    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy();
    expect(screen.queryByTestId(EVENT_PICKER_TEST_ID)).toBeNull();
  });

  it('shows the error message and retries via reload when the profile fetch fails', async () => {
    const reload = jest.fn();
    const failure = new Error('Network request failed');
    mockProfileState({ error: failure, reload });

    await render(<CompetitorScreen />);

    expect(screen.getByText(failure.message)).toBeTruthy();
    await fireEvent.press(screen.getByText(RETRY_LABEL));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
