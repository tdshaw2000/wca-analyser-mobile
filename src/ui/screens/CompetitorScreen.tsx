/**
 * Competitor screen. Reached from a search result via /person/[id]. Reads the
 * WCA id (and optional name) from the route params, then fetches the profile via
 * useCompetitorProfile and renders the competitor's avatar plus the events they
 * have competed in.
 *
 * Dumb by design: all fetching lives in the hook. It renders the four states
 * every WCA-backed screen must handle — loading, error (with retry), empty (a
 * competitor with no competed events), and the loaded event list.
 *
 * Events are shown by their display name (e.g. "3x3x3 Cube") via namedEvents,
 * sorted alphabetically; navigation still carries the raw event id.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCompetitorProfile } from '@/hooks/useCompetitorProfile';
import { namedEvents } from '@/domain/services/events';
import type { Profile } from '@/domain/models/profile';
import { colors } from '@/ui/theme/colors';

const EVENTS_HEADING = 'Competed events';
const EMPTY_MESSAGE = 'No competed events recorded.';
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const RETRY_BUTTON_LABEL = 'Try again';
const LOADING_TEST_ID = 'competitor-loading';
const AVATAR_TEST_ID = 'competitor-avatar';
// expo-router route pattern; [id] and [event] are filled from params.
const EVENT_PROGRESSION_ROUTE = '/person/[id]/[event]';

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
  const { data, loading, error, reload } = useCompetitorProfile(id);
  const router = useRouter();

  function openEvent(eventId: string) {
    router.push({ pathname: EVENT_PROGRESSION_ROUTE, params: { id, event: eventId, name } });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {data?.person.avatarThumbUrl ? (
          <Image
            testID={AVATAR_TEST_ID}
            source={{ uri: data.person.avatarThumbUrl }}
            style={styles.avatar}
          />
        ) : null}
        <View style={styles.identity}>
          <Text style={styles.heading}>{name ?? id}</Text>
          <Text style={styles.wcaId}>{id}</Text>
        </View>
      </View>
      <ProfileBody
        data={data}
        loading={loading}
        error={error}
        onRetry={reload}
        onSelectEvent={openEvent}
      />
    </View>
  );
}

interface ProfileBodyProps {
  data: Profile | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  onSelectEvent: (eventId: string) => void;
}

function ProfileBody({ data, loading, error, onRetry, onSelectEvent }: ProfileBodyProps) {
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
  const eventIds = data?.eventIds ?? [];
  if (eventIds.length === 0) {
    return <Text style={[styles.centered, styles.message]}>{EMPTY_MESSAGE}</Text>;
  }
  const events = namedEvents(eventIds);
  return (
    <FlatList
      data={events}
      keyExtractor={(event) => event.eventId}
      ListHeaderComponent={<Text style={styles.eventsHeading}>{EVENTS_HEADING}</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.eventRow}
          onPress={() => onSelectEvent(item.eventId)}
          accessibilityRole="button"
        >
          <Text style={styles.eventRowText}>{item.name}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card },
  identity: { flex: 1, gap: 4 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  wcaId: { fontSize: 14, color: colors.muted },
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
  eventsHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
  eventRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  eventRowText: { fontSize: 16, color: colors.text },
});
