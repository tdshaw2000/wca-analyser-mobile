/**
 * Bridges an event PR-progression screen to the data + domain layers. Given a
 * WCA id and event id, it fetches the competitor's results and competition dates
 * (in parallel), runs them through singleRecordProgression and
 * averageRecordProgression, and exposes the standard { data, loading, error,
 * reload } shape plus averages. Empty ids don't hit the API.
 *
 * data is the chronological list of single personal-record points for the event;
 * averages is the matching list for average personal records.
 */
import { useCallback, useEffect, useState } from 'react';

import { getResults } from '@/data/repositories/resultsRepository';
import { getCompetitionDates } from '@/data/repositories/competitionsRepository';
import { singleRecordProgression, averageRecordProgression } from '@/domain/services/records';
import type { RecordPoint } from '@/domain/models/recordPoint';

const EMPTY_LENGTH = 0;

export interface UsePrProgressionResult {
  data: RecordPoint[];
  averages: RecordPoint[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function usePrProgression(wcaId: string, eventId: string): UsePrProgressionResult {
  const [data, setData] = useState<RecordPoint[]>([]);
  const [averages, setAverages] = useState<RecordPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Bumping this re-runs the effect even when the ids are unchanged (reload).
  const [reloadCounter, setReloadCounter] = useState(0);

  const reload = useCallback(() => setReloadCounter((count) => count + 1), []);

  useEffect(() => {
    if (wcaId.trim().length === EMPTY_LENGTH || eventId.trim().length === EMPTY_LENGTH) {
      setData([]);
      setAverages([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Ignore a resolved/rejected fetch once the ids changed or we unmounted, so a
    // slow earlier request can't overwrite a newer one's result.
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getResults(wcaId, eventId), getCompetitionDates(wcaId)])
      .then(([results, competitionDates]) => {
        if (!active) return;
        setData(singleRecordProgression(results, competitionDates));
        setAverages(averageRecordProgression(results, competitionDates));
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof Error ? caught : new Error(String(caught)));
        setData([]);
        setAverages([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [wcaId, eventId, reloadCounter]);

  return { data, averages, loading, error, reload };
}
