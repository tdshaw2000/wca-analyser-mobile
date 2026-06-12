# CLAUDE.md — WCA Analyser (Mobile)

> Working standards for this project. Follow all rules below at all times, without exception.

---

## test-driven development (most important — read first)

- **Tests first.** Write a failing test before writing any production code. No exceptions.
- The **red → green → refactor** cycle is mandatory.
- **Never mix test changes and business-logic changes in the same commit.** Edit the
  test, watch it fail (red), then write the code that makes it pass (green). A commit
  touches *either* tests *or* production code, never both.
- **Never modify an existing test to make failing code pass.** If a test looks wrong,
  stop and raise it explicitly — fix the implementation, not the contract.

**TDD on mobile — what's actually testable (and what isn't):**
- `domain/` (pure TS, the port target), `data/` (client + repositories with `fetch`
  mocked), and `hooks/` are fast unit-testable with **Jest** — no device or emulator.
  This is the bulk of the work, and TDD applies fully.
- UI component *behaviour* is testable with **@testing-library/react-native** (no device).
- The only thing that is **not** unit-testable is real on-device look/feel — that stays a
  **manual check in Expo Go**, never a blocker dressed up as a unit test.

**Porting workflow:** the Python source is already TDD'd. Port its test first → watch it
fail → port the implementation → green. The pytest cases are the behavioural spec.

---

## working style (the user is a relative beginner to mobile)

- **Explain new tools/commands/concepts briefly as you go** — *what it is and why*, not
  just what to type. Walk through everything.
- Explain your reasoning before changing things when multiple approaches exist.
- If a requirement is ambiguous, ask before proceeding.
- After each commit-worthy change, pause and confirm before the next step.
- Do not refactor and add functionality in the same step.

---

## what we're porting

- **Source project:** `/home/tim/apps/wca-records-analyser` (sibling dir; Python +
  FastAPI, already TDD'd with pytest). **Read it directly when porting** — it is the
  source of truth for behaviour.
- **This app:** an Android-only TypeScript/React Native port — a read-only browser of
  public WCA data. Logic is rewritten in TS (not Python on device), ported one vertical
  slice at a time: core logic → data fetching → UI.

**Python module → mobile layer mapping:**

| Python (`wca_records_analyser/`) | Mobile (`src/`) |
| --- | --- |
| `wca_client.py` (HTTP, `Person`/`Result` dataclasses) | `data/api/wcaClient.ts` + `data/api/types.ts` + `data/repositories/` |
| `records.py` (PR analysis, no HTTP) | `domain/services/` (+ `domain/models/`) |
| `events.py` (event id → name table) | `domain/` (models/services) |
| `formatting.py` (centiseconds → time string) | `domain/services/` |
| `chart.py` (shape progressions for charting) | `domain/services/` (UI does the rendering) |
| `web.py` (FastAPI routes + templates) | `app/` routes + `ui/screens` + `hooks/` |

---

## terminology

- **PR** = **Personal Record** (the speedcubing term), **never** "pull request". A result
  is a PR when it beats all of that competitor's prior results for the same event.
- The WCA API does **not** flag PRs; we compute them ourselves as the running minimum of
  results ordered by competition date. (`regional_single_record` / `regional_average_record`
  are regional records — NR/CR/WR — not PRs.)
- Singles are **centiseconds**; non-positive values are DNF/DNS and are skipped.

---

## tech stack

- **Expo SDK 56** (managed React Native) + **TypeScript strict**, **expo-router** (file-based nav).
- **Networking:** `fetch` directly against the public WCA API
  (`https://www.worldcubeassociation.org/api/v0`). RN is not a browser → no CORS, no proxy.
- **Tests:** Jest (`jest-expo` preset) + `@testing-library/react-native`.
- Prefer **expo-maintained (`expo-*`) packages**; keep dependencies minimal.
- `expo-sqlite` is **optional**, a cache only — never the source of truth. Not added unless
  a feature needs offline/speed.

**Hard constraints (non-negotiable):**
- **No backend we own.** The app talks directly to the public WCA API over HTTPS;
  it requires network connectivity.
- **Read-only, no auth, no API keys, no secrets — ever.** Anything in an APK is extractable.
- **Be a good API citizen:** respect rate limits and handle errors (incl. HTTP 429) gracefully.
- **Android only.** No iOS-specific effort.

---

## project structure & data flow

Data flow: **WCA API → `data/api` → repositories (+ optional cache) → `domain/services` → `hooks` → screens.**

- `src/domain/` — **pure TS, the Python port lands here. No react/RN/network/SQLite imports.**
  `models/` = entities; `services/` = business rules on already-fetched, typed data.
- `src/data/` — everything that talks to the outside world. `api/wcaClient.ts` (typed fetch
  wrapper; single `WcaApiError` for 429/offline), `api/types.ts` (raw wire DTOs),
  `repositories/` (fetch + map DTO→domain; the anti-corruption boundary; cache slots in here).
- `src/hooks/` — bridge UI ↔ data/domain; expose `{ data, loading, error, reload }`.
- `src/ui/` — `screens/` (dumb), `components/`, `theme/`.
- `app/` — expo-router routes kept thin (set nav options, render a screen from `ui/screens`).
- `@/*` path alias → `src/*`.
- **Every WCA-backed screen must handle loading / error / empty / offline states.**

---

## running and testing

- **Tests:** `npm test` (Jest).
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`). Must be clean before declaring done.
- **Dev loop:** `npx expo start --tunnel`, open in **Expo Go** on the phone. Expo Go must be
  the build matching the project SDK (currently 56) from **expo.dev/go** — the Play Store
  one is frozen older and will reject the project.
- **Install native deps with `npx expo install`** (SDK-compatible versions), not `npm install`.
- WSL2: `node`/`npm`/`npx` must resolve to `/snap/bin` (Linux), never `/mnt/c/...`.
  Never `mv` `node_modules` between dirs — always `npm install` in place.

---

## commit discipline

- **No commit bigger than ~100 lines.** Commit frequently; do not accumulate large diffs.
- Each commit = exactly one logical change. If the message needs "and", split it.
- Test commits and production-code commits are **separate** (see TDD rules).
- **Conventional Commits** format (`feat`/`fix`/`chore`/`test`/`refactor`).
- Branch off `main`; commit or push only when the user asks.

---

## code style

- **Constants over literals.** Extract magic numbers/strings into named constants in
  business logic (`domain/`, `data/`). Inline literals other than `0`, `1`, `""`,
  `true`/`false` are not permitted there. **Exception:** where it clashes with an RN
  paradigm — e.g. `StyleSheet` values, JSX layout props — local literals are fine.
- **Meaningful, unabbreviated names.** Identifiers must be self-documenting.
- **Single responsibility.** One thing per function, one concept per module.
- **No dead code.** Delete unused code; don't comment it out. Git is the history.

---

@AGENTS.md
