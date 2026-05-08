# Changelog

All notable changes to Pomodoro Focus will be documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/arjunrana1/pomodoro/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/arjunrana1/pomodoro/compare/v1.0.0...v2.0.0
