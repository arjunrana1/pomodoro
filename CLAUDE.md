# CLAUDE.md — Pomodoro Focus

Orientation for Claude. The goal: jump directly to the right file without re-reading the codebase. If a section below covers your task, trust it and edit; only read other files when explicitly told "in doubt, verify."

---

## ⭐ V3 status

**v3 is built** (Work/Break modes, count up/down, FAB nav, Settings with Lofi + Spotify, completed-tasks log, reworked dashboard, expanded footer, mobile-first). v3 was a **fresh start** — v2-shaped localStorage is purged on first load (no migration; see `purgeLegacyDataIfNeeded()` in `src/persistence.ts`).

**Canonical v3 docs:**
1. `CLAUDE.md` (this file) — repo orientation, build/lint/PR conventions.
2. `REQUIREMENTS_V3.md` — product behavior, decisions, data model, **acceptance criteria (§17)**. Source of truth. Supersedes `PRD.md` (v2; keep for unchanged Work-session mechanics).
3. `DESIGN_V3.md` — design tokens + per-screen visual spec. Supersedes `DESIGN.md` / `design_tokens.md` (v2).
4. `reference_designs/v3/*.jpg` — design screenshots (visual confirmation only; docs win on conflict).
5. `TEST_PLAN_V3.md` — **not yet executed**: a separate testing session sets up Vitest + Playwright and covers every AC.

**Spotify:** Authorization Code + PKCE, frontend-only. Client ID lives in `app/.env` as `VITE_SPOTIFY_CLIENT_ID` (public identifier, committed intentionally). Dev OAuth must run on `http://127.0.0.1:5173` (registered redirect URI is `http://127.0.0.1:5173/callback`, **not** localhost). Prod redirect: `https://www.pomodorofocus.net/callback`.

---

## Repo layout

```
/                          ← repo root (docs live here)
  REQUIREMENTS_V3.md       ← canonical v3 product spec (behavior, data model, ACs)
  DESIGN_V3.md             ← v3 design tokens + per-screen visual spec
  TEST_PLAN_V3.md          ← v3 test plan (separate session)
  PRD.md                   ← v2 spec — reference for unchanged Work-session mechanics
  DESIGN.md / design_tokens.md ← v2 design refs (superseded by DESIGN_V3)
  CHANGELOG.md             ← released-version log
  test-report.txt          ← manual QA evidence (v2)
  reference_designs/       ← mockups: v2/ (PNG), v3/ (JPG)
  design_assets/           ← raw design source files
  test-evidence/           ← screenshot outputs from manual QA runs (gitignored beyond reports)
  app/                     ← the actual Vite + React app
```

All code lives under `app/`. Outside of `app/`, files are docs/assets only.

```
app/
  package.json             ← npm scripts (dev / build / lint / preview)
  vite.config.ts           ← Vite + Tailwind v4 plugin config
  index.html               ← SPA entry; fonts (Sora/Inter/JetBrains Mono + Material Symbols), SEO meta
  .env                     ← VITE_SPOTIFY_CLIENT_ID (public, committed)
  public/music/            ← 8 CC0 lofi MP3s + manifest.json + CREDITS.md
  src/
    main.tsx               ← React root, mounts <App />
    App.tsx                ← Router: screen (home/settings), /callback handling, status routing
    index.css              ← Tailwind + v3 tokens (@theme), glass utilities, gradients, sliders
    store.ts               ← THE single source of truth for app state (useAppState hook)
    types.ts               ← All TypeScript types (AppState, TaskItem, CompletedTask, NoteItem, SettingsState, …)
    utils.ts               ← Pure helpers (formatTime, formatDuration, date keys, recordFocusedSeconds)
    persistence.ts         ← All localStorage I/O: keys, purge, settings read/write, export JSON
    audio.ts               ← WebAudio sound effects incl. break start/end; master volume via setSoundVolume()
    music.ts               ← Lofi player singleton (module-scope <audio>, useMusic() hook) — playback survives navigation
    spotify.ts             ← PKCE auth, token refresh, Web API helpers (now playing, play/pause/skip)
    assets/                ← Static image assets
    components/            ← All UI components (see map below)
```

---

## Component map — UI editing index

Each row tells you exactly which file owns what visual surface. **Edit only the file listed.**

| Surface / Feature | File | Notes |
|---|---|---|
| Header: brand, Focus/Break segmented toggle (+ session lock), speaker + gear icons, mobile full-width pill | `components/Header.tsx` | Labels are "Focus"/"Break" (mode is still `work`/`break` internally). Toggle disabled with lock glyph while running/paused (AC-3). Mobile pill is `absolute` so it scrolls away with the fold. |
| Home screen (Work **and** Break idle): orb, preset pills, custom pill, Start CTA, daily stats, decorative orbs | `components/HomeScreen.tsx` | Mode-aware: Break swaps teal accent, 5/10/15 presets, `TAKE A BREATHER`, hides stats/FABs. Renders dashboard + footer below the fold. |
| Active session (Work **and** Break): orb, timer, Pause/Resume + Stop / End Break, task checklist + `+N more` expander, Spotify mini-player | `components/ActiveSession.tsx` | Count direction is display-only: `countUp ? initial - remaining : remaining`. Shimmer pauses via `animationPlayState`. |
| Flow Complete modal (Work completion) | `components/FlowComplete.tsx` | Elapsed (stopped) vs initial (natural); `Xh Ym` format; no FABs. |
| Break Done card | `components/BreakDone.tsx` | "You took Nm to recharge." CTA `newSession('work')` → Work Home; gear stays. |
| Notes + Tasks FABs (plain round CTAs, no badges) | `components/Fabs.tsx` | Hidden in Break + on completion screens (callers decide). |
| Session Plan drawer (right, same side as its FAB): add/validate task, drag-reorder, CURRENT BREAKDOWN, COMPLETED TASKS log + Clear-all, Start Focused Session CTA | `components/TasksDrawer.tsx` | Checking a task moves it to the completed log instantly; unchecking pulls it back. CTA only rendered while idle (hidden during running/paused). |
| Notes drawer (left, same side as its FAB): textarea, timestamped note cards, edit/delete | `components/NotesDrawer.tsx` | Click-outside closes; Escape doesn't (AC-19). |
| Settings screen: Timer (direction only — no mode mirror), Sound (toggle + volume), Music (lofi list + transport + volume, Spotify panel), Data & Privacy ("Manage your data") | `components/SettingsScreen.tsx` | Full screen via gear, not a modal. Local sub-components: Segmented, Toggle, VolumeSlider, DangerButton. |
| Spotify panel (Settings): connected/disconnected states, now playing, transport, Disconnect, Premium note | `components/SpotifyPanel.tsx` | Polls now-playing every 5 s while connected. |
| Spotify mini-player (active session) | `components/SpotifyMiniPlayer.tsx` | Renders nothing if no playback. |
| Focus History dashboard: 7-day bars, 2×2 stats (incl. Tasks Completed), hourly heatmap (8 AM–11 PM window, all 16 hour labels written out, "Work life friendly heat map" note), legend, empty state | `components/FocusHistoryDashboard.tsx` | `HOUR_ORDER = 8..23`; hours outside the window are stored but not displayed. Tasks Completed = completed-log entries in the 7-day window. All durations via `formatDuration`. |
| Expanded SEO marketing footer (7 sections) | `components/MarketingFooter.tsx` | Canonical section list in `REQUIREMENTS_V3.md §12`. |
| App brand mark (logo SVG) | `components/BrandMark.tsx` | 35×35 SVG; `accent` prop switches purple/teal. |

That list is complete — there is nothing else under `components/`.

---

## State, persistence, audio, music, Spotify

| What | File | Key exports / shapes |
|---|---|---|
| App state hook + all mutations | `store.ts` | `useAppState()` returns `{ state, settings, setMode, startSession, pauseResumeSession, stopSession, endBreak, newSession, toggleTaskChecked, addNote, … }`. Timer is wall-clock-driven (`computeRemainingFromWallClock`). Boot state is memoized (`loadPersistedStateOnce`) — the loader has side effects and StrictMode double-invokes initializers. |
| All TypeScript types | `types.ts` | `AppState`, `TaskItem`, `CompletedTask`, `NoteItem`, `DayRecord` (24 hourly `segmentSeconds`), `FocusHistory`, `SettingsState`, `SessionMode`, `AppStatus`. Add fields here first. |
| Pure helpers | `utils.ts` | `formatTime` (MM:SS), `formatDuration` (`Xh Ym`, seconds round **up**, `'tile'` zero-style → `0h 0m`), `getTodayKey`, `lastNDates`, `dayInitial`, `recordFocusedSeconds`, timestamp formatters. |
| localStorage I/O | `persistence.ts` | Key constants, `purgeLegacyDataIfNeeded`, `readSettings`/`writeSettings` (read-modify-write merge — store, music.ts and spotify.ts all write), `exportAllData`. |
| Sound effects | `audio.ts` | v2 sounds + `playBreakStartSound`, `playBreakEndSound`. `setSoundVolume(0–100)` scales everything; store sets it from settings (0 when muted). |
| Lofi player | `music.ts` | Module singleton (`<audio>` outside React). `useMusic()`, `initMusic`, `togglePlay`, `nextTrack`, `prevTrack`, `toggleLoop`, `setMusicVolume`, `selectTrack`. Loads `/music/manifest.json`. |
| Spotify | `spotify.ts` | `connectSpotify` (PKCE redirect), `handleSpotifyCallback`, `getAccessToken` (silent refresh), `getNowPlaying`, `spotifyPlay/Pause/Next/Previous`, `isPremiumAccount`, `disconnectSpotify`. |

### localStorage keys (v3)

- `pomodoro-focus-state` — runtime state (`version: 3` marker, mode, presets, tasks, notes, active-session timestamps, dailyStats)
- `pomodoro-focus-history` — `FocusHistory.days` keyed `YYYY-MM-DD`, 24 hourly buckets, pruned to 14 days
- `pomodoro-focus-completed-tasks` — `CompletedTask[]`, newest-first, never auto-cleared
- `pomodoro-focus-settings` — sound/music/countUp/Spotify tokens

Any v2-shaped key (`pomodoro-focus-stats`, `deep-focus-*`, or a state blob without `version: 3`) triggers a full purge at boot. Don't reintroduce old keys.

---

## Common UI change recipes

### "Change a label / piece of copy"
1. Find the surface in the component map above; edit the JSX text directly.
2. If the copy is product-spec'd (footer sections, brand name, "Flow Complete", "Break Done", `TAKE A BREATHER`), also update `REQUIREMENTS_V3.md` so spec ↔ implementation stay aligned.

### "Change how a duration is displayed"
- `utils.ts` owns all `format*` helpers — `formatDuration` is the global `Xh Ym` rule (REQUIREMENTS_V3 §11; no decimals, seconds round up). Change it there, not in components.

### "Change the dashboard look (bar chart / stats grid / heatmap)"
- Single file: `components/FocusHistoryDashboard.tsx`. Heatmap column order is `HOUR_ORDER`; intensity tiers in `intensityClass()`.

### "Add a new global state field"
1. Add the field to `AppState` (or `SettingsState`) in `types.ts`.
2. Default in `getDefaultState()` in `store.ts` (or `defaultSettings()` in `persistence.ts`).
3. Persist: add to `persistRuntimeState()` in `persistence.ts` (settings persist automatically via `writeSettings`).
4. Add a mutator in `useAppState`, return it from the hook. Components receive the whole `store` object — no prop threading.

### "Add a new sound"
1. Add a `play*Sound` export in `audio.ts` (use `playTone`; it already scales by master volume).
2. Gate the call on `settingsRef.current.soundEnabled` in `store.ts` (search `playBreakStartSound` for the pattern).

### "Change the timer logic"
- `store.ts` — sole owner: `computeRemainingFromWallClock`, the 250 ms tick `useEffect`, and `completeWorkSession`. Don't add a setInterval in a component. Count direction is display-only — never touch stored seconds for it.

### "Change a color / glass effect / animation"
- `src/index.css`: `@theme` tokens (`--color-primary #6A5AE7`, `--color-break #14B8A6`), glass utilities, gradients (`.ethereal-bg`, `.break-bg`, `.session-bg`), orb shimmer, `.pf-slider`.
- Token reference: `DESIGN_V3.md §1`.

### "Touch music or Spotify behavior"
- Playback mechanics → `music.ts` / `spotify.ts`. UI → `SettingsScreen.tsx` / `SpotifyPanel.tsx` / `SpotifyMiniPlayer.tsx`. Never mount an `<audio>` element in a component — playback must survive unmounts.

---

## Build / dev / lint commands

Run from the repo root or `app/` — both work because npm scripts are defined in `app/package.json`.

```
cd app
npm run dev      # local dev server (Vite, port 5173)
npm run build    # production build (tsc -b && vite build)
npm run lint     # eslint
npm run preview  # serve the production build locally
```

A successful production build produces `app/dist/`. Vercel deploys from this — Vercel project root must be set to `app/`. The `/callback` route needs an SPA rewrite in production (Vercel serves index.html for unknown paths by default with the SPA preset).

---

## Workflow conventions

- **Branch off `main`** for every change: `git checkout -b feature/<thing>` or `chore/<thing>` or `fix/<thing>`.
- **Open a PR via `gh pr create`** — full path is `~/.local/bin/gh` unless PATH is updated. The `gh` token in macOS Keychain is already auth'd as `arjunrana1`.
- **GitHub auto-deletes merged head branches** (verify the setting is on, otherwise: `git push origin --delete <branch>` after merge).
- **Don't commit `.DS_Store`** — `.gitignore` handles macOS noise. If a stray one is staged, unstage it.
- **REQUIREMENTS_V3.md is the spec** — when behavior or copy changes, update it in the same PR. Reviewers (including future Claude) read it first.
- **Don't add documentation files** (`*.md`, READMEs) unless explicitly asked. CLAUDE.md, CHANGELOG.md, PRD.md, DESIGN*.md, REQUIREMENTS_V3.md, TEST_PLAN_V3.md and `app/README.md` are the only sanctioned ones.

---

## What NOT to read by default

To stay token-efficient, skip these unless your task explicitly requires them:

- `test-report.txt` (long, historical QA log — only read if debugging a regression)
- `test-evidence/` (binary PNGs, useless to LLMs)
- `reference_designs/`, `design_assets/` (binary)
- `node_modules/`, `dist/` (always skip)
- `package-lock.json` (only if dependency conflict)
- Old PR/branch state — git history rarely needs reading for UI changes

If a single component file plus its imports gives you the answer, stop there.

---

## When in doubt

1. **Behavior question?** → `REQUIREMENTS_V3.md` (v3) is the source of truth; `PRD.md` only for unchanged v2 Work mechanics.
2. **Visual / color / spacing question?** → `DESIGN_V3.md`.
3. **"Where is X rendered?"** → component map above; only grep if it's truly missing.
4. **"Why does the timer do Y?"** → `store.ts` is the only place with timer logic.
5. **Type / shape question?** → `types.ts`. **Storage question?** → `persistence.ts`.

If two files seem to compete for ownership of a feature, the component map wins — that's the canonical assignment. Flag any drift back to me in the PR description.
