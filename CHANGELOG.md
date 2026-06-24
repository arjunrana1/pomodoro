# Changelog

All notable changes to Pomodoro Focus will be documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [3.0.0] — 2026-06-19

A fresh rebuild on top of v2. v3 is a clean start: any v2-shaped
localStorage is purged on first load (no migration). Live at
https://www.pomodorofocus.net.

### Added
- **Focus / Break modes** — a persistent header toggle (labeled "Focus",
  internally `work`). Break is a teal, non-recorded timer with 5/10/15
  presets (default 5m), a `TAKE A BREATHER` subtitle, its own start/end
  chimes, and a **Break Done** card. Break never writes to stats, focus
  history, or the dashboard. The toggle is disabled with a lock glyph
  during any running/paused session.
- **Count Up / Count Down** — a display-only timer-direction setting
  (Settings → Timer) applied to both modes' orb and the browser tab
  title; the session still starts and ends at the same target.
- **FAB navigation** — Notes (bottom-left, glass) and Session Plan
  (bottom-right, primary) floating buttons replace the v2 side rails.
  The Tasks FAB is idle-only (hidden during a live session); the Notes
  FAB stays available mid-session. Both hidden in Break and on
  completion screens.
- **Completed Tasks log** — checking a plan task moves it into a
  timestamped, newest-first log (its own localStorage key, never
  auto-cleared); unchecking pulls it back. Clear-all (with confirm) is
  available from both the Session Plan drawer and Settings.
- **Standalone Notes** — notes are now an independent entity available on
  idle Home and during active Focus sessions, with per-note timestamps
  and edit/delete. They persist across sessions and mode switches.
- **Settings screen** (full screen via the header gear) — Timer
  direction, Sound (master toggle + volume slider, reflected by the
  header speaker), Music, and Data & Privacy (clear focus history,
  clear completed tasks, export all data as JSON).
- **Built-in Lofi player** — 8 CC0 tracks loaded from
  `public/music/manifest.json`, with play/pause, prev/next, loop, and an
  independent volume slider. Playback runs from a module-scope `<audio>`
  singleton so it survives every navigation and state change.
- **Spotify Connect** — Authorization Code with PKCE (frontend-only, no
  secret). A `/callback` route completes the token exchange; tokens
  persist and silently refresh. Connected state shows now-playing +
  transport + Disconnect in Settings and a mini-player on the active
  session; a Premium note is shown since playback control requires it.
- **Break start/end sounds** — a warm descending chime on break start and
  a gentle ascending chime on break end, distinct from the Focus sounds.
- **Expanded SEO marketing footer** — seven keyword-aware sections
  (What is Pomodoro Focus, the Pomodoro Technique, How to Use, Focus &
  Break Sessions, Tasks & Session Planning, Focus Music, Features).
- **Vitest test suite** — 130 unit + integration tests covering all 34
  acceptance criteria; Playwright E2E journeys scaffolded.

### Changed
- **Reworked Focus History dashboard** — the heatmap is now a
  work-life-friendly **8 AM–11 PM** hourly window (16 columns, every
  hour labeled in full) instead of a full 24-hour strip; out-of-window
  hours are still recorded but not displayed. The 2×2 stats grid keeps
  Daily Total, Daily Avg, Weekly Total, and Tasks Completed.
- **Orb "Focus Time Today"** now reads the history-backed today total
  (max with daily stats), so it matches the dashboard's Daily Total tile
  and reflects stopped sessions too.
- **One global duration format** — `Xh Ym` / `Xh` / `Ym` everywhere
  (dashboard, tiles, completed tasks, Flow Complete, Break Done);
  seconds round up, no decimals.
- **Focus/Break mode pill** nudged ~20px down toward the orb on both
  desktop and mobile.
- **Persistence split** into four namespaced keys —
  `pomodoro-focus-state`, `pomodoro-focus-history`,
  `pomodoro-focus-completed-tasks`, and `pomodoro-focus-settings` — each
  with a `version: 3` marker.

### Removed
- **v2 side rails** in favor of FAB navigation.
- **Session Mode mirror** from the Settings Timer card — mode lives only
  in the header toggle.
- **All v2 localStorage** (`pomodoro-focus-stats`, `deep-focus-*`, or any
  state blob without a `version: 3` marker) is purged on first load.
  There is no v2 → v3 migration.

### Migration notes (read these before you upgrade)
- **No migration from v2.** The first v3 load detects v2-shaped keys and
  clears all app data, then initializes fresh defaults (Focus mode, 25m).
  Existing focus history, stats, notes, and tasks from v2 are **not**
  carried over. Export from v2 first if you need that data.
- The purge is **one-way and per-browser** (localStorage is per-origin).

## [2.0.0] — TBD

This release rebrands the app from "Deep Focus" to **Pomodoro Focus** and
delivers the v2 spec: a wall-clock-correct timer, a Focus History
dashboard, and a redesigned active-session UI.

### Added
- **Focus History dashboard** below the timer on Home: a 7-day bar chart
  with hours labels above each bar, a 2×2 stats grid (Daily Total,
  Daily Avg, Weekly Total, Tasks Completed in last 7 days), and a 7×24
  hourly heatmap with discrete shade tiers.
- **Tasks Completed (7d) tile** — counts plan items toggled to completed
  across the visible 7-day window. Increments at session end, attributed
  to the day the session started.
- **Hourly heatmap** — 24 wall-clock-hour columns instead of 12 × 2-hour
  blocks, with thinner row strips and 5 brand-purple shade tiers for
  more legible patterns at a glance.
- **Larger, more visible task circles** in the active-session orb (20 px
  with a 2.5 px primary-purple border) and an estimated-time pill on
  the right of each task title.
- **Session-end resume sound** so resume is auditorily distinct from
  pause.
- **`migrateDayRecord`** helper that upgrades legacy 12-bucket records
  to the new 24-hour shape on load (splits each 2-hour value evenly
  across its 2 hours).

### Changed
- **Wall-clock timer.** The countdown is now driven by `Date.now()`
  against `startedAt + totalPausedSeconds`, not by per-tick decrements.
  Closing the tab and reopening reflects real elapsed time. Sessions
  that would have completed during the closure jump straight to Flow
  Complete and update stats + history.
- **Custom-duration validation.** Invalid input ("0", "-5", decimals)
  now surfaces an inline red error and disables Start Session until
  resolved, instead of silently no-op'ing.
- **Stop flow.** A stopped 20-min session that ran 4 minutes correctly
  shows `04:00` on Flow Complete (not `20:00`) and updates Focus
  History with the elapsed seconds — but does NOT increment
  `dailyStats.sessionsCount`.
- **New Session rules** after Flow Complete:
  - Natural completion → notes cleared, checked tasks removed,
    unchecked preserved.
  - Stop → notes preserved, checked tasks removed, unchecked preserved.
- **Locked left rail** during active sessions keeps the "Session Plan"
  label and a lock icon (was incorrectly showing "Locked" before).
- **localStorage keys** renamed `deep-focus-state` → `pomodoro-focus-state`
  and `deep-focus-stats` → `pomodoro-focus-stats`. Existing data is
  migrated on first load via `migrateLegacyKeys()`.
- **Marketing footer** copy updated to reference Pomodoro Focus
  throughout; the Sound Cues feature now lists all five sounds (start,
  pause, resume, stop, completion).

### Removed
- `playResetSound` and `resetSession()` — there is no Reset button per
  PRD §14.
- `DeepFocusIcon` — renamed to `BrandMark`.

### Migration notes (read these before you upgrade)
- **Legacy 12-bucket history** is migrated transparently the first
  time `loadHistory()` runs in the new build. Each old 2-hour value
  splits evenly across its two corresponding hourly buckets, so totals
  are preserved but the heatmap pattern looks slightly less precise
  for pre-v2 days. Going forward all new data is recorded at hourly
  resolution.
- **Tasks Completed counter** only counts going forward. Days that
  predate this release will show 0 tasks completed even if you did
  complete tasks then — that data wasn't tracked.
- The migration is **one-way and per-browser** (localStorage is
  per-origin). There is no rollback short of restoring the prior
  build *and* clearing localStorage.

### Known limitations
- `stopSession()` uses `window.confirm()`, which blocks programmatic
  drivers (Playwright / Puppeteer must auto-accept the dialog).
- No automated test suite yet — verification is manual per
  `test-report.txt`. Vitest scaffolding tracked separately.

[Unreleased]: https://github.com/arjunrana1/pomodoro/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/arjunrana1/pomodoro/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/arjunrana1/pomodoro/compare/v1.0.0...v2.0.0
