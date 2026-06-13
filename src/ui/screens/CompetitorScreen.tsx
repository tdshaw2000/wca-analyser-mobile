/**
 * Competitor analysis screen. Reached from a search result via /person/[id].
 * For now it just confirms which competitor was tapped, reading the WCA id (and
 * optional name) from the route params. The actual analysis — competed events,
 * results, and PR progression — will be ported into here in later slices.
 *
 * Dumb by design: it only reads route params. Any fetching will live in a hook.
 */
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';

const ANALYSIS_PLACEHOLDER = 'Results and personal-record analysis coming soon.';

// A `type` (not `interface`): useLocalSearchParams constrains its generic to
// Record<string, string | string[]>, which only type aliases satisfy (they get
// an implicit index signature; interfaces don't).
type CompetitorRouteParams = {
  /** WCA id from the [id] path segment, e.g. "2007VALK01". */
  id: string;
  /** Display name passed along from the search result, if any. */
  name?: string;
};

export default function CompetitorScreen() {
  const { id, name } = useLocalSearchParams<CompetitorRouteParams>();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{name ?? id}</Text>
      <Text style={styles.wcaId}>{id}</Text>
      <Text style={styles.placeholder}>{ANALYSIS_PLACEHOLDER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, gap: 8 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  wcaId: { fontSize: 14, color: colors.muted },
  placeholder: { fontSize: 15, color: colors.muted, marginTop: 16 },
});
