import { render, screen, fireEvent } from '@testing-library/react-native';

import EventProgressionScreen from '@/ui/screens/EventProgressionScreen';
import { useLocalSearchParams } from 'expo-router';
import { usePrProgression } from '@/hooks/usePrProgression';
import { SINGLE_POINT_TEST_ID, AVERAGE_POINT_TEST_ID } from '@/ui/components/RecordChart';
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

// Distinct dates and values from the singles so getByText stays unambiguous.
const AVG_FIRST_DATE = '2022-05-14';
const AVG_FIRST_AVERAGE = 2050; // formatTime -> "20.50"
const AVG_FIRST_TIME = '20.50';
const AVG_SECOND_DATE = '2023-06-20';
const AVG_SECOND_AVERAGE = 1990; // formatTime -> "19.90"
const AVG_SECOND_TIME = '19.90';
const AVERAGE_PROGRESSION: RecordPoint[] = [
  { date: AVG_FIRST_DATE, value: AVG_FIRST_AVERAGE },
  { date: AVG_SECOND_DATE, value: AVG_SECOND_AVERAGE },
];

const SINGLE_HEADING = 'Single';
const AVERAGE_HEADING = 'Average';
const LOADING_TEST_ID = 'progression-loading';
const RETRY_LABEL = 'Try again';
const EMPTY_MESSAGE = 'No personal records yet for this event.';

function mockProgressionState(overrides: Partial<ReturnType<typeof usePrProgression>>) {
  usePrProgressionMock.mockReturnValue({
    data: [],
    averages: [],
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

  it('renders a single table and an average table, each with its heading', async () => {
    mockProgressionState({ data: PROGRESSION, averages: AVERAGE_PROGRESSION });

    await render(<EventProgressionScreen />);

    // "Single"/"Average" now appear in both the chart legend and the table headings.
    expect(screen.getAllByText(SINGLE_HEADING).length).toBeGreaterThan(0);
    expect(screen.getAllByText(AVERAGE_HEADING).length).toBeGreaterThan(0);
    // Single rows.
    expect(screen.getByText(FIRST_TIME)).toBeTruthy();
    expect(screen.getByText(SECOND_TIME)).toBeTruthy();
    // Average rows.
    expect(screen.getByText(AVG_FIRST_DATE)).toBeTruthy();
    expect(screen.getByText(AVG_FIRST_TIME)).toBeTruthy();
    expect(screen.getByText(AVG_SECOND_DATE)).toBeTruthy();
    expect(screen.getByText(AVG_SECOND_TIME)).toBeTruthy();
  });

  it('plots both progressions on a single combined chart', async () => {
    mockProgressionState({ data: PROGRESSION, averages: AVERAGE_PROGRESSION });

    await render(<EventProgressionScreen />);

    // One chart, one marker per single and per average record.
    expect(screen.getAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(PROGRESSION.length);
    expect(screen.getAllByTestId(AVERAGE_POINT_TEST_ID)).toHaveLength(AVERAGE_PROGRESSION.length);
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
