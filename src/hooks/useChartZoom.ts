/**
 * Holds a chart's visible time window as React state and exposes the operations
 * that move it: pinch-zoom, pan, and reset. The window arithmetic lives in the
 * (pure, fully tested) zoomWindow/panWindow; this hook is the UI-state bridge a
 * GestureDetector drives. The pinch/pan gestures themselves are wired in the
 * component and verified by hand in Expo Go — only this state logic is unit-tested.
 */
import { useCallback, useEffect, useState } from 'react';

import { zoomWindow, panWindow } from '@/domain/services/chart';
import type { TimeRange, TimeWindow } from '@/domain/services/chart';

export interface ChartZoom {
  /** The currently visible slice of the time axis. */
  window: TimeWindow;
  /** Whether the window has been narrowed or shifted away from the full range. */
  isZoomed: boolean;
  /** Pinch: scaleFactor > 1 zooms in; focusFraction (0..1) is the held point. */
  zoomBy: (scaleFactor: number, focusFraction: number) => void;
  /** Drag: shift the window by a fraction of its span (positive = forward). */
  panBy: (deltaFraction: number) => void;
  /** Restore the full-range view. */
  reset: () => void;
}

function fullWindowOf(fullRange: TimeRange): TimeWindow {
  return { start: fullRange.min, end: fullRange.max };
}

export function useChartZoom(fullRange: TimeRange): ChartZoom {
  const [window, setWindow] = useState<TimeWindow>(() => fullWindowOf(fullRange));

  // A new competitor or event changes the data's full extent; snap the view back
  // to it rather than leaving a window pinned to the previous person's dates.
  useEffect(() => {
    setWindow(fullWindowOf(fullRange));
  }, [fullRange.min, fullRange.max]);

  const zoomBy = useCallback(
    (scaleFactor: number, focusFraction: number) =>
      setWindow((current) => zoomWindow(current, fullRange, scaleFactor, focusFraction)),
    [fullRange.min, fullRange.max],
  );

  const panBy = useCallback(
    (deltaFraction: number) =>
      setWindow((current) => panWindow(current, fullRange, deltaFraction)),
    [fullRange.min, fullRange.max],
  );

  const reset = useCallback(() => setWindow(fullWindowOf(fullRange)), [fullRange.min, fullRange.max]);

  const isZoomed = window.start !== fullRange.min || window.end !== fullRange.max;

  return { window, isZoomed, zoomBy, panBy, reset };
}
