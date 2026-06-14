import { render, screen, fireEvent } from '@testing-library/react-native';

import { EventPicker, EVENT_PICKER_TRIGGER_TEST_ID } from '@/ui/components/EventPicker';
import type { NamedEvent } from '@/domain/models/namedEvent';

// A tap-to-open dropdown: the trigger shows the current event; opening it reveals
// the other events; picking one reports the raw event id back to the caller.
const EVENTS: NamedEvent[] = [
  { eventId: '222', name: '2x2x2 Cube' },
  { eventId: '333', name: '3x3x3 Cube' },
  { eventId: 'pyram', name: 'Pyraminx' },
];
const SELECTED_ID = '333';
const SELECTED_NAME = '3x3x3 Cube';
const OTHER_NAME = 'Pyraminx';
const OTHER_ID = 'pyram';

describe('EventPicker', () => {
  it('shows the selected event display name on the trigger', () => {
    render(<EventPicker events={EVENTS} selectedEventId={SELECTED_ID} onSelect={jest.fn()} />);

    expect(screen.getByTestId(EVENT_PICKER_TRIGGER_TEST_ID)).toBeTruthy();
    expect(screen.getByText(SELECTED_NAME)).toBeTruthy();
  });

  it('keeps the other events hidden until the trigger is pressed', () => {
    render(<EventPicker events={EVENTS} selectedEventId={SELECTED_ID} onSelect={jest.fn()} />);

    expect(screen.queryByText(OTHER_NAME)).toBeNull();
  });

  it('reveals the full event list when the trigger is pressed', () => {
    render(<EventPicker events={EVENTS} selectedEventId={SELECTED_ID} onSelect={jest.fn()} />);

    fireEvent.press(screen.getByTestId(EVENT_PICKER_TRIGGER_TEST_ID));

    expect(screen.getByText(OTHER_NAME)).toBeTruthy();
  });

  it('reports the chosen event id and closes the list when an event is picked', () => {
    const onSelect = jest.fn();
    render(<EventPicker events={EVENTS} selectedEventId={SELECTED_ID} onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId(EVENT_PICKER_TRIGGER_TEST_ID));
    fireEvent.press(screen.getByText(OTHER_NAME));

    expect(onSelect).toHaveBeenCalledWith(OTHER_ID);
    // The list closes again, so the picked event is no longer listed below the trigger.
    expect(screen.queryByText(OTHER_NAME)).toBeNull();
  });
});
