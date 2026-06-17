/**
 * A chart legend: one pressable swatch + label per series. Presentational and
 * reusable — the caller supplies the entries (and owns the visibility state), so
 * any chart (the record chart now, a scatterplot later) can share it. Pressing
 * an entry toggles its series; a hidden series reads as unchecked and renders
 * faded rather than disappearing, so it can be turned back on.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';

export interface ChartLegendEntry {
  /** The series name shown beside the swatch, e.g. "Single". */
  label: string;
  /** The series colour, used for the swatch. */
  colour: string;
  /** Whether the series is currently shown on the chart. */
  visible: boolean;
  /** Called when the entry is pressed, to toggle the series. */
  onToggle: () => void;
  /** Test id for the pressable entry. */
  testID: string;
}

interface ChartLegendProps {
  entries: ChartLegendEntry[];
}

// Opacity applied to a hidden series' entry, so it reads as off without vanishing.
const HIDDEN_OPACITY = 0.35;

export function ChartLegend({ entries }: ChartLegendProps) {
  return (
    <View style={styles.legend}>
      {entries.map((entry) => (
        <Pressable
          key={entry.label}
          testID={entry.testID}
          style={[styles.legendEntry, !entry.visible && styles.legendEntryHidden]}
          onPress={entry.onToggle}
          accessibilityRole="button"
          accessibilityState={{ checked: entry.visible }}
        >
          <View style={[styles.legendSwatch, { backgroundColor: entry.colour }]} />
          <Text style={styles.legendLabel}>{entry.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 4 },
  legendEntry: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendEntryHidden: { opacity: HIDDEN_OPACITY },
  legendSwatch: { width: 12, height: 12, borderRadius: 2 },
  legendLabel: { fontSize: 12, color: colors.muted },
});
