import { render, screen, fireEvent } from '@testing-library/react-native';

import EventProgressionScreen from '@/ui/screens/EventProgressionScreen';
import { useLocalSearchParams } from 'expo-router';
import { usePrProgression } from '@/hooks/usePrProgression';
import type { RecordPoint } from '@/domain/models/recordPoint';

// Two collaborators are mocked: the route-param reader (which competitor + event)
// and the progression hook (its { data, loading, error, reload } drive the four
// states). The real formatTime runs, so the rendered times are asserted for real.
jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('@/hooks/usePrProgression');

const useLocalSearchParamsMock = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;
const usePrProgressionMock = usePrProgression as jest.MockedFunction<typeof usePrProgression>;

const WCA_ID = '2007VALK01';
const EVENT_ID = '333';
const NAME = 'Mats Valk';

const FIRST_DATE = '2023-11-18';
const FIRST_SINGLE = 1807; // formatTime -> "18.07"
const FIRST_TIME = '18.07';
const SECOND_DATE = '2024-11-01';
const SECOND_SINGLE = 1498; // formatTime -> "14.98"
const SECOND_TIME = '14.98';
const PROGRESSION: RecordPoint[] = [
  { date: FIRST_DATE, value: FIRST_SINGLE },
  { date: SECOND_DATE, value: SECOND_SINGLE },
];

const LOADING_TEST_ID = 'progression-loading';
const RETRY_LABEL = 'Try again';
const EMPTY_MESSAGE = 'No personal records yet for this event.';

function mockProgressionState(overrides: Partial<ReturnType<typeof usePrProgression>>) {
  usePrProgressionMock.mockReturnValue({
    data: [],
    loading: false,
    error: null,
    reload: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  useLocalSearchParamsMock.mockReset();
  usePrProgressionMock.mockReset();
  useLocalSearchParamsMock.mockReturnValue({ id: WCA_ID, event: EVENT_ID, name: NAME });
});

describe('EventProgressionScreen', () => {
  it('drives usePrProgression with the competitor and event from the route', async () => {
    mockProgressionState({});

    await render(<EventProgressionScreen />);

    expect(usePrProgressionMock).toHaveBeenCalledWith(WCA_ID, EVENT_ID);
  });

  it('shows a loading indicator while the progression is being fetched', async () => {
    mockProgressionState({ loading: true });

    await render(<EventProgressionScreen />);

    expect(screen.getByTestId(LOADING_TEST_ID)).toBeTruthy();
  });

  it('renders each record point as a date and a formatted time', async () => {
    mockProgressionState({ data: PROGRESSION });

    await render(<EventProgressionScreen />);

    expect(screen.getByText(FIRST_DATE)).toBeTruthy();
    expect(screen.getByText(FIRST_TIME)).toBeTruthy();
    expect(screen.getByText(SECOND_DATE)).toBeTruthy();
    expect(screen.getByText(SECOND_TIME)).toBeTruthy();
  });

  it('shows an empty message when the competitor has no records for the event', async () => {
    mockProgressionState({ data: [] });

    await render(<EventProgressionScreen />);

    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy();
  });

  it('shows the error message and retries via reload when the fetch fails', async () => {
    const reload = jest.fn();
    const failure = new Error('Network request failed');
    mockProgressionState({ error: failure, reload });

    await render(<EventProgressionScreen />);

    expect(screen.getByText(failure.message)).toBeTruthy();
    fireEvent.press(screen.getByText(RETRY_LABEL));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
