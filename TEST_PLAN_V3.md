# TEST_PLAN_V3 — Pomodoro Focus

**Used by a separate, fresh session** run *after* the v3 dev build is complete and merged. This doc does **not** restate behavior — it maps the numbered Acceptance Criteria in [REQUIREMENTS_V3.md §17](REQUIREMENTS_V3.md) to concrete tests, and defines the tooling that **records** results. Read [REQUIREMENTS_V3.md](REQUIREMENTS_V3.md) (the AC list is the contract) and [CLAUDE.md](CLAUDE.md) first.

> **For the testing agent:** the app already exists. Your job is to (1) set up the test tooling, (2) write tests that cover every AC, (3) run them, and (4) leave behind recorded artifacts (Playwright HTML report + video + traces, and a coverage summary). Do not change app behavior except to fix genuine bugs the tests surface — and if you fix a bug, note it in the summary.

---

## 1. Tooling

| Layer | Tool | Purpose | Recorded output |
|---|---|---|---|
| Unit | **Vitest** | pure logic (timer math, formatting, history bucketing, persistence) | text/JSON report + coverage |
| Integration | **Vitest + React Testing Library** | component flows, state transitions, drawers, validation | same run as unit |
| E2E | **Playwright** | full user journeys in a real browser | **HTML report + screenshots + video + traces** per run |

Commands to wire (in `app/package.json`):
- `npm test` → Vitest unit + integration (with `--coverage`).
- `npm run e2e` → Playwright (configure `reporter: [['html'], ['list']]`, `use: { video: 'on', trace: 'on', screenshot: 'only-on-failure' }`).
- Optional `npm run test:all` → both.

Artifacts land in `app/coverage/` (Vitest) and `app/playwright-report/` + `app/test-results/` (Playwright). Add a short `app/docs/test-results-v3.md` summarizing the latest run (pass/fail counts, coverage %, link to the HTML report, any known gaps).

Optional CI: a GitHub Actions workflow running `npm test` + `npm run e2e` on PRs, uploading `playwright-report/` and `coverage/` as build artifacts.

---

## 2. What can't be fully automated (mock / manual)

- **Spotify (AC-31):** no live Premium account in CI. **Mock the Spotify API/auth layer**; unit-test PKCE helpers (verifier/challenge), token refresh logic, and connected/disconnected UI against a fake client. Real end-to-end connect = a manual checklist item.
- **Audio playback (AC-22, AC-23, AC-30):** assert the *intent* (correct sound/track requested, gated on toggle + volume, playback state persists) by mocking the audio layer; actual sound output is manual.
- **Wall-clock timing (AC-9):** use fake timers / injectable clock (`vi.useFakeTimers`, mockable `Date.now`) — never real sleeps.
- **localStorage:** use jsdom storage; clear between tests.

---

## 3. AC → test mapping

For each AC write at least the listed cases. Type: U=unit, I=integration, E=e2e.

| AC | Area | Type | Key cases |
|---|---|---|---|
| AC-1 | Mode toggle present/default | I,E | toggle renders all screens; fresh load = Work |
| AC-2 | Break mode swap | I | presets→5/10/15 default 5; teal accent; Tasks/Notes/FABs/stats hidden |
| AC-3 | Mode lock mid-session | I,E | toggle disabled+lock while running/paused; click does nothing |
| AC-4 | Break not recorded | U,I | break end leaves stats/history/dashboard unchanged |
| AC-5 | Home Start duration | I | default 25m; preset selection drives timer |
| AC-6 | Plan start = sum | U,I | sum of active minutes; CTA disabled w/ no valid task |
| AC-7 | Count up/down | U,I | display 0→N vs N→0; both end at N; stats identical |
| AC-8 | Pause/Resume/no Reset | I | pause freezes; resume sound; no reset control/fn |
| AC-9 | Wall-clock restore | U,I | reopen recomputes; would-have-finished→complete+stats; paused preserves |
| AC-10 | Tab title | I | reflects timer for Work + Break |
| AC-11 | Work Stop | I,E | confirm→Flow Complete; stats flat; history+elapsed; elapsed shown |
| AC-12 | Cross-midnight | U | attributes to start day |
| AC-13 | Tasks FAB availability | I | all Work states incl. active; hidden in Break; badge=active count |
| AC-14 | Task CRUD/reorder | I,E | validation; drag reorder; delete; duplicates allowed |
| AC-15 | Complete-on-check | I | moves to Completed w/ timestamp+duration, newest-first |
| AC-16 | Completed clear-all only | I | no edit/delete/undo; Clear-all confirm in drawer + settings |
| AC-17 | Completed persistence | U,I | survives refresh; never auto-cleared |
| AC-18 | Notes availability | I | idle Home + active Work; hidden Break/completion |
| AC-19 | Notes CRUD/toggle | I,E | non-empty add; edit; delete; timestamps; FAB toggle; click-outside; Esc no-op |
| AC-20 | Notes persistence/independence | U,I | persist across refresh/sessions; not cleared; not attached to tasks |
| AC-21 | Settings screen | I,E | gear opens full screen; all four sections present |
| AC-22 | Sound toggle/volume | U,I | header speaker live; volume scales effects; music volume independent |
| AC-23 | Break sounds | U | start/end distinct; gated on toggle+volume |
| AC-24 | Clear/Export | I | confirm-gated clears wipe right data; export JSON shape |
| AC-25 | Dashboard placement | I,E | below fold, Home-only, scroll on desktop+mobile; empty state |
| AC-26 | Bar chart + stats tiles | U,I | today emphasized; no Weekly View pill; 4 tiles incl. Tasks Completed |
| AC-27 | Hourly heatmap | U,I | 7×24; columns start 9 AM; pre-9am wrapped; intensity ∝ seconds |
| AC-28 | Stopped contributes | U | elapsed to bar+heatmap, not sessions count |
| AC-29 | Duration format | U | `Xh Ym`/`Ym`/`Xh`; no decimals; seconds round up |
| AC-30 | Lofi player | I | select/play/pause/next/prev/loop; independent volume; persists across state |
| AC-31 | Spotify (mocked) | U,I | PKCE helpers; token refresh; connected/disconnected UI; Premium note |
| AC-32 | Footer | I | present on Work idle Home; all sections; "Pomodoro Focus" |
| AC-33 | Fresh-start purge | U,I | v2-shaped keys cleared on boot; defaults initialized |
| AC-34 | Persistence | U,I | stats/history(≥14d)/completed/settings persist locally |

---

## 4. Critical E2E journeys (Playwright)

Record these end-to-end (video + trace):
1. **Work quick session:** Home → pick 25m → Start → pause/resume → let complete → Flow Complete → New Session → stats updated, dashboard reflects it.
2. **Planned session:** open Tasks → add 3 tasks → Start Focused Session → check 2 → Stop → Flow Complete shows elapsed; completed tasks logged; unchecked task preserved.
3. **Break:** switch to Break → 5m → Start → End Break → Break Done → Start Focus Session → confirm nothing recorded.
4. **Count Up:** Settings → Count Up → start Work → timer counts up → completes at target.
5. **Notes:** idle Home → add/edit/delete notes → persist across reload.
6. **Settings/Data:** change volume + toggle sound (speaker updates) → Export JSON → Clear completed tasks (confirm).
7. **Responsive:** run journeys 1 & 2 at mobile (390px) and desktop (1440px) viewports.

---

## 6. Dashboard demo data (seeded, not real sessions)

The Focus History dashboard is tested against **seeded localStorage**, not by running real sessions. A committed seeder lives at **`app/docs/seed-dashboard.js`**.

- **Manual use:** open the app at `http://127.0.0.1:5173/` → DevTools Console → paste the file → it writes data and reloads. `seedDashboard.clear()` removes it.
- **What it writes (only):** `pomodoro-focus-history` (14 `DayRecord`s, 24 hourly `segmentSeconds` each) + `pomodoro-focus-completed-tasks` (~14 entries across the last 7 days). Neither key triggers the fresh-start purge.
- **Edge cases baked in** (so one seed exercises the whole dashboard): a **zero day** (baseline line), a **peak day** (max heatmap intensity / tallest bar), **today** non-zero (Daily Total), **pre-9 AM** hours (night-owl wrap-to-end), **late-night** and **evening** hours, `sessionsCount` consistent with totals, and completed tasks driving the **Tasks Completed** tile + drawer log.
- **In automated tests:** unit/integration tests should import the same dataset shape (or a trimmed fixture) and assert the computed Daily Total / Daily Avg / Weekly Total / Tasks Completed, bar heights, the 9 AM→end column order, and intensity scaling (AC-26, AC-27, AC-29). E2E may inject via `page.addInitScript` using the seeder's logic before navigation.

## 5. Definition of done
- Every AC has ≥1 passing test; all listed E2E journeys pass at mobile + desktop viewports.
- Vitest coverage reported (aim meaningful coverage of `store`, `utils`, timer, formatting, persistence — not a hard %).
- `playwright-report/` generated with video/traces; `app/docs/test-results-v3.md` summarizes the run.
- Any bug fixed during testing is listed in the summary with what changed.
