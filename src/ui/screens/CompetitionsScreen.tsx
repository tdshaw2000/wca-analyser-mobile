/**
 * "Dumb" screen: renders the four states every WCA-backed screen must handle —
 * loading / error (incl. offline) / empty / data — from the useCompetitions
 * hook. No fetching or business logic lives here.
 */
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCompetitions } from '@/hooks/useCompetitions';
import type { Competition } from '@/domain/models/competition';
import { colors } from '@/ui/theme/colors';

export default function CompetitionsScreen() {
  const { data, loading, error, reload } = useCompetitions();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading competitions…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn’t load competitions</Text>
        <Text style={styles.muted}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={reload}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>No competitions found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CompetitionRow competition={item} />}
    />
  );
}

function CompetitionRow({ competition }: { competition: Competition }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {competition.name}
      </Text>
      <Text style={styles.cardSubtitle}>
        {competition.city} · {competition.countryIso2}
      </Text>
      <Text style={styles.cardMeta}>
        {competition.startDate}
        {competition.endDate !== competition.startDate ? ` – ${competition.endDate}` : ''}
        {`  ·  ${competition.eventIds.length} events`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: colors.background,
  },
  muted: { color: colors.muted, textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  list: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 12, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardSubtitle: { fontSize: 14, color: colors.text },
  cardMeta: { fontSize: 13, color: colors.muted },
});
