import { renderHook, act } from '@testing-library/react-native';

import { useChartZoom } from '@/hooks/useChartZoom';

// The hook holds the chart's visible time window as React state, driving it with
// the already-tested zoomWindow/panWindow. It is the testable core of zoom; the
// pinch/pan gestures that call it are a manual Expo Go check. No device needed.
const DAY_MS = 24 * 60 * 60 * 1000;
const FULL_RANGE = { min: 0, max: 100 * DAY_MS };

describe('useChartZoom', () => {
  it('starts showing the full range and reports it is not zoomed', () => {
    const { result } = renderHook(() => useChartZoom(FULL_RANGE));

    expect(result.current.window).toEqual({ start: 0, end: 100 * DAY_MS });
    expect(result.current.isZoomed).toBe(false);
  });

  it('narrows the window and flags it zoomed when zooming in', () => {
    const { result } = renderHook(() => useChartZoom(FULL_RANGE));

    act(() => result.current.zoomBy(2, 0.5));

    expect(result.current.window).toEqual({ start: 25 * DAY_MS, end: 75 * DAY_MS });
    expect(result.current.isZoomed).toBe(true);
  });

  it('slides the visible window when panning', () => {
    const { result } = renderHook(() => useChartZoom(FULL_RANGE));

    act(() => result.current.zoomBy(2, 0.5));
    act(() => result.current.panBy(0.5));

    // span 50d shifted forward by 0.5 * 50d = 25d -> days 50..100.
    expect(result.current.window).toEqual({ start: 50 * DAY_MS, end: 100 * DAY_MS });
  });

  it('restores the full range on reset', () => {
    const { result } = renderHook(() => useChartZoom(FULL_RANGE));

    act(() => result.current.zoomBy(2, 0.5));
    act(() => result.current.reset());

    expect(result.current.window).toEqual({ start: 0, end: 100 * DAY_MS });
    expect(result.current.isZoomed).toBe(false);
  });

  it('snaps back to the full range when the data extent changes', () => {
    const { result, rerender } = renderHook((range) => useChartZoom(range), {
      initialProps: FULL_RANGE,
    });

    act(() => result.current.zoomBy(2, 0.5));
    rerender({ min: 0, max: 200 * DAY_MS });

    expect(result.current.window).toEqual({ start: 0, end: 200 * DAY_MS });
  });
});
