/**
 * Person search screen. Owns the search input, hands the submitted term to
 * useSearchPersons, and renders the four states every WCA-backed screen must
 * handle: loading, error (incl. offline, surfaced via the error message), empty
 * (after a search), and results. Dumb by design — all fetching lives in the hook.
 */
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useSearchPersons } from '@/hooks/useSearchPersons';
import type { Person } from '@/domain/models/person';
import { colors } from '@/ui/theme/colors';

const SEARCH_PLACEHOLDER = 'Search by name';
const SEARCH_BUTTON_LABEL = 'Search';
const RETRY_BUTTON_LABEL = 'Try again';
const IDLE_MESSAGE = 'Search for a competitor by name.';
const EMPTY_MESSAGE = 'No competitors found.';
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const LOADING_TEST_ID = 'search-loading';

export default function PersonSearchScreen() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const { data, loading, error, reload } = useSearchPersons(submittedQuery);

  const hasSearched = submittedQuery.trim().length > 0;

  function submit() {
    setSubmittedQuery(query);
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder={SEARCH_PLACEHOLDER}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submit}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
        />
        <Pressable style={styles.button} onPress={submit} accessibilityRole="button">
          <Text style={styles.buttonLabel}>{SEARCH_BUTTON_LABEL}</Text>
        </Pressable>
      </View>
      <SearchBody
        data={data}
        loading={loading}
        error={error}
        hasSearched={hasSearched}
        onRetry={reload}
      />
    </View>
  );
}

interface SearchBodyProps {
  data: Person[];
  loading: boolean;
  error: Error | null;
  hasSearched: boolean;
  onRetry: () => void;
}

function SearchBody({ data, loading, error, hasSearched, onRetry }: SearchBodyProps) {
  if (loading) {
    return <ActivityIndicator testID={LOADING_TEST_ID} style={styles.centered} color={colors.primary} />;
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
  if (data.length > 0) {
    return (
      <FlatList
        data={data}
        keyExtractor={(person) => person.wcaId}
        renderItem={({ item }) => <PersonRow person={item} />}
      />
    );
  }
  if (hasSearched) {
    return <Text style={[styles.centered, styles.message]}>{EMPTY_MESSAGE}</Text>;
  }
  return <Text style={[styles.centered, styles.message]}>{IDLE_MESSAGE}</Text>;
}

function PersonRow({ person }: { person: Person }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowName}>{person.name}</Text>
      <Text style={styles.rowWcaId}>{person.wcaId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  buttonLabel: { color: '#ffffff', fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  message: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  rowName: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowWcaId: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
