/**
 * Presentational body for a competitor's PR progression in one event. Given the
 * single- and average-record series (plus loading/error from the hook), it
 * renders the four states every WCA-backed view must handle — loading, error
 * (with retry), empty (no records of either kind yet), and the loaded chart +
 * tables. Dumb by design: all fetching/computation lives in the calling hook.
 */
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { formatTime } from '@/domain/services/formatting';
import { toRecordSeries, toDailyRangeSeries } from '@/domain/services/chart';
import { RecordChart } from '@/ui/components/RecordChart';
import type { RecordPoint } from '@/domain/models/recordPoint';
import type { DailySolveRange } from '@/domain/models/dailySolveRange';
import { colors } from '@/ui/theme/colors';

export const PROGRESSION_LOADING_TEST_ID = 'progression-loading';
export const PROGRESSION_EMPTY_MESSAGE = 'No personal records yet for this event.';
export const ALL_RESULTS_TEST_ID = 'all-results-scatter';
export const ALL_RESULTS_HEADING = 'All results';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const RETRY_BUTTON_LABEL = 'Try again';
const SINGLE_TABLE_HEADING = 'Single';
const AVERAGE_TABLE_HEADING = 'Average';
// Subtitles mirror the web's: with averages both series are shown; otherwise just
// the singles. (Touch: tap, not click, to hide a series.)
const ALL_RESULTS_SUBTITLE_WITH_AVERAGE = 'Every single and average. Tap the legend to hide a series.';
const ALL_RESULTS_SUBTITLE_SINGLE_ONLY = 'Every result over time.';
const EMPTY_COUNT = 0;
// Gap between the two tables when side by side in landscape.
const COLUMN_GAP = 16;
const COLUMN_COUNT = 2;

interface EventProgressionProps {
  singles: RecordPoint[];
  averages: RecordPoint[];
  /** Every solve over time (not just records), for the all-results scatter. */
  allSingles?: RecordPoint[];
  /** Every attempted average over time (not just records), for the scatter. */
  allAverages?: RecordPoint[];
  /** Each day's fastest/slowest solve, shaded as the scatter's daily-range band. */
  dailyRanges?: DailySolveRange[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function EventProgression({
  singles,
  averages,
  allSingles = [],
  allAverages = [],
  dailyRanges = [],
  loading,
  error,
  onRetry,
}: EventProgressionProps) {
  // Landscape has room to set the Single and Average tables side by side rather
  // than stacked, matching how the chart and picker use the wider screen. Each
  // table gets an explicit half-screen width (a percentage won't resolve inside
  // the ScrollView), so the two columns are always equal.
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const tableColumnWidth = (width - COLUMN_GAP) / COLUMN_COUNT;

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
  const hasAllResults =
    allSingles.length > EMPTY_COUNT || allAverages.length > EMPTY_COUNT;
  const allResultsSubtitle =
    allAverages.length > EMPTY_COUNT
      ? ALL_RESULTS_SUBTITLE_WITH_AVERAGE
      : ALL_RESULTS_SUBTITLE_SINGLE_ONLY;

  return (
    <ScrollView contentContainerStyle={styles.tables}>
      <RecordChart singles={toRecordSeries(singles)} averages={toRecordSeries(averages)} />
      <View style={isLandscape ? styles.tablesRow : undefined}>
        <RecordTable
          heading={SINGLE_TABLE_HEADING}
          points={singles}
          style={isLandscape && { width: tableColumnWidth }}
        />
        <RecordTable
          heading={AVERAGE_TABLE_HEADING}
          points={averages}
          style={isLandscape && { width: tableColumnWidth }}
        />
      </View>
      {hasAllResults ? (
        <View testID={ALL_RESULTS_TEST_ID} style={styles.allResults}>
          <Text style={styles.sectionHeading}>{ALL_RESULTS_HEADING}</Text>
          <Text style={styles.subtitle}>{allResultsSubtitle}</Text>
          <RecordChart
            singles={toRecordSeries(allSingles)}
            averages={toRecordSeries(allAverages)}
            band={toDailyRangeSeries(dailyRanges)}
            connected={false}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

interface RecordTableProps {
  heading: string;
  points: RecordPoint[];
  /** Extra style for the table's container, e.g. flex sizing when side by side. */
  style?: StyleProp<ViewStyle>;
}

// A labelled progression table. Renders nothing when empty so a competitor with
// only single records (e.g. a format without an average) shows just that table.
function RecordTable({ heading, points, style }: RecordTableProps) {
  if (points.length === EMPTY_COUNT) return null;
  return (
    <View style={[styles.section, style]}>
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
  tablesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: COLUMN_GAP },
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
  subtitle: { fontSize: 13, color: colors.muted, paddingHorizontal: 16, paddingBottom: 4 },
  allResults: { marginTop: 16 },
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
