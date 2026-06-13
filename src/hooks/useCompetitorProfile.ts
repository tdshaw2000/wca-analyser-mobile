/**
 * Bridges the competitor screen to the data layer. Given a WCA id, it runs
 * getProfile and exposes the standard { data, loading, error, reload } shape
 * every WCA-backed screen consumes. An empty/whitespace id doesn't hit the API.
 *
 * data is a single Profile (or null before one has loaded), not a list — a
 * competitor screen shows one competitor.
 */
import { useCallback, useEffect, useState } from 'react';

import { getProfile } from '@/data/repositories/personsRepository';
import type { Profile } from '@/domain/models/profile';

const EMPTY_ID_LENGTH = 0;

export interface UseCompetitorProfileResult {
  data: Profile | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useCompetitorProfile(wcaId: string): UseCompetitorProfileResult {
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Bumping this re-runs the effect even when the id is unchanged (reload).
  const [reloadCounter, setReloadCounter] = useState(0);

  const reload = useCallback(() => setReloadCounter((count) => count + 1), []);

  useEffect(() => {
    if (wcaId.trim().length === EMPTY_ID_LENGTH) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Ignore a resolved/rejected fetch once the id changed or we unmounted, so a
    // slow earlier request can't overwrite a newer one's result.
    let active = true;
    setLoading(true);
    setError(null);

    getProfile(wcaId)
      .then((profile) => {
        if (active) setData(profile);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof Error ? caught : new Error(String(caught)));
        setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [wcaId, reloadCounter]);

  return { data, loading, error, reload };
}
