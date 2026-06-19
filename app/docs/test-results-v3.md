# Test Results — Pomodoro Focus v3

**Run date:** 2026-06-15 · **Branch:** `test/v3-suite` (off `feature/v3`) · **Suite:** Vitest 4 (unit + integration)

This is the recorded result of the v3 automated test pass described in [TEST_PLAN_V3.md](../../TEST_PLAN_V3.md). Every Acceptance Criterion in [REQUIREMENTS_V3 §17](../../REQUIREMENTS_V3.md) (AC-1…AC-34) has at least one passing test at the unit and/or integration level.

---

## 1. Headline

| Layer | Tool | Files | Tests | Result |
|---|---|---:|---:|---|
| Unit | Vitest | 5 | 62 | ✅ all pass |
| Integration | Vitest + React Testing Library | 12 | 68 | ✅ all pass |
| **Total** | | **17** | **130** | **✅ 130 / 130 pass** |
| E2E | Playwright | — | — | ⏸️ scaffolded, **not executed** (descoped this session — see §6) |

```
 Test Files  17 passed (17)
      Tests  130 passed (130)
```

### Commands

```bash
cd app
npm test          # vitest run --coverage   → coverage/ + console summary
npm run e2e       # playwright test          (scaffolded; not run this session)
npm run test:all  # both
```

---

## 2. Coverage summary (`app/coverage/`)

V8 coverage over `src/`. The plan asks for *meaningful* coverage of the logic-bearing modules rather than a hard %; the pure-logic core is well covered.

| Scope | % Stmts | % Branch | % Funcs | % Lines |
|---|---:|---:|---:|---:|
| **All files** | **83.04** | **67.76** | **81.27** | **85.99** |
| `store.ts` (state machine, timer) | 89.36 | 67.09 | 89.53 | 93.50 |
| `utils.ts` (formatting, history bucketing) | 93.33 | 82.75 | 100 | 96.07 |
| `persistence.ts` (localStorage I/O, purge, export) | 100 | 91.66 | 100 | 100 |
| `components/FocusHistoryDashboard.tsx` | 98.33 | 96.07 | 100 | 100 |
| `components/SettingsScreen.tsx` | 100 | 82.50 | 100 | 100 |
| `music.ts` | 76.47 | 51.42 | 85 | 83.63 |
| `spotify.ts` | 55.40 | 34.09 | 52.94 | 57.57 |

HTML report: `app/coverage/index.html`. Lower-covered branches are mostly UI paths exercised end-to-end by the (not-run) Playwright journeys and the network/error fallbacks in `spotify.ts` (which require a live account).

---

## 3. AC coverage matrix

Type: **U** = unit, **I** = integration. All rows pass.

| AC | Area | Type | Test file(s) | Status |
|---|---|---|---|---|
| AC-1 | Mode toggle present / default Focus | I | `integration/app.modes.test.tsx` | ✅ |
| AC-2 | Break swap (presets/copy/hide Work UI) | I | `integration/app.modes.test.tsx`, `integration/breakFlow.test.tsx` | ✅ |
| AC-3 | Mode lock mid-session | I | `integration/app.modes.test.tsx` | ✅ |
| AC-4 | Break never recorded | U, I | `unit/store.logic.test.tsx`, `integration/breakFlow.test.tsx` | ✅ |
| AC-5 | Home Start duration (default 25m) | I | `unit/store.logic.test.tsx` | ✅ |
| AC-6 | Plan start = sum of active minutes | U, I | `unit/store.logic.test.tsx`, `integration/tasks.test.tsx` | ✅ |
| AC-7 | Count up/down display-only | U, I | `unit/store.logic.test.tsx`, `integration/tabTitle.test.tsx` | ✅ |
| AC-8 | Pause/Resume, no Reset | I | `unit/store.logic.test.tsx` | ✅ |
| AC-9 | Wall-clock restore on reopen | U, I | `integration/restore.test.tsx` | ✅ |
| AC-10 | Tab title reflects timer | I | `integration/tabTitle.test.tsx` | ✅ |
| AC-11 | Work Stop → Flow Complete, history+elapsed; sessions count flat | I | `unit/store.logic.test.tsx` | ✅ **(see §4 — behavior note)** |
| AC-12 | Cross-midnight attributes to start day | U | `unit/utils.test.ts` | ✅ |
| AC-13 | Tasks FAB availability + no badge | I | `integration/tasks.test.tsx` | ✅ |
| AC-14 | Task add-validate / reorder / delete / dupes | I | `integration/tasks.test.tsx` | ✅ |
| AC-15 | Complete-on-check → log (timestamp, newest-first) | I | `unit/store.logic.test.tsx`, `integration/tasks.test.tsx` | ✅ |
| AC-16 | Completed: clear-all only, confirm-gated | I | `unit/store.logic.test.tsx`, `integration/tasks.test.tsx` | ✅ |
| AC-17 | Completed persists / never auto-cleared | U, I | `unit/store.logic.test.tsx`, `integration/restore.test.tsx` | ✅ |
| AC-18 | Notes availability (idle + active Work) | I | `integration/notes.test.tsx` | ✅ |
| AC-19 | Notes CRUD / FAB toggle / click-outside / Esc no-op | I | `integration/notes.test.tsx` | ✅ |
| AC-20 | Notes persist & independent | U, I | `unit/store.logic.test.tsx`, `integration/restore.test.tsx` | ✅ |
| AC-21 | Settings full screen + all sections | I | `integration/settings.test.tsx` | ✅ |
| AC-22 | Sound toggle live + volume independence | U, I | `unit/audio.test.ts`, `integration/settings.test.tsx` | ✅ |
| AC-23 | Break start/end sounds, gated | U | `unit/audio.test.ts` | ✅ |
| AC-24 | Clear (confirm) + Export JSON | I | `integration/settings.test.tsx`, `unit/persistence.test.ts` | ✅ |
| AC-25 | Dashboard placement + empty state | I | `integration/dashboard.test.tsx` | ✅ |
| AC-26 | Bar chart + 4 stat tiles | U, I | `integration/dashboard.test.tsx` | ✅ |
| AC-27 | Hourly heatmap 7×16, column order, intensity | U, I | `integration/dashboard.test.tsx` | ✅ |
| AC-28 | Stopped contributes to bar/heatmap not sessions | U | `unit/utils.test.ts`, `unit/store.logic.test.tsx` | ✅ |
| AC-29 | Duration format `Xh Ym`, no decimals | U | `unit/utils.test.ts`, `integration/dashboard.test.tsx` | ✅ |
| AC-30 | Lofi player select/play/pause/next/prev/loop/volume | I | `unit/music.test.ts`, `integration/musicUI.test.tsx` | ✅ |
| AC-31 | Spotify PKCE/refresh + connected/disconnected UI | U, I | `unit/spotify.test.ts`, `integration/spotify.ui.test.tsx` | ✅ |
| AC-32 | Expanded footer, all sections | I | `integration/footer.test.tsx` | ✅ |
| AC-33 | Fresh-start purge of v2 keys | U, I | `unit/persistence.test.ts`, `integration/restore.test.tsx` | ✅ |
| AC-34 | Persistence (stats/history/completed/settings) | U, I | `unit/persistence.test.ts`, `integration/restore.test.tsx` | ✅ |

**34 / 34 ACs covered and passing.**

---

## 4. Behavior note — Work Stop adds elapsed to today's focus total (intentional)

On a Work **Stop**, `src/store.ts` adds the elapsed focus seconds to `dailyStats.focusSeconds` (so the Home orb's "Focus Time Today" stays consistent with the dashboard). The sessions counter is **not** bumped (only natural completions increment it), and Focus History is updated with the elapsed seconds as usual.

This is a **product decision confirmed by the owner** and is intentionally retained. Note that it **diverges from the literal wording** of:
- **REQUIREMENTS §4.4:** *"Work Stop … Daily stats **not** incremented …"*
- **AC-11:** *"… stats not incremented …"*

> 📝 **Recommendation:** update REQUIREMENTS §4.4 + AC-11 to say "the sessions count is not incremented on Stop (but elapsed focus time is added to today's total)", so the spec matches the implementation. The AC-11 test (`unit/store.logic.test.tsx`) asserts the implemented behavior: after a Stop, `dailyStats.focusSeconds += elapsed`, `dailyStats.sessionsCount` and `focusHistory…sessionsCount` unchanged.

*(History: an earlier draft of this report flagged this as a bug and reverted it; on confirmation that it was intentional, the change was restored and the test updated to match.)*

---

## 5. Documentation discrepancies noted (no code changed)

These are stale-doc mismatches surfaced while writing tests; tests assert the **implemented + AC-level** behavior:

1. **Heatmap window starts at 8 AM, not 9 AM.** `FocusHistoryDashboard.HOUR_ORDER = 8..23` (16 columns, **8 AM → 11 PM**), matching AC-27 (*"8 AM–11 PM"*), §10, and the card's own "8 AM → 11 PM" label. The wording "columns start 9 AM / pre-9am wraps" in TEST_PLAN §3/§6 and the inline comment at `FocusHistoryDashboard.tsx:147` is stale — there is no wrap; hours 0–7 are simply stored-but-hidden. Tests assert the real `8AM…11PM` order.
2. **Settings has no session-mode mirror.** AC-21's parenthetical *"(direction + session-mode mirror)"* is stale — REQUIREMENTS §8.1 explicitly **removed** the mirror, and the Settings header uses `hideToggle`. Tests assert the four sections + the Timer Direction control only.
3. **AC-1 "every screen".** The header Focus/Break toggle renders on the timer screens (Home idle + Active session) and is intentionally **absent** on Settings (mirror removed) and the completion screens (no header). Tests assert presence on Home + Active and the default = Focus.

---

## 6. E2E (Playwright) — scaffolded, not executed

E2E was **descoped for this session by request**. The tooling is in place and committed so it can be run later:

- `playwright.config.ts` — `reporter: [['html'],['list']]`, `use: { video:'on', trace:'on', screenshot:'only-on-failure' }`, `webServer` on `http://127.0.0.1:5173` with `reuseExistingServer: true`, and **two projects**: `desktop-chromium` (1440×900) and `mobile-chromium` (390×844) so every spec runs at both viewports.
- `e2e/helpers.ts` — fake-clock install (`page.clock`), the `addInitScript` dashboard seeder (reuses `tests/fixtures/seedData.ts`, the importable twin of `app/docs/seed-dashboard.js`), and clock-advance helpers.
- `e2e/journeys.spec.ts` — journeys 1–6 (Work quick session, planned session, break, count-up, notes-persist, settings/data). Journey 7 (responsive) and the dedicated seeded-dashboard E2E assertions were **not written**.

> These E2E specs have **not been run or verified**. Treat them as a starting point, not a passing suite. Browser is installed (`npx playwright install chromium`).

---

## 7. Manual-only verification (cannot be fully automated — TEST_PLAN §2)

| Item | Why manual | AC |
|---|---|---|
| **Live Spotify connect** (real OAuth + Premium account) | No live Premium account / real OAuth redirect in CI; PKCE helpers, token refresh, and connected/disconnected UI are unit/integration-tested against mocks | AC-31 |
| **Actual audio output** (hearing the chimes / lofi tracks) | The audio + `<audio>` layers are mocked; tests assert *intent* (correct frequencies requested, gated on toggle+volume; correct track selected/played) but not real sound | AC-22, AC-23, AC-30 |
| **Real wall-clock passage** across an actual reboot/midnight | Tests use a fake/injectable clock; the restore math is verified, but a true days-long run is manual | AC-9, AC-12 |
| **Full E2E journeys in a real browser** (incl. responsive at 390/1440) | Descoped this session — see §6 | AC-1,3,11,14,19,25,26,27 (E-level) |

---

## 8. Tooling added

- **Deps (devDependencies):** `vitest@^4.1.8`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@playwright/test`.
- **Config:** `vitest.config.ts` (jsdom, globals, v8 coverage), `playwright.config.ts`, `tests/setup.ts` (mocks: Web Audio, `<audio>`, `crypto`, and an in-memory `Storage` — jsdom under Vitest 4/Node 25 ships a non-functional `localStorage` stub).
- **Scripts:** `test`, `test:watch`, `e2e`, `test:all`.
- **Fixtures/helpers:** `tests/fixtures/seedData.ts`, `tests/fresh.ts` (module-reset helper for boot-sensitive specs), `tests/integration/appHarness.tsx`.
- `eslint.config.js` / `.gitignore` updated to ignore test + artifact dirs.
