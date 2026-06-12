/**
 * Bridges the search UI to the data layer. Given a search term, it runs
 * searchPersons and exposes the standard { data, loading, error, reload } shape
 * every WCA-backed screen consumes. Empty/whitespace terms don't hit the API.
 *
 * Reactive by design: the screen owns the query state (updating it on submit)
 * and passes it in; this hook re-searches whenever the query changes.
 */
import { useCallback, useEffect, useState } from 'react';

import { searchPersons } from '@/data/repositories/personsRepository';
import type { Person } from '@/domain/models/person';

const EMPTY_QUERY_LENGTH = 0;

export interface UseSearchPersonsResult {
  data: Person[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useSearchPersons(query: string): UseSearchPersonsResult {
  const [data, setData] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Bumping this re-runs the effect even when the query is unchanged (reload).
  const [reloadCounter, setReloadCounter] = useState(0);

  const reload = useCallback(() => setReloadCounter((count) => count + 1), []);

  useEffect(() => {
    if (query.trim().length === EMPTY_QUERY_LENGTH) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Ignore a resolved/rejected search once the query changed or we unmounted,
    // so a slow earlier request can't overwrite a newer one's results.
    let active = true;
    setLoading(true);
    setError(null);

    searchPersons(query)
      .then((persons) => {
        if (active) setData(persons);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof Error ? caught : new Error(String(caught)));
        setData([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, reloadCounter]);

  return { data, loading, error, reload };
}
