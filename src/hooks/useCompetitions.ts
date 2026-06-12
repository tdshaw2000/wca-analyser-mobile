/**
 * Hook layer: glue between the data/domain layers and React components.
 * Components stay "dumb" — they just render whatever { data, loading, error }
 * this hook gives them, plus a reload() for retry buttons.
 *
 * Flow: repository (fetch + map) -> domain service (business rules) -> state.
 */
import { useEffect, useState } from 'react';

import { WcaApiError } from '@/data/api/wcaClient';
import { listCompetitions } from '@/data/repositories/competitionsRepository';
import type { Competition } from '@/domain/models/competition';
import { sortByStartDate } from '@/domain/services/competitionService';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseCompetitionsResult extends AsyncState<Competition[]> {
  reload: () => void;
}

export function useCompetitions(): UseCompetitionsResult {
  const [state, setState] = useState<AsyncState<Competition[]>>({
    data: null,
    loading: true,
    error: null,
  });
  // Bumping this re-runs the effect; that's our "reload" mechanism.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({ data: null, loading: true, error: null });

    listCompetitions({ signal: controller.signal })
      .then((competitions) => {
        if (!active) return;
        // Domain rule applied here — sorting (placeholder for ported logic).
        setState({ data: sortByStartDate(competitions), loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof Error && err.name === 'AbortError') return; // unmounted / superseded
        const message =
          err instanceof WcaApiError
            ? err.message
            : 'Something went wrong loading competitions.';
        setState({ data: null, loading: false, error: message });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadToken]);

  return { ...state, reload: () => setReloadToken((t) => t + 1) };
}
