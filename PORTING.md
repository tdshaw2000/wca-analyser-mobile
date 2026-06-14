# PORTING.md — Python → Mobile watermark

This app is a port of the Python source app. The Python app is the **source of
truth for behaviour** and keeps evolving; this file tracks **how far the port has
caught up**, so future Python changes become a precise `git diff` instead of a guess.

See `CLAUDE.md` for the porting rules (test-first, vertical slices, the module map).

## Source

- **Python repo:** `/home/tim/apps/wca-records-analyser`
- **Tracking baseline:** `3a26bcd` (2026-06-13) — the commit from which this
  watermark discipline starts. Rows marked _pre-tracking_ were ported before this
  file existed; their exact source revision is unknown, so they must be
  **re-verified against the current Python source the next time they are touched.**

## Status

| Python module      | Mobile target                                   | Status        | Ported from |
| ------------------ | ----------------------------------------------- | ------------- | ----------- |
| `wca_client.py`    | `data/api/wcaClient.ts` + `types.ts` + `data/repositories/` | ported    | pre-tracking |
| `records.py`       | `domain/services/records.ts`                    | ported        | pre-tracking |
| `formatting.py`    | `domain/services/formatting.ts`                 | ported        | pre-tracking |
| `events.py`        | `domain/services/events.ts` + `models/namedEvent.ts` | ported   | `7371c58`    |
| `chart.py`         | `domain/services/chart.ts` (UI renders natively) | partial      | `8529b4a`    |
| `web.py` (routes)  | `app/` routes + `ui/screens/`                   | partial       | pre-tracking |

_Mobile screens so far: PersonSearch, Competitor, EventProgression (one combined
SVG chart overlaying the single + average PR progressions — single blue, average
green, shared time x-axis, time-labelled y-axis — above the two tables)._

_`chart.py` is **partial**: `toRecordSeries` is ported for timed events only.
The Multi-Blind (`333mbf`, plotted by points) and Fewest-Moves (`333fm`, averages
scaled to moves) branches, plus `to_consistency_series`, are not yet ported — they
depend on `format_single`/`format_average`/`decode_multi_blind`, which formatting.ts
also still lacks (only `format_time` is ported, despite the row above)._

_The chart **rendering** logic from `static/records-chart.js` (no pytest — the JS
is the spec) is ported: `resultBounds`/`dateBounds`/`formatAxisTick` in chart.ts,
and `RecordChart` (the Chart.js line chart, redrawn as hand-rolled SVG). Not yet
ported: the moves/points tick branch, the "All results" scatter (`scatter-chart.js`),
and the consistency chart (`consistency-chart.js`)._

## Backlog (Python features not yet ported)

- **Chart — remaining `chart.py` cases:** `toRecordSeries` for Multi-Blind and
  Fewest-Moves, and `to_consistency_series`. These need `format_single`,
  `format_average`, `format_consistency`, and `decode_multi_blind` ported into
  formatting.ts first (each test-first), then the chart cases, then the native
  component handles the new event units. `RecordChart` already renders timed events.

## Workflow for any slice (new feature OR drift fix)

1. `cd /home/tim/apps/wca-records-analyser`; read the target module **and its
   pytest** at current `HEAD`.
2. Port the pytest case into a Jest test → watch it fail (**red**).
3. Port the implementation → **green**. (Test commit and code commit stay separate.)
4. Build/adjust the UI natively where the module maps to the web/UI layer.
5. **Bump this file:** update the row's status + `Ported from` SHA, and advance the
   tracking baseline if appropriate.

## Detecting drift (Python changed logic we already ported)

The danger is silent: Python alters behaviour we've copied and nothing flags it.
To check before touching a ported module, diff the Python source since the recorded SHA:

```sh
git -C /home/tim/apps/wca-records-analyser diff <Ported-from-SHA>..HEAD -- wca_records_analyser/<module>.py
```

The changed **pytest** in that diff is the precise spec for what to re-port — fix
the test first (red), then the implementation (green).
