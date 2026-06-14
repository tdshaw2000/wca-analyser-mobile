/**
 * Competitor screen. Reached from a search result via /person/[id]. Reads the
 * WCA id (and optional name) from the route params, fetches the profile via
 * useCompetitorProfile, and shows the competitor's PR progression for one event
 * at a time — defaulting to 3x3x3 — with an on-page dropdown to switch events.
 *
 * Event selection lives here (not on a separate route): the EventPicker offers
 * the competitor's competed events, and usePrProgression is driven by whichever
 * is selected. Dumb by design — fetching/computation live in the hooks, and the
 * progression's loading/error/empty/loaded states live in EventProgression.
 *
 * The screen handles its own profile states: loading, error (with retry), and
 * empty (a competitor with no competed events, so no picker is shown).
 */
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCompetitorProfile } from '@/hooks/useCompetitorProfile';
import { usePrProgression } from '@/hooks/usePrProgression';
import { namedEvents, defaultEventId } from '@/domain/services/events';
import { EventPicker } from '@/ui/components/EventPicker';
import { EventProgression } from '@/ui/components/EventProgression';
import { colors } from '@/ui/theme/colors';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const RETRY_BUTTON_LABEL = 'Try again';
const EMPTY_MESSAGE = 'No competed events recorded.';
const LOADING_TEST_ID = 'competitor-loading';
const AVATAR_TEST_ID = 'competitor-avatar';
const NO_EVENTS = 0;

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

  // The picked event overrides the default; the default is 3x3x3 (or, for a
  // competitor who never did it, their first event by name). Both are empty
  // until the profile loads, which keeps usePrProgression idle in the meantime.
  const eventIds = data?.eventIds ?? [];
  const [pickedEventId, setPickedEventId] = useState<string | null>(null);
  const selectedEventId = pickedEventId ?? defaultEventId(eventIds);
  const progression = usePrProgression(id, selectedEventId);

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
        eventIds={eventIds}
        selectedEventId={selectedEventId}
        onSelectEvent={setPickedEventId}
        loading={loading}
        error={error}
        onRetryProfile={reload}
        progression={progression}
      />
    </View>
  );
}

interface ProfileBodyProps {
  eventIds: string[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  loading: boolean;
  error: Error | null;
  onRetryProfile: () => void;
  progression: ReturnType<typeof usePrProgression>;
}

function ProfileBody({
  eventIds,
  selectedEventId,
  onSelectEvent,
  loading,
  error,
  onRetryProfile,
  progression,
}: ProfileBodyProps) {
  if (loading) {
    return (
      <ActivityIndicator testID={LOADING_TEST_ID} style={styles.centered} color={colors.primary} />
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>{error.message || GENERIC_ERROR_MESSAGE}</Text>
        <Pressable style={styles.button} onPress={onRetryProfile} accessibilityRole="button">
          <Text style={styles.buttonLabel}>{RETRY_BUTTON_LABEL}</Text>
        </Pressable>
      </View>
    );
  }
  if (eventIds.length === NO_EVENTS) {
    return <Text style={[styles.centered, styles.message]}>{EMPTY_MESSAGE}</Text>;
  }
  return (
    <>
      <EventPicker
        events={namedEvents(eventIds)}
        selectedEventId={selectedEventId}
        onSelect={onSelectEvent}
      />
      <EventProgression
        singles={progression.data}
        averages={progression.averages}
        loading={progression.loading}
        error={progression.error}
        onRetry={progression.reload}
      />
    </>
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
});
