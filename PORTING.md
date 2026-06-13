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
| `events.py`        | `domain/` (event id → name table)               | not started   | —            |
| `chart.py`         | `domain/services/` (UI renders natively)        | not started   | —            |
| `web.py` (routes)  | `app/` routes + `ui/screens/`                   | partial       | pre-tracking |

_Mobile screens so far: PersonSearch, Competitor, EventProgression._

## Backlog (Python features not yet ported)

- **Scatterplot** — lives in `chart.py` (data shaping) + `web.py` (rendering).
  Port the point-shaping logic into `domain/services/` **test-first** (port its
  pytest → red → implement → green); re-implement the chart itself as a native RN
  component (manual look/feel check, not a unit test).
- Port the `events.py` id → name table when a screen needs event names.

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
