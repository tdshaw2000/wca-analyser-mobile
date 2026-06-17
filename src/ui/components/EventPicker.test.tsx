import { render, screen, fireEvent } from '@testing-library/react-native';

import { EventPicker, EVENT_PICKER_TEST_ID } from '@/ui/components/EventPicker';
import type { NamedEvent } from '@/domain/models/namedEvent';

// The event picker is the native OS picker: it offers every competed event, marks
// the current one as selected, and reports the chosen event id back to the caller.
// Its dialog is the platform's own and is not rendered under jest, so the options
// and selection are read off the picker node's `items`/`selectedIndex`, and a
// selection is simulated by firing its `onValueChange` handler.
const EVENTS: NamedEvent[] = [
  { eventId: '222', name: '2x2x2 Cube' },
  { eventId: '333', name: '3x3x3 Cube' },
  { eventId: 'pyram', name: 'Pyraminx' },
];
const SELECTED_ID = '333';
const SELECTED_NAME = '3x3x3 Cube';
const OTHER_ID = 'pyram';

describe('EventPicker', () => {
  it('offers every competed event as an option, in the order given', async () => {
    await render(<EventPicker events={EVENTS} selectedEventId={SELECTED_ID} onSelect={jest.fn()} />);

    const picker = screen.getByTestId(EVENT_PICKER_TEST_ID);
    expect(picker.props.items.map((item: { value: string }) => item.value)).toEqual([
      '222',
      '333',
      'pyram',
    ]);
    expect(picker.props.items.map((item: { label: string }) => item.label)).toEqual([
      '2x2x2 Cube',
      '3x3x3 Cube',
      'Pyraminx',
    ]);
  });

  it('marks the selected event as the current selection', async () => {
    await render(<EventPicker events={EVENTS} selectedEventId={SELECTED_ID} onSelect={jest.fn()} />);

    const picker = screen.getByTestId(EVENT_PICKER_TEST_ID);
    expect(picker.props.items[picker.props.selectedIndex].label).toBe(SELECTED_NAME);
  });

  it('reports the chosen event id when a different event is selected', async () => {
    const onSelect = jest.fn();
    await render(<EventPicker events={EVENTS} selectedEventId={SELECTED_ID} onSelect={onSelect} />);

    await fireEvent(screen.getByTestId(EVENT_PICKER_TEST_ID), 'onValueChange', OTHER_ID);

    expect(onSelect).toHaveBeenCalledWith(OTHER_ID);
  });
});
