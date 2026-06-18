# PORTING.md — Python → Mobile watermark

This app is a port of the Python source app. The Python app is the **source of
truth for behaviour** and keeps evolving; this file tracks **how far the port has
caught up**, so future Python changes become a precise `git diff` instead of a guess.

See `CLAUDE.md` for the porting rules (test-first, vertical slices, the module map).

## Source

- **Python repo:** `/home/tim/apps/wca-records-analyser`
- **Tracking baseline:** `355848d` (2026-06-17) — the Python source has been
  reviewed through this commit; everything in it is either ported (see the row
  SHAs above) or recorded as not-yet-ported (the chart narrative below + Backlog).
  The discipline began at `3a26bcd` (2026-06-13); rows marked _pre-tracking_ were
  ported before this file existed, so their exact source revision is unknown and
  they must be **re-verified against the current Python source the next time they
  are touched.**

## Status

| Python module      | Mobile target                                   | Status        | Ported from |
| ------------------ | ----------------------------------------------- | ------------- | ----------- |
| `wca_client.py`    | `data/api/wcaClient.ts` + `types.ts` + `data/repositories/` | ported    | `a3dfe85` (solves); rest pre-tracking |
| `records.py`       | `domain/services/records.ts`                    | ported        | `cf230a5` (daily range); `a3dfe85` (solves) |
| `formatting.py`    | `domain/services/formatting.ts`                 | ported        | pre-tracking |
| `events.py`        | `domain/services/events.ts` + `models/namedEvent.ts` | ported   | `7371c58`    |
| `chart.py`         | `domain/services/chart.ts` (UI renders natively) | partial (timed only; rest parked) | `b0ff8be` (daily range); `8529b4a` |
| `web.py` (routes)  | `app/` routes + `ui/screens/`                   | partial       | pre-tracking |

_Mobile screens so far: PersonSearch and Competitor. The Competitor screen shows
the PR progression for one event at a time via the EventProgression component
(one combined SVG chart overlaying the single + average progressions — single
blue, average green, shared time x-axis, time-labelled y-axis — above the two
tables, then an "All results" scatter below them showing every solve and every
average, points-only via RecordChart's connected={false} mode). Event selection
lives on this screen: an on-page EventPicker dropdown
listing the competitor's competed events, defaulting to 3x3x3 (`defaultEventId`).
It also shows a "View WCA profile" link (the web template's `profile_url` /
`profile-link`), which hands the URL to the OS via `Linking.openURL` to open the
competitor's public WCA profile in the device's default browser._

_**Mobile-specific UX, not a port of `web.py`:** the web app uses a page per
event; mobile collapses that into one screen with an on-page event dropdown and
a 3x3x3 default. There is intentionally no separate per-event route/screen._

_`chart.py` is **partial**: `toRecordSeries` is ported for timed events only.
The Multi-Blind (`333mbf`, plotted by points) and Fewest-Moves (`333fm`, averages
scaled to moves) branches, plus `to_consistency_series`, are not yet ported — they
depend on `format_single`/`format_average`/`decode_multi_blind`, which formatting.ts
also still lacks (only `format_time` is ported, despite the row above). **These are
PARKED — deferred by decision (2026-06-17); see the Backlog note.** For timed events
the chart is feature-complete (single + average overlay, with per-series legend
toggle)._

_The chart **rendering** logic from `static/records-chart.js` (no pytest — the JS
is the spec) is ported: `resultBounds`/`dateBounds`/`formatAxisTick` in chart.ts,
and `RecordChart` (the Chart.js line chart, redrawn as hand-rolled SVG). The
"All results" scatter (`scatter-chart.js`) is also ported for timed events: its
data feeds are `allSolvesOverTime` (every individual solve, needing the new
per-attempt `Result.solves` threaded through the data layer) and
`averageResultsOverTime`, both new in records.ts; the rendering reuses
`RecordChart` in points-only mode. The scatter's **daily-range band**
(`scatter-chart.js` `06b27c4`) is ported for timed events: `dailySolveRangeOverTime`
(records.py `daily_solve_range_over_time`) pools each day's solves into a
fastest/slowest range and `toDailyRangeSeries` (chart.py `to_daily_range_series`)
splits it into lower/upper bounds; `RecordChart` shades the area between them as a
filled SVG `Polygon` in translucent Single-blue, toggled by a "Daily Range" legend
entry (title-cased on mobile vs the web's "Daily range", by request). The web's
fill-between-datasets is redrawn as the one polygon. Not yet ported: the moves/points tick branch
(and `snapAxisBounds` tick-snapping — RecordChart uses evenly-spaced ticks
instead), the consistency chart (`consistency-chart.js`), and the gap chart
(`gap-chart.js`)._

## Backlog (Python features not yet ported)

- **Chart — remaining `chart.py` cases (PARKED — deferred by decision 2026-06-17):**
  `toRecordSeries` for Multi-Blind and Fewest-Moves, and `to_consistency_series`.
  These need `format_single`, `format_average`, `format_consistency`, and
  `decode_multi_blind` ported into formatting.ts first (each test-first), then the
  chart cases, then the native component handles the new event units. **Not being
  ported for now:** the sole user does not compete in these events, so the effort
  isn't worth it. Timed events are fully handled. Revisit only if a real need
  arises (the user starts doing these events, or the app gains other users).
  `RecordChart` already renders timed events.

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
