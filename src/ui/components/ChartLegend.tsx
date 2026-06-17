/**
 * A chart legend: one swatch + label per series. Presentational and reusable —
 * the caller supplies the entries, so any chart (the record chart now, a
 * scatterplot later) can share it.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';

export interface ChartLegendEntry {
  /** The series name shown beside the swatch, e.g. "Single". */
  label: string;
  /** The series colour, used for the swatch. */
  colour: string;
}

interface ChartLegendProps {
  entries: ChartLegendEntry[];
}

export function ChartLegend({ entries }: ChartLegendProps) {
  return (
    <View style={styles.legend}>
      {entries.map((entry) => (
        <View key={entry.label} style={styles.legendEntry}>
          <View style={[styles.legendSwatch, { backgroundColor: entry.colour }]} />
          <Text style={styles.legendLabel}>{entry.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 4 },
  legendEntry: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 2 },
  legendLabel: { fontSize: 12, color: colors.muted },
});
