# WCA Analyser (Mobile)

An Android-only React Native / Expo app that browses public [World Cube
Association](https://www.worldcubeassociation.org/) competition data and computes
Personal Records (PRs) for a competitor across events — a TypeScript port of the
sibling Python project [`wca-records-analyser`](https://github.com/tdshaw2000/wca-records-analyser).

It's a read-only client: no backend of its own, no auth, no API keys. It calls the
public WCA API directly over HTTPS and requires network connectivity.

## Tech stack

- **Expo SDK 56** (managed React Native) + **TypeScript strict**
- **expo-router** (file-based navigation)
- **Jest** (`jest-expo` preset) + **@testing-library/react-native** for testing
- **EAS Build** for standalone APKs (no local Android Studio/SDK required)

See `CLAUDE.md` for the full architecture (`src/domain` → `src/data` → `src/hooks` →
`src/ui`), coding standards, and TDD workflow. See `PORTING.md` for what's been ported
from the Python source and what's intentionally out of scope.

## Prerequisites

- **Node.js** (verified working: v24.21.0) and **npm** (verified working: v11.19.0) —
  any reasonably current LTS Node should work.
- **A physical Android device** with the **[Expo Go](https://expo.dev/go)** app
  installed — get the build that matches this project's SDK (**SDK 56**) from
  **expo.dev/go**, not the Play Store version, which is frozen on an older SDK and
  will reject this project ("incompatible", with no bundling logs, if you use the
  wrong one).
- **[EAS CLI](https://docs.expo.dev/eas/)**, only if you want to produce a standalone
  installable APK (not required for day-to-day development in Expo Go):
  ```
  npm install --global eas-cli
  eas login
  ```

### If you're on WSL2 (Windows)

- Make sure `node`/`npm`/`npx` resolve to the **Linux** binaries, not
  `/mnt/c/.../nodejs`. Check with `which node` — it should point somewhere under
  `/usr` or `/snap`, never `/mnt/c`.
- Never `mv` `node_modules` between directories (breaks bin symlinks) — always
  reinstall in place with `npm install`.
- LAN/QR connection from Expo Go usually doesn't work over WSL2's virtualised
  networking — use the `--tunnel` flag (see below).

## Getting the code

```
git clone git@github.com:tdshaw2000/wca-analyser-mobile.git
cd wca-analyser-mobile
```

## Install dependencies

```
npm install
```

Going forward, when *adding* a new native/Expo dependency, use `npx expo install
<package>` instead of `npm install <package>` — it picks the version compatible with
SDK 56 rather than defaulting to the package's latest.

## Running in Expo Go (day-to-day development)

```
npx expo start --tunnel
```

- `--tunnel` is the reliable option on WSL2 and most restricted networks; drop it for
  a plain LAN QR code if you're on a simple home network and it works for you.
- Scan the QR code from the terminal with the **Expo Go** app (SDK 56 build — see
  Prerequisites).
- Expo Go caches the downloaded JS bundle per project. If you don't see your latest
  changes after editing files, restarting Metro isn't enough — use the in-app dev
  menu → **Reload** on the phone itself. Restart Metro with `npx expo start -c` if
  you need to clear its cache too.

## Tests and typechecking

```
npm test            # Jest — must be green before committing
npm run typecheck   # tsc --noEmit — must be clean before committing
npm run test:watch  # Jest in watch mode
```

This project follows strict TDD (see `CLAUDE.md`) — tests are written before the
implementation they cover, and unit tests are the primary source of confidence for
everything in `src/domain`, `src/data`, and `src/hooks`. UI *behaviour* is covered
with `@testing-library/react-native`; only real on-device look/feel is a manual
check in Expo Go rather than a unit test.

## Building a standalone APK (EAS Build)

No local Android SDK/Studio setup is needed — EAS builds in the cloud.

```
eas build -p android --profile preview --non-interactive
```

- Uses the `preview` profile in `eas.json` (internal distribution, produces a
  sideloadable `.apk` — the `production` profile produces a Play Store `.aab`
  instead, which you can't sideload).
- The keystore is auto-generated and stored server-side by EAS; nothing secret ever
  lives in this repo.
- `eas build` prints a QR code (and the build page shows one too) — scan it on your
  Android device to download and sideload the APK (you'll need to approve
  "install from unknown sources").
- There's no live reload in a standalone APK — use Expo Go (above) for fast
  iteration, and only build a fresh APK when you want to ship/test a real install.
- `eas build:list` re-shows links to recent builds; `eas whoami` confirms which EAS
  account you're logged into.

## Project structure

```
app/                    expo-router routes (thin — set nav options, render a screen)
src/
  domain/               pure TypeScript — the Python port target, no RN/network imports
    models/             entities (Person, Result, ...)
    services/           business rules over already-fetched, typed data (PRs, formatting, chart data)
  data/                 everything that talks to the outside world
    api/                typed fetch wrapper + raw WCA API DTOs
    repositories/       fetch + map DTO -> domain (the anti-corruption boundary)
  hooks/                bridges UI <-> data/domain, exposes { data, loading, error, reload }
  ui/
    screens/            "dumb" screens
    components/
    theme/
```

Data flow: **WCA API → `data/api` → repositories → `domain/services` → `hooks` → screens.**

See `CLAUDE.md` for the full set of working standards (TDD discipline, commit
conventions, code style) that apply to this project.

## Terminology

- **PR** = **Personal Record** (the speedcubing term — never "pull request"). A
  result is a PR when it beats all of that competitor's prior results for the same
  event.
- The WCA API doesn't flag PRs — they're computed here as the running minimum of
  results ordered by competition date. `regional_single_record` /
  `regional_average_record` are *regional* records (NR/CR/WR), not PRs.
- Singles are in **centiseconds**; non-positive values are DNF/DNS and are skipped.
