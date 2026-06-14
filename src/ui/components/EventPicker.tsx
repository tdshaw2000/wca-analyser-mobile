/**
 * A tap-to-open event dropdown. The trigger shows the currently selected event's
 * display name; pressing it opens a modal list of every event the competitor
 * competed in. Picking one reports its raw event id via onSelect and closes.
 *
 * Built from React Native primitives (Pressable + Modal) — no picker library —
 * to match the rest of the UI and keep dependencies minimal.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { eventName } from '@/domain/services/events';
import type { NamedEvent } from '@/domain/models/namedEvent';
import { colors } from '@/ui/theme/colors';

export const EVENT_PICKER_TRIGGER_TEST_ID = 'event-picker-trigger';

const DROPDOWN_INDICATOR = '▾';
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
  const [open, setOpen] = useState(false);

  function choose(eventId: string) {
    setOpen(false);
    onSelect(eventId);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{PICKER_LABEL}</Text>
      <Pressable
        testID={EVENT_PICKER_TRIGGER_TEST_ID}
        style={styles.trigger}
        onPress={() => setOpen((wasOpen) => !wasOpen)}
        accessibilityRole="button"
      >
        <Text style={styles.triggerText}>{eventName(selectedEventId)}</Text>
        <Text style={styles.indicator}>{DROPDOWN_INDICATOR}</Text>
      </Pressable>
      {open ? (
        <ScrollView style={styles.sheet}>
          {events.map((event) => (
            <Pressable
              key={event.eventId}
              style={styles.option}
              onPress={() => choose(event.eventId)}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.optionText,
                  event.eventId === selectedEventId && styles.optionTextSelected,
                ]}
              >
                {event.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  triggerText: { fontSize: 17, fontWeight: '600', color: colors.text },
  indicator: { fontSize: 16, color: colors.muted },
  sheet: {
    marginTop: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    maxHeight: 280,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: 16, color: colors.text },
  optionTextSelected: { fontWeight: '700', color: colors.primary },
});
