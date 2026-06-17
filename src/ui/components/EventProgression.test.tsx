import { render, screen, fireEvent, within } from '@testing-library/react-native';

import {
  EventProgression,
  PROGRESSION_LOADING_TEST_ID,
  PROGRESSION_EMPTY_MESSAGE,
  ALL_RESULTS_TEST_ID,
  ALL_RESULTS_HEADING,
} from '@/ui/components/EventProgression';
import {
  SINGLE_POINT_TEST_ID,
  AVERAGE_POINT_TEST_ID,
  SINGLE_LINE_TEST_ID,
} from '@/ui/components/RecordChart';
import type { RecordPoint } from '@/domain/models/recordPoint';

// Presentational body for the PR progression: it owns the loading / error /
// empty / loaded states; the real formatTime runs so rendered times are real.
const FIRST_DATE = '2023-11-18';
const FIRST_TIME = '18.07';
const SECOND_DATE = '2024-11-01';
const SECOND_TIME = '14.98';
const SINGLES: RecordPoint[] = [
  { date: FIRST_DATE, value: 1807 },
  { date: SECOND_DATE, value: 1498 },
];

const AVG_FIRST_DATE = '2022-05-14';
const AVG_FIRST_TIME = '20.50';
const AVERAGES: RecordPoint[] = [{ date: AVG_FIRST_DATE, value: 2050 }];

const SINGLE_HEADING = 'Single';
const AVERAGE_HEADING = 'Average';
const RETRY_LABEL = 'Try again';

function renderProgression(overrides: Partial<Parameters<typeof EventProgression>[0]> = {}) {
  return render(
    <EventProgression
      singles={[]}
      averages={[]}
      loading={false}
      error={null}
      onRetry={jest.fn()}
      {...overrides}
    />,
  );
}

describe('EventProgression', () => {
  it('shows a loading indicator while fetching', async () => {
    await renderProgression({ loading: true });

    expect(screen.getByTestId(PROGRESSION_LOADING_TEST_ID)).toBeTruthy();
  });

  it('shows the error message and retries via onRetry when the fetch fails', async () => {
    const onRetry = jest.fn();
    const failure = new Error('Network request failed');
    await renderProgression({ error: failure, onRetry });

    expect(screen.getByText(failure.message)).toBeTruthy();
    await fireEvent.press(screen.getByText(RETRY_LABEL));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows an empty message when there are no records of either kind', async () => {
    await renderProgression({ singles: [], averages: [] });

    expect(screen.getByText(PROGRESSION_EMPTY_MESSAGE)).toBeTruthy();
  });

  it('renders each record point as a date and a formatted time', async () => {
    await renderProgression({ singles: SINGLES });

    expect(screen.getByText(FIRST_DATE)).toBeTruthy();
    expect(screen.getByText(FIRST_TIME)).toBeTruthy();
    expect(screen.getByText(SECOND_DATE)).toBeTruthy();
    expect(screen.getByText(SECOND_TIME)).toBeTruthy();
  });

  it('renders a single and an average table, each with its heading', async () => {
    await renderProgression({ singles: SINGLES, averages: AVERAGES });

    expect(screen.getAllByText(SINGLE_HEADING).length).toBeGreaterThan(0);
    expect(screen.getAllByText(AVERAGE_HEADING).length).toBeGreaterThan(0);
    expect(screen.getByText(AVG_FIRST_DATE)).toBeTruthy();
    expect(screen.getByText(AVG_FIRST_TIME)).toBeTruthy();
  });

  it('plots both progressions on a single combined chart', async () => {
    await renderProgression({ singles: SINGLES, averages: AVERAGES });

    expect(screen.getAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(SINGLES.length);
    expect(screen.getAllByTestId(AVERAGE_POINT_TEST_ID)).toHaveLength(AVERAGES.length);
  });

  // Every solve and every average (not just the records), drawn points-only.
  const ALL_SINGLES: RecordPoint[] = [
    { date: FIRST_DATE, value: 1807 },
    { date: FIRST_DATE, value: 1900 },
    { date: SECOND_DATE, value: 1498 },
  ];
  const ALL_AVERAGES: RecordPoint[] = [{ date: AVG_FIRST_DATE, value: 2050 }];

  it('plots the all-results scatter, points only, below the tables', async () => {
    await renderProgression({
      singles: SINGLES,
      averages: AVERAGES,
      allSingles: ALL_SINGLES,
      allAverages: ALL_AVERAGES,
    });

    const scatter = within(screen.getByTestId(ALL_RESULTS_TEST_ID));
    expect(scatter.getAllByTestId(SINGLE_POINT_TEST_ID)).toHaveLength(ALL_SINGLES.length);
    expect(scatter.getAllByTestId(AVERAGE_POINT_TEST_ID)).toHaveLength(ALL_AVERAGES.length);
    // Scatter, not progression: the points are not joined by a line.
    expect(scatter.queryAllByTestId(SINGLE_LINE_TEST_ID)).toHaveLength(0);
    expect(screen.getByText(ALL_RESULTS_HEADING)).toBeTruthy();
  });

  it('omits the all-results scatter when there are no results to plot', async () => {
    await renderProgression({ singles: SINGLES, averages: AVERAGES });

    expect(screen.queryByTestId(ALL_RESULTS_TEST_ID)).toBeNull();
  });
});
