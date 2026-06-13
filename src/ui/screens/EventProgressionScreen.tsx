/**
 * Event PR-progression screen. Reached by tapping a competed-event row on the
 * CompetitorScreen. Reads the competitor id, event id (and optional name) from
 * the route params, fetches the single-record progression via usePrProgression,
 * and renders it as a chronological list of date + personal-record time.
 *
 * Dumb by design: all fetching/computation lives in the hook. It renders the
 * four states every WCA-backed screen must handle — loading, error (with retry),
 * empty (no records yet), and the loaded progression list.
 *
 * The event is shown as its raw id (e.g. "333"); readable names are the separate
 * events.py port (a later slice).
 */
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePrProgression } from '@/hooks/usePrProgression';
import { formatTime } from '@/domain/services/formatting';
import type { RecordPoint } from '@/domain/models/recordPoint';
import { colors } from '@/ui/theme/colors';

const EMPTY_MESSAGE = 'No personal records yet for this event.';
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const RETRY_BUTTON_LABEL = 'Try again';
const LOADING_TEST_ID = 'progression-loading';

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
  const { data, loading, error, reload } = usePrProgression(id, event);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>{event}</Text>
        <Text style={styles.subtitle}>{name ?? id}</Text>
      </View>
      <ProgressionBody data={data} loading={loading} error={error} onRetry={reload} />
    </View>
  );
}

interface ProgressionBodyProps {
  data: RecordPoint[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}

function ProgressionBody({ data, loading, error, onRetry }: ProgressionBodyProps) {
  if (loading) {
    return (
      <ActivityIndicator testID={LOADING_TEST_ID} style={styles.centered} color={colors.primary} />
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>{error.message || GENERIC_ERROR_MESSAGE}</Text>
        <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button">
          <Text style={styles.buttonLabel}>{RETRY_BUTTON_LABEL}</Text>
        </Pressable>
      </View>
    );
  }
  if (data.length === 0) {
    return <Text style={[styles.centered, styles.message]}>{EMPTY_MESSAGE}</Text>;
  }
  return (
    <FlatList
      data={data}
      keyExtractor={(point) => point.date}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.rowDate}>{item.date}</Text>
          <Text style={styles.rowTime}>{formatTime(item.value)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, gap: 4 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  message: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  buttonLabel: { color: '#ffffff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  rowDate: { fontSize: 15, color: colors.muted },
  rowTime: { fontSize: 17, fontWeight: '600', color: colors.text },
});
