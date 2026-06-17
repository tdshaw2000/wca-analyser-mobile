/**
 * The event picker. Shows the competitor's competed events in the native OS
 * picker (an Android dialog), with the current event preselected; choosing one
 * reports its raw event id via onSelect.
 *
 * Uses @react-native-picker/picker so the option list is the platform's own
 * floating dialog — it overlays the screen instead of pushing the chart and
 * tables down the way an inline dropdown would. The events arrive already named
 * and ordered by the caller.
 */
import { Picker } from '@react-native-picker/picker';
import { StyleSheet, Text, View } from 'react-native';

import type { NamedEvent } from '@/domain/models/namedEvent';
import { colors } from '@/ui/theme/colors';

export const EVENT_PICKER_TEST_ID = 'event-picker';

const PICKER_LABEL = 'Event';

interface EventPickerProps {
  /** The events to choose from, already named and ordered by the caller. */
  events: NamedEvent[];
  /** The currently selected event id, e.g. "333". */
  selectedEventId: string;
  /** Called with the chosen event id when the user picks one. */
  onSelect: (eventId: string) => void;
}

export function EventPicker({ events, selectedEventId, onSelect }: EventPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{PICKER_LABEL}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          testID={EVENT_PICKER_TEST_ID}
          selectedValue={selectedEventId}
          onValueChange={(eventId) => onSelect(eventId)}
          style={styles.picker}
        >
          {events.map((event) => (
            <Picker.Item key={event.eventId} label={event.name} value={event.eventId} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 16, gap: 4 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerWrapper: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  picker: { color: colors.text },
});
