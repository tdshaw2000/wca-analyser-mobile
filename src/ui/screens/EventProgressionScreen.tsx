/**
 * Event PR-progression screen. Reached by tapping a competed-event row on the
 * CompetitorScreen. Reads the competitor id, event id (and optional name) from
 * the route params, fetches the single- and average-record progressions via
 * usePrProgression, and renders the EventProgression body (one combined chart
 * above the labelled single + average tables).
 *
 * Dumb by design: all fetching/computation lives in the hook, and all state
 * rendering (loading / error / empty / loaded) lives in EventProgression.
 *
 * The heading shows the event's display name (e.g. "3x3x3 Cube") via eventName.
 */
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { usePrProgression } from '@/hooks/usePrProgression';
import { eventName } from '@/domain/services/events';
import { EventProgression } from '@/ui/components/EventProgression';
import { colors } from '@/ui/theme/colors';

// A `type` (not `interface`): useLocalSearchParams constrains its generic to
// Record<string, string | string[]>, which only type aliases satisfy.
type EventRouteParams = {
  /** Competitor WCA id from the [id] path segment. */
  id: string;
  /** Event id from the [event] path segment, e.g. "333". */
  event: string;
  /** Competitor display name passed along from the previous screen, if any. */
  name?: string;
};

export default function EventProgressionScreen() {
  const { id, event, name } = useLocalSearchParams<EventRouteParams>();
  const { data, averages, loading, error, reload } = usePrProgression(id, event);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>{eventName(event)}</Text>
        <Text style={styles.subtitle}>{name ?? id}</Text>
      </View>
      <EventProgression
        singles={data}
        averages={averages}
        loading={loading}
        error={error}
        onRetry={reload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, gap: 4 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted },
});
