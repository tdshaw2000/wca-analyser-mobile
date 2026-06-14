/**
 * Presentational body for a competitor's PR progression in one event. Given the
 * single- and average-record series (plus loading/error from the hook), it
 * renders the four states every WCA-backed view must handle — loading, error
 * (with retry), empty (no records of either kind yet), and the loaded chart +
 * tables. Dumb by design: all fetching/computation lives in the calling hook.
 */
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatTime } from '@/domain/services/formatting';
import { toRecordSeries } from '@/domain/services/chart';
import { RecordChart } from '@/ui/components/RecordChart';
import type { RecordPoint } from '@/domain/models/recordPoint';
import { colors } from '@/ui/theme/colors';

export const PROGRESSION_LOADING_TEST_ID = 'progression-loading';
export const PROGRESSION_EMPTY_MESSAGE = 'No personal records yet for this event.';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const RETRY_BUTTON_LABEL = 'Try again';
const SINGLE_TABLE_HEADING = 'Single';
const AVERAGE_TABLE_HEADING = 'Average';
const EMPTY_COUNT = 0;

interface EventProgressionProps {
  singles: RecordPoint[];
  averages: RecordPoint[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function EventProgression({
  singles,
  averages,
  loading,
  error,
  onRetry,
}: EventProgressionProps) {
  if (loading) {
    return (
      <ActivityIndicator
        testID={PROGRESSION_LOADING_TEST_ID}
        style={styles.centered}
        color={colors.primary}
      />
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
  if (singles.length === EMPTY_COUNT && averages.length === EMPTY_COUNT) {
    return <Text style={[styles.centered, styles.message]}>{PROGRESSION_EMPTY_MESSAGE}</Text>;
  }
  return (
    <ScrollView contentContainerStyle={styles.tables}>
      <RecordChart singles={toRecordSeries(singles)} averages={toRecordSeries(averages)} />
      <RecordTable heading={SINGLE_TABLE_HEADING} points={singles} />
      <RecordTable heading={AVERAGE_TABLE_HEADING} points={averages} />
    </ScrollView>
  );
}

interface RecordTableProps {
  heading: string;
  points: RecordPoint[];
}

// A labelled progression table. Renders nothing when empty so a competitor with
// only single records (e.g. a format without an average) shows just that table.
function RecordTable({ heading, points }: RecordTableProps) {
  if (points.length === EMPTY_COUNT) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {points.map((point) => (
        <View key={point.date} style={styles.row}>
          <Text style={styles.rowDate}>{point.date}</Text>
          <Text style={styles.rowTime}>{formatTime(point.value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
  tables: { paddingBottom: 24 },
  section: { marginTop: 8 },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
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
