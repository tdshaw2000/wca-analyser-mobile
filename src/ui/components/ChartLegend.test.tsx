import { render, screen, fireEvent } from '@testing-library/react-native';

import { ChartLegend } from '@/ui/components/ChartLegend';
import type { ChartLegendEntry } from '@/ui/components/ChartLegend';

// The legend is a row of pressable series entries: each shows a label, reports a
// press via onToggle, and reflects its on/off state through accessibilityState so
// a hidden series reads as unchecked (and renders faded).
const SINGLE_TEST_ID = 'legend-single';
const AVERAGE_TEST_ID = 'legend-average';
const SINGLE_LABEL = 'Single';
const AVERAGE_LABEL = 'Average';

function entry(overrides: Partial<ChartLegendEntry>): ChartLegendEntry {
  return {
    label: SINGLE_LABEL,
    colour: '#2563eb',
    visible: true,
    onToggle: jest.fn(),
    testID: SINGLE_TEST_ID,
    ...overrides,
  };
}

describe('ChartLegend', () => {
  it('renders one entry per series with its label', async () => {
    await render(
      <ChartLegend
        entries={[
          entry({ label: SINGLE_LABEL, testID: SINGLE_TEST_ID }),
          entry({ label: AVERAGE_LABEL, testID: AVERAGE_TEST_ID }),
        ]}
      />,
    );

    expect(screen.getByText(SINGLE_LABEL)).toBeTruthy();
    expect(screen.getByText(AVERAGE_LABEL)).toBeTruthy();
  });

  it('calls onToggle when an entry is pressed', async () => {
    const onToggle = jest.fn();
    await render(<ChartLegend entries={[entry({ onToggle })]} />);

    await fireEvent.press(screen.getByTestId(SINGLE_TEST_ID));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('reflects each series on/off state via accessibilityState', async () => {
    await render(
      <ChartLegend
        entries={[
          entry({ label: SINGLE_LABEL, testID: SINGLE_TEST_ID, visible: true }),
          entry({ label: AVERAGE_LABEL, testID: AVERAGE_TEST_ID, visible: false }),
        ]}
      />,
    );

    expect(screen.getByTestId(SINGLE_TEST_ID).props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId(AVERAGE_TEST_ID).props.accessibilityState.checked).toBe(false);
  });
});
