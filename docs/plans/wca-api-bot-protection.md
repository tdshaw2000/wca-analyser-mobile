# Plan: work around WCA bot protection on per-person API routes

Status: **not started** — parked 2026-09-23.

## Problem

Opening a competitor fails with `WCA API request failed (HTTP 403).` Search still works.

Diagnosed 2026-09-23:

- `GET /api/v0/persons/{wcaId}`, `/persons/{wcaId}/results` and `/persons/{wcaId}/competitions`
  all return **403** — regardless of `User-Agent`, from home broadband (Sky UK) and from the
  phone on mobile data.
- The 403 comes from the AWS load balancer (`server: awselb/2.0`, bare HTML body), not the
  WCA Rails app. `/results/rankings/...` is blocked the same way.
- Still **200**: `/api/v0/persons?q=...`, `/api/v0/competitions`, `/api/v0/competitions/{id}`,
  `/api/v0/records`, the home page.
- The person page (`/persons/2009ZEMD01`) loads in a real phone browser → this is a browser
  challenge that a native app cannot pass, not an IP ban.
- WCA confirmed AWS Bot Protection is deliberate on these routes:
  [thewca/worldcubeassociation.org#11722](https://github.com/thewca/worldcubeassociation.org/issues/11722)
  (“This is intended. We have AWS Bot Protection enabled for those routes…”). No announcement
  found for it covering the API.
- The sibling Python project `wca-records-analyser` uses the same endpoints and is affected too.

Before starting, re-run the probe to see whether anything has changed:

```
for p in "/persons/2009ZEMD01" "/persons/2009ZEMD01/results" "/persons/2009ZEMD01/competitions" "/persons?q=2009ZEMD01"; do
  printf '%-40s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://www.worldcubeassociation.org/api/v0$p"
done
```

## Replacement data source

The **unofficial WCA REST API** ([robiningelbrecht/wca-rest-api](https://github.com/robiningelbrecht/wca-rest-api),
MIT) — static JSON built daily from the official WCA results export, served from GitHub:

- Base URL: `https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/v1`
  (the jsDelivr mirror 404s; don't use it).
- `persons/{wcaId}.json` — `id`, `name`, `competitionIds[]`, `rank.singles[].eventId`,
  `results[competitionId][eventId][] = { round, position, best, average, format, solves[] }`.
  Competitions appear newest-first, but don't rely on that ordering.
- `competitions/{id}.json` — `date: { from, till, numberOfDays }`.
- `version.json` — `export_date` of the underlying WCA export.
- Bulk `competitions.json` is only page 1 of ~19 (~2 MB each) — not usable for date lookup.

## Mapping

| App needs | Was (now 403) | New source |
|---|---|---|
| Name, avatar, profile URL | `/api/v0/persons/{id}` | **WCA** `/api/v0/persons?q={wcaId}` — same `person` DTO incl. `avatar.thumb_url`; keep the exact `wca_id` match only |
| Events competed in | `personal_records` keys | Unofficial person → `rank.singles[].eventId` (same semantics: events with a ranked single) |
| Results for an event | `/persons/{id}/results?event_id=` | Unofficial person → flatten `results[*][eventId]` into `Result { single: best, average, solves, competitionId }` |
| Competition start dates | `/persons/{id}/competitions` | Unofficial `competitions/{id}.json` → `date.from`, fetched per competition with bounded concurrency |

The chart x-axis uses real dates (`RecordPoint.date`, `ChartPoint.date`, `DailySolveRange.date`),
so ordering alone is not enough — actual start dates are required.

## Design

All changes are confined to `src/data/`. `domain/`, `hooks/`, `ui/` and `app/` stay untouched —
that's what the repository layer exists for.

- `api/wcaClient.ts` — add a constant for the unofficial base URL; let `wcaGet` take which base
  to use. Keep `WcaApiError` semantics (429 / offline / non-OK) identical for both.
- `api/types.ts` — add minimal DTOs for the unofficial person and competition files.
- `repositories/resultsRepository.getResults` — read the unofficial person file, flatten one event.
- `repositories/competitionsRepository.getCompetitionDates` — IDs from the person file, dates from
  per-competition files, a few requests in flight at a time.
- `repositories/personsRepository.getProfile` — identity via WCA search-by-id, event ids from the
  unofficial person file.
- In-memory cache for the session: person files per `wcaId` (three repositories need the same
  ~300 KB file) and competition dates (immutable, cache forever).

## Costs and risks

1. **First load of a prolific competitor is slow**: Feliks Zemdegs = 177 competition files.
   Hits GitHub, not WCA. A persistent `expo-sqlite` date cache (already listed as optional in
   CLAUDE.md) is the follow-up fix — separate piece of work.
2. **Up to a day stale** — the unofficial API rebuilds daily.
3. **Third-party volunteer dependency** — actively maintained (daily commits), and the
   repository layer keeps the source swappable.
4. **Attribution required** by the WCA export licence: show “This information is based on
   competition results owned and maintained by the World Cube Association, published at
   https://worldcubeassociation.org/results as of {date}”, with the date from `version.json`.

## Test handling — needs a decision before starting

The three existing repository test files assert the old endpoints and DTO shapes. Under this
design they describe a contract that no longer exists. Per the no-modifying-tests rule, **get
explicit agreement** before retiring them. Proposed:

- Write new failing tests for the new sources first (show the red run), then implement.
- Retire the obsolete endpoint tests in their own test-only commit.
- Hook and screen tests mock the repositories and should stay green unchanged.

## Commit sequence

Each step is test commit → production commit, small diffs:

1. Client can target the unofficial base URL.
2. Results from the unofficial person file.
3. Competition dates from unofficial competition files, with the in-memory cache.
4. Profile from WCA search-by-id plus unofficial event ids.
5. Retire obsolete endpoint tests (test-only, after agreement).
6. Attribution footer.
7. Eyes-on check in Expo Go before calling it done.

## Reversibility

Everything is inside `src/data/`. If WCA lifts the block or offers a supported route, revert the
three repositories to the `/api/v0/persons/{id}...` endpoints.

## Related, separate actions

- Open an issue on `thewca/worldcubeassociation.org` asking whether the per-person **API** routes
  are meant to be behind bot protection (#11722 was about the website, behind a VPN).
- `wca-records-analyser` (Python) needs the same treatment.
