# REQUIREMENTS_V3 — Pomodoro Focus

**Status:** canonical product spec for v3. **Supersedes** `PRD.md` (v2) and the old root `DESIGN_REQUIREMENTS_V3.md`. Behavior is owned here; visuals/tokens are in [DESIGN_V3.md](DESIGN_V3.md); screenshots in [`reference_designs/v3/`](reference_designs/v3/); test mapping in [TEST_PLAN_V3.md](TEST_PLAN_V3.md).

This is a **frontend-only** React + Vite + Tailwind app. No backend, no accounts, no server persistence. All state is browser-local. v3 is a **fresh start**: existing v2 localStorage is **purged** on first load (no migration).

> **For the implementing agent:** read [CLAUDE.md](CLAUDE.md) → this file → DESIGN_V3.md → the screenshots. Build the whole app in one consolidated pass following the **Build Order (§16)**. Do **not** write the automated test suite (separate session — TEST_PLAN_V3.md), but **do** self-verify the build runs and smoke-test core flows. Where this doc and a screenshot conflict, this doc wins — note any such conflicts in your summary.

---

## 1. What v3 adds over v2 (orientation)

1. **Work / Break mode** — a persistent header toggle; Break is a non-recorded timer with its own presets, color, sounds, and completion card.
2. **Count Up / Count Down** — a display-only timer-direction setting (Work + Break).
3. **FAB navigation** — side rails replaced by floating buttons (Notes bottom-left, Tasks bottom-right with count badge) + a header gear for Settings.
4. **Settings screen** — Timer, Sound (incl. volume), Music (built-in Lofi library + Spotify Connect), Data & Privacy (clear/export).
5. **Completed Tasks log** — a section inside the Tasks drawer; checked tasks move here with a timestamp; clearable.
6. **Notes** — now available on idle Home too (not active-only), with per-note timestamps + edit/delete.
7. **Dashboard rework** — hourly heatmap starting 9 AM, hours-minutes durations everywhere, `Tasks Completed` stat replaces `Weekly Avg`.
8. **Expanded SEO marketing footer**.
9. **Mobile-first responsive** across all screens.

Everything in v2's PRD that is **not** changed below still holds (timer wall-clock restoration, drawer animations, semantic/keyboard accessibility basics, etc.). The v2 PRD remains a useful behavioral reference for unchanged Work-session mechanics.

---

## 2. App modes & states

- **Mode** (global, persisted): `work | break`. Default **work** on first load. Controlled solely by the header **Focus/Break** toggle (labeled "Focus", internally `work`; the Settings mirror was removed).
- **Timer direction** (global, persisted): `countDown | countUp`. Default **countDown**.
- **App status:** `idle | running | paused | complete` (+ break equivalents). Work completion → **Flow Complete** modal; Break completion → **Break Done** card.

State router renders by `(mode, status)`. Below-the-fold dashboard + footer render only on **Work idle Home** (and on Break idle Home the orb area differs — dashboard/footer still reachable by scroll; see §10/§12).

---

## 3. Work / Break mode

### 3.1 Toggle
- Persistent **Work / Break** segmented toggle: desktop header center; mobile a full-width pill below the brand.
- Default **Work**. Switching mode on an idle screen swaps presets, accent color (primary↔teal), copy, and shows/hides Work-only UI.

### 3.2 Mode lock during an active session
- While a session is **running or paused** (Work **or** Break), the toggle is **disabled and shows a lock**. It is not relabeled.
- A user mid-Work who wants a Break must **Stop** (Work) first; likewise End a Break before switching. Switching mid-session is blocked.

### 3.3 Work mode
- All v2 Work behavior: presets `15m / 20m / 25m / custom`, plan tasks, notes, daily stats, focus history recording, Flow Complete. Tasks + Notes FABs visible.

### 3.4 Break mode
- Break is a simple timer that is **never written to focus history or daily stats**, and never appears in the dashboard.
- Presets `5m / 10m / 15m / custom`, **default 5m**. Subtitle `TAKE A BREATHER`. Accent teal.
- Started manually (**Start Break**); it does **not** auto-start when a Work session ends.
- Controls: **Start → Pause / Resume → End Break**. (No "Stop" wording; "End Break" ends it.)
- Tasks checklist, Notes, daily stats, and the Tasks/Notes FABs are **hidden** in Break.
- On **End Break** (or natural completion): show **Break Done** card → **Start Focus Session** returns to Work Home. The toggle **stays in Break** after a break unless the user moves it — no automatic mode change.
- Break supports **Count Up** and the same **wall-clock pause/restore** as Work (a paused/closed break reopens with correct remaining/elapsed time). Stopping/ending a break early simply ends it; nothing is recorded.

---

## 4. Timer logic

### 4.1 Sources & duration
- **Work — Home Start:** uses the selected Home duration (`15/20/25/custom`). Default selected preset is **25m** (`25:00`). If plan tasks exist they show as a checklist but do **not** change the Home duration.
- **Work — Start Focused Session (plan):** duration = **sum of task minutes**.
- **Break — Start Break:** uses selected break duration (`5/10/15/custom`, default 5m).

### 4.2 Count direction (display-only)
- `countDown` (default): timer shows remaining time N→0.
- `countUp`: timer shows elapsed time 0→N, where N is the same chosen duration. **Nothing else changes** — the session still ends at N, presets/custom still set the target, completion/stop/stats rules are identical. Count direction only changes the displayed number. Applies to Work and Break.

### 4.3 Running / pause / resume
- Running counts every second; wall-clock-driven (persist absolute timestamps; recompute against `Date.now()` on reload — see v2 PRD §7.4 restoration rules, unchanged).
- Pause freezes; tab title reflects frozen value. Resume continues and plays the resume sound.
- **No Reset** control or `resetSession()` exists.

### 4.4 Stop / End / Completion
- **Work Stop:** browser confirm → session ends → **Flow Complete**. Daily stats **not** incremented; Focus History **is** updated with elapsed focused seconds. Elapsed (not initial) duration shown.
- **Break End:** ends immediately → **Break Done**. Nothing recorded.
- **Natural completion** (reaches target): Work → Flow Complete, daily stats + Focus History incremented (completed). Break → Break Done, nothing recorded.
- Stopping mid-session counts the focused minutes completed until stop (same as v2; pause time excluded).
- Cross-midnight Work sessions attribute to the day they **started** (set at start, persisted) — unchanged from v2.

### 4.5 Browser tab title
- Reflects remaining (countDown) or elapsed (countUp) value during active/paused Work and Break sessions.

---

## 5. Tasks / Session Plan

### 5.1 Access
- Opened via the **Tasks FAB** (bottom-right) — available on **Work idle Home only**; the FAB is hidden during a running/paused session and on completion screens. Hidden in Break. (The active-session checklist §5.3 is how tasks are interacted with mid-session.)
- The Tasks FAB is a plain round CTA — **no count badge**.

### 5.2 Drawer contents (`Session Plan`)
- Title **Session Plan**, close `✕`.
- **ADD TASK** (title input, required) + **TIME (MINUTES)** (whole number ≥ 1, required) + **＋ Add Task**. Validation: disable Add Task until both valid, or show inline error. Inputs clear on add; drawer stays open.
- **CURRENT BREAKDOWN** with a `N total` minutes pill → active task rows: drag handle, circle checkbox, title, `Scheduled for N min` subtext, `Nm` minute pill, delete. Drag-to-reorder (long-press + drag on mobile). Duplicate titles allowed; no per-task or count limits.
- **COMPLETED TASKS** with a `N done` pill → see §6.
- Bottom CTA **▷ Start Focused Session** — only visible while no session is running/paused (idle); disabled until ≥1 valid active task; starts a Work session using the **sum of active task minutes**; drawer closes first.

### 5.3 Active-session checklist
- If plan tasks exist, the active Work session shows them with progress `X of Y · <total>` and a `+N more` expander on mobile. Check/uncheck any time; no effect on timer; completed appear struck through.

---

## 6. Completed Tasks log

- When a task is **checked off** during a Work session, it moves from CURRENT BREAKDOWN into **COMPLETED TASKS** with a **timestamp** (`MMM D · HH:MM`) and its **duration** (the task's minutes, formatted per §11).
- Ordered **newest-first**. Persisted under a dedicated key; **never auto-cleared**.
- **No per-row edit or delete, and no undo toast** (explicitly dropped). The only removal is **Clear Completed Tasks** — a single clear-all action, guarded by a **confirm dialog**. It appears in two places: the Tasks drawer and Settings → Data & Privacy; both clear the same log.
- **Notes are NOT attached** to completed tasks. Notes are a fully independent entity (§7) with no association to any session or task.
- Completed tasks survive session end and browser refresh.

---

## 7. Notes

- Standalone entity — not tied to sessions or tasks. Opened via the **Notes FAB** (bottom-left).
- **Available on idle Home and during active/paused Work sessions** (changed from the old "active-only" note). Hidden in Break, and not shown on Flow Complete / Break Done.
- Drawer: **ADD NOTE** (`Capture a thought…`, non-empty required) + **＋ Add Note**; **SAVED NOTES** with count → note cards showing a **timestamp** (`Today · h:MM AM/PM` style), text, and **edit (✎) + delete (🗑)** controls. Newest behavior: list ordered chronologically (newest grouping acceptable per design).
- Add / edit / delete supported. No max length. Click-outside closes the drawer; the Notes FAB toggles open↔closed; Escape does not close.
- Notes **persist** across refresh and across all session types and mode switches. They are independent — not cleared by completing/stopping a Work session.

---

## 8. Settings (dedicated screen)

Reached via header **gear**. Full screen (not a modal). Sections:

### 8.1 Timer
- **Timer Direction** toggle `Count Down | Count Up` (default Count Down) → sets global `countUp` (§4.2).
- ~~Session Mode toggle~~ — removed; mode is controlled only by the header Focus/Break toggle.

### 8.2 Sound
- **Sound Effects** master toggle (default **on**) — also reflected by the header speaker icon (filled/muted, updates live).
- **Sound Volume** slider 0–100% (default **70%**) — applies to all sound effects.

### 8.3 Music
- **Lofi Library (built-in):** track list (title, artist, duration), selectable; transport **Play/Pause, Prev, Next, Loop**; **independent music volume slider**. Playback **persists across all app state changes** (Work↔Break, idle↔active, scrolling to dashboard). Tracks are bundled local assets (see §13).
- **Spotify Connect:** see §14.

### 8.4 Data & Privacy
- **Clear focus history** (destructive, confirm) — wipes `focusHistory` + daily stats.
- **Clear completed tasks** (destructive, confirm) — wipes the completed-tasks log.
- **Export data (JSON)** — downloads a single JSON of all persisted app data.

---

## 9. Audio

- All v2 Work sounds unchanged: click, session start (ascending two-tone), pause, resume, stop (descending), completion (rich ~4s chime).
- **NEW Break start:** warm descending two-note chime — softer/lower than Work start.
- **NEW Break end:** gentle ascending single chime — lighter than Work completion.
- All sounds gated on the master Sound Effects toggle and scaled by **Sound Volume** (§8.2), independent of music volume. Browser autoplay rules may require a first interaction.

---

## 10. Focus History dashboard

Below-the-fold on Home, reachable by **scrolling on both desktop and mobile** (mobile adapts the desktop layout — **no separate route or nav entry**). Rendered on Home only (not in active session, Flow Complete, or Break Done). Break time never appears here.

- Title **Focus History** centered.
- **7-Day Activity** bar chart: last 7 days, oldest left, today emphasized; single-letter day initials; bars sized by `totalFocusSeconds`; zero-days show a baseline line; values annotated in hours-minutes (§11). No "Weekly View" pill.
- **Stats grid 2×2:** **DAILY TOTAL** (today's focus), **DAILY AVG** (last-7-day total ÷ 7), **WEEKLY TOTAL** (sum last 7 days), **TASKS COMPLETED** (count of completed tasks in window / or total — see note). The 4th tile replaces v2's "Weekly Avg".
  - *Tasks Completed definition:* count of tasks completed in the last-7-day window. (If simpler, total completed-tasks count is acceptable; pick one and note it.)
- **7-Day Focus Heatmap — Hourly:** 7 day-rows × hourly columns covering **8 AM → 11 PM only** (16 columns, "work life friendly" window — hours outside it are stored but not displayed). Every column labeled in full (`8AM, 9AM, … 11PM`). Subtitle note under the card title: "Work life friendly heat map". Cell intensity ∝ focus seconds in that day×hour bucket, brand-purple ramp, scaled to the visible grid max. `Less → More` legend.
- **Empty state:** if no focused seconds ever recorded and today's focus is 0 → show title + "Complete your first session to start tracking your focus history." and no charts.
- Re-renders on return to Home from completion and at local-midnight rollover.

**Data recording:** on every Work session end (completed or stopped), update the attributed day's `totalFocusSeconds` (+ focused non-paused seconds) and the 12→**24 hourly** `segmentSeconds` buckets by wall-clock time of each focused second (cross-midnight buckets recorded against the start day's row). `sessionsCount` increments for completed Work sessions only. Break contributes nothing.

> Heatmap granularity change: v2 used 12 two-hour buckets; v3 uses **24 hourly buckets** displayed starting at 9 AM. Store 24 hourly values per day.

---

## 11. Duration formatting (global)

- **One compact format everywhere** (dashboard, tooltips, completed-task rows, stats tiles, Flow Complete, Break Done): `Xh Ym`.
  - Zero hours → `Ym` (e.g. `45m`); zero minutes → `Xh` (e.g. `2h`); both → `Xh Ym` (e.g. `1h 15m`); zero total → `0m` (tiles may show `0h 0m` per design).
- Seconds are **rounded up to the next minute** and never displayed. **No decimals anywhere** (`1.5h` is disallowed).
- Replaces both v2's decimal `N.Nh` and the design's spaced `1 hr 15 min`.

---

## 12. Marketing footer (expanded, SEO)

Keep v2's footer and **expand** it with keyword-rich content so the page surfaces more relevant search terms. Static, non-interactive, Home-only (Work idle), below the dashboard.

Required sections (canonical product name **Pomodoro Focus** throughout):
1. **What is Pomodoro Focus?** (intro)
2. **What is the Pomodoro Technique?** (Cirillo origin)
3. **How to Use Pomodoro Focus** (numbered steps — include choosing duration, count-up/down, planning tasks, starting, taking breaks, reviewing)
4. **Focus & Break sessions** *(new)* — explain Work vs Break mode, why breaks matter, the 5/10/15 break presets.
5. **Tasks & session planning** *(new)* — planning a session, the breakdown, completed-tasks log.
6. **Focus music** *(new)* — built-in lofi library and Spotify Connect for focus/study music.
7. **Features** (bulleted; include Flexible Timer, Count Up/Down, Work & Break Modes, Session Planning, Completed Tasks, Session Notes, Daily Tracking, Focus History heatmap, Lofi & Spotify Music, Session Summary, Sound Cues — each with a one-line, keyword-aware description). Sound Cues must mention "resume".

Goal: natural, readable copy that embeds terms like *pomodoro timer, focus timer, study timer, break timer, lofi focus music, task planner, productivity* without keyword-stuffing.

---

## 13. Lofi music assets — ✅ bundled

- **8 CC0 tracks are already downloaded and committed** at `app/public/music/` (served by Vite at `/music/...`), with a ready-to-consume **`app/public/music/manifest.json`** (`{ tracks: [{ id, title, artist, duration, src, license, source }] }`) and **`CREDITS.md`**. The dev session should **load the library from `manifest.json`** rather than hardcoding tracks.
- Tracks (all HoliznaCC0 "Lo-fi And Chill", CC0 1.0, no attribution): Morning Coffee, Vintage, A Little Shade, Seasons Change, Busted Jazz, Creature Comforts, Foggy Headed, Something In the Air.
- Playback continues seamlessly across app state changes; loop + next/prev + track selection per §8.3.
- *Optional later:* more tracks (Pixabay no-attribution / Chosic) can be added by dropping the file in `app/public/music/` and appending a `manifest.json` entry (CC-BY picks credited in `CREDITS.md`). Not required for the build.

---

## 14. Spotify Connect (PKCE, frontend-only)

- **Auth:** Authorization Code with **PKCE** — no backend, no client secret. **Client ID: `c7de100a24044d0bb37b6ab279dfb028`** (store as `VITE_SPOTIFY_CLIENT_ID`; it's a public identifier, fine in the frontend).
- **Redirect URIs (already registered):** `http://127.0.0.1:5173/callback` (dev — use `127.0.0.1`, not `localhost`) and `https://www.pomodorofocus.net/callback` (prod). Add a `/callback` route that completes the token exchange.
- **Token handling:** persist access + refresh tokens in localStorage; **silently refresh** on expiry (1h) and re-init on load so the connection survives refresh/reopen.
- **Scopes:** the playback-control set (`user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`; add `streaming` + `user-read-email`/`user-read-private` if using the Web Playback SDK).
- **Behavior:** Disconnected → "Connect Spotify" (§3.12). Connected → show current track + transport (play/pause, skip) in Settings and as a mini-player on the active-session screen; **Disconnect** revokes/clears the token. If the account lacks **Premium**, show the "Playback control requires Spotify Premium" message (control endpoints require Premium).
- The allowlisted test account (Premium) is configured in the Spotify dashboard. Public use later needs a Spotify quota-extension review (out of scope now).

---

## 15. Data model & persistence

**Fresh start — purge any v2 keys on first load; no migration.** Browser-local only (localStorage).

### 15.1 localStorage keys
| Key | Content |
|---|---|
| `pomodoro-focus-state` | runtime app state: `mode`, `countUp`, selected preset/custom (work + break), active session (timestamps), notes, plan tasks, daily stats |
| `pomodoro-focus-history` | `FocusHistory.days` (per-day `totalFocusSeconds`, `sessionsCount`, 24 hourly `segmentSeconds`) |
| `pomodoro-focus-completed-tasks` | `CompletedTask[]` |
| `pomodoro-focus-settings` | `SettingsState` (sound on/off + volume, music volume, current track, loop, countUp mirror, Spotify connection/tokens) |

On boot: if a legacy/v2 key shape is detected, clear app keys and initialize fresh defaults.

### 15.2 Types (guidance)
```ts
type SessionMode = 'work' | 'break';
type TimerDirection = 'countDown' | 'countUp';
type AppStatus = 'idle' | 'running' | 'paused' | 'complete';

interface TaskItem { id: string; title: string; minutes: number; checked: boolean; order: number; }
interface NoteItem { id: string; text: string; createdAt: string; editedAt?: string; }
interface CompletedTask { id: string; title: string; minutes: number; completedAt: string; }

interface ActiveSession {
  mode: SessionMode; status: 'running' | 'paused';
  startedAt: string; attributedDay: string; initialSeconds: number;
  remainingSeconds: number; pausedAt: string | null; totalPausedSeconds: number;
}
interface DayRecord { dateKey: string; totalFocusSeconds: number; sessionsCount: number; segmentSeconds: number[]; /* len 24 */ }
interface FocusHistory { days: Record<string, DayRecord>; }

interface SettingsState {
  soundEnabled: boolean; soundVolume: number;      // 0–100
  musicVolume: number; activeTrackIndex: number; loop: boolean;
  countUp: boolean;
  spotifyConnected: boolean; spotifyTokens?: { accessToken: string; refreshToken: string; expiresAt: number };
}
interface AppState {
  mode: SessionMode; countUp: boolean;
  selectedWorkPreset: 15 | 20 | 25 | null; customWorkMinutes: number | null;
  selectedBreakPreset: 5 | 10 | 15 | null; customBreakMinutes: number | null;
  customMinutesInputError: string | null;
  notes: NoteItem[]; tasks: TaskItem[];
  activeSession: ActiveSession | null;
  dailyStats: { dateKey: string; focusSeconds: number; sessionsCount: number };
  focusHistory: FocusHistory;
}
```
Wall-clock timestamps (`startedAt`, `pausedAt`, `totalPausedSeconds`, `attributedDay`) and the 24-slot `segmentSeconds` are required.

### 15.3 What persists / clears
- **Persist:** mode, countUp, selections, active session (timestamps), notes, plan tasks, daily stats, focus history, completed tasks, all settings (incl. music + Spotify tokens).
- **On Work New Session after natural completion:** clear that session's notes? **No** — notes are now independent and persist (§7). Clear checked plan tasks (they're in the completed log); keep unchecked plan tasks with their minutes.
- **On Work New Session after Stop:** keep notes; checked tasks already moved to completed log; keep unchecked plan tasks.
- Break sessions never write to history/stats/completed-tasks.

> Architecture note: the implementing agent owns the final persistence shape. Keep concerns separated (runtime vs settings vs history vs completed-tasks) and keep the timer wall-clock-driven. Prefer a single state hook/store as the source of truth (as in v2's `store.ts`).

---

## 16. Build order (single consolidated pass)

Do these in order within one session; each step should leave the app runnable.

1. **Foundation:** tokens → Tailwind theme/CSS vars (DESIGN_V3 §1); fonts (Sora/Inter/JetBrains Mono); base layout, gradients, blurred-orb background; state store skeleton with fresh-start purge.
2. **Header & mode:** brand, Work/Break toggle (+ active-session lock), speaker + gear; mode-driven theming (primary↔teal).
3. **Timer core:** Timer Orb, presets (work 15/20/25 default 25; break 5/10/15 default 5) + custom w/ validation; count down/up (display-only); start/pause/resume/stop/end; wall-clock persistence + restore; tab title.
4. **Work completion / Break Done:** Flow Complete modal (v2 layout, **no FABs**, hours-min format, elapsed-for-stopped); Break Done card.
5. **FABs + Tasks drawer:** Notes/Tasks FABs (badge); Session Plan drawer (add/validate/reorder/delete), active-session checklist + progress.
6. **Completed Tasks:** move-on-check, timestamps, newest-first, Clear-all w/ confirm (no edit/delete/undo).
7. **Notes:** drawer (idle + active Work), timestamps, edit/delete, independent persistence, toggle/click-outside.
8. **Settings screen:** Timer + Sound (master toggle + volume, header speaker sync) + Data & Privacy (clear/export w/ confirm).
9. **Dashboard + footer:** 7-day bar chart, 2×2 stats (incl. Tasks Completed), hourly heatmap (start 9 AM, wrap pre-9am), empty state; expanded SEO footer; hours-min formatting everywhere.
10. **Music:** built-in Lofi player (assets, transport, loop, volume, persistent playback).
11. **Spotify:** PKCE flow, `/callback`, token persistence + silent refresh, connected/disconnected UI, mini-player, Premium message.
12. **Audio:** add Break start/end sounds; gate all on master toggle + sound volume.
13. **Responsive pass:** breakpoints (mobile <640, tablet 640–1024, desktop >1024); FAB/drawer/bottom-sheet behavior; ≥44px touch targets; long-press reorder.
14. **Self-verify:** `npm run build` + `npm run dev` clean; smoke-test core flows; update CLAUDE.md component map; PR with deviations noted.

---

## 17. Acceptance criteria

Tests map to these IDs (TEST_PLAN_V3.md). "Work" = Work mode unless noted.

**Modes**
- AC-1 Header shows a Focus/Break toggle on every screen (labels "Focus" / "Break"); default Focus on fresh load.
- AC-2 Switching to Break swaps presets (5/10/15, default 5m), teal accent, `TAKE A BREATHER`, and hides Tasks/Notes/FABs/stats.
- AC-3 During any running/paused session the toggle is disabled + locked; switching mode is impossible until Stop/End.
- AC-4 Break time is never added to daily stats or focus history; Break never appears in the dashboard.

**Timer**
- AC-5 Work Home Start uses selected preset; default selected is 25m.
- AC-6 Start Focused Session uses the sum of active task minutes; disabled with no valid task.
- AC-7 Count Up shows 0→N, Count Down shows N→0; both end at N; stats/completion identical regardless of direction.
- AC-8 Pause freezes; Resume continues + plays resume sound; no Reset exists.
- AC-9 Closing the tab mid-run and reopening recomputes remaining/elapsed from wall clock; if it would have finished, go straight to completion + increment stats; paused reopen preserves remaining.
- AC-10 Tab title reflects the timer during active/paused (Work + Break).
- AC-11 Work Stop → confirm → Flow Complete; stats not incremented; Focus History updated with elapsed; elapsed (not initial) shown.
- AC-12 Cross-midnight Work session attributes to its start day.

**Tasks / Completed**
- AC-13 Tasks FAB available on Work idle Home only — hidden during running/paused sessions, in Break, and on completion screens; plain round CTA with no badge; the Start Focused Session CTA appears only while idle. Notes FAB remains available during active Work sessions.
- AC-14 Add validates (title + whole minutes ≥1); reorder via drag; delete works; duplicates allowed.
- AC-15 Checking a task during a session moves it to Completed Tasks with timestamp + duration, newest-first.
- AC-16 No per-row edit/delete/undo on completed tasks; only Clear-all with confirm (both Tasks drawer + Settings clear the same log).
- AC-17 Completed tasks persist across refresh and are never auto-cleared.

**Notes**
- AC-18 Notes FAB available on idle Home and during active/paused Work; hidden in Break and on completion screens.
- AC-19 Add (non-empty), edit, delete; per-note timestamps; FAB toggles drawer; click-outside closes; Escape does not.
- AC-20 Notes persist across refresh and all sessions; not cleared by completing/stopping; not attached to tasks/sessions.

**Settings / Audio**
- AC-21 Settings is a full screen via the gear; Timer (direction + session-mode mirror), Sound (toggle + volume), Music, Data & Privacy present.
- AC-22 Sound master toggle reflected by header speaker live; sound volume scales effects; music volume is independent.
- AC-23 Break start + Break end sounds play (distinct from Work), gated on master toggle + volume.
- AC-24 Clear focus history / Clear completed tasks (confirm) wipe the right data; Export downloads JSON of all data.

**Dashboard / Format**
- AC-25 Dashboard renders below the fold on Home (desktop + mobile, scroll), Home-only, with empty state when no data.
- AC-26 7-day bar chart (today emphasized, no Weekly View pill); stats tiles Daily Total / Daily Avg / Weekly Total / Tasks Completed.
- AC-27 Heatmap is 7×16 hourly covering 8 AM–11 PM, every column labeled in full; intensity ∝ per-hour focus seconds (out-of-window hours stored but not shown).
- AC-28 Stopped Work sessions contribute elapsed seconds to bar + heatmap but not to sessions count.
- AC-29 All durations render as `Xh Ym` / `Ym` / `Xh`; no decimals anywhere.

**Music / Spotify**
- AC-30 Built-in lofi player: select/play/pause/next/prev/loop, independent volume, playback persists across state changes.
- AC-31 Spotify disconnected shows Connect; connected shows now-playing + transport + Disconnect + Premium note; token survives refresh via silent refresh.

**Footer / Persistence**
- AC-32 Expanded footer present on Work idle Home with all required sections referencing Pomodoro Focus.
- AC-33 Fresh-start purge: any v2-shaped localStorage is cleared on first load; new keys initialize with defaults.
- AC-34 Daily stats, focus history (≥14 days), completed tasks, settings all persist locally.

---

## 18. Inputs status — all ready
- ✅ Spotify Client ID: `c7de100a24044d0bb37b6ab279dfb028`; redirect URIs registered; Premium test account allowlisted.
- ✅ Lofi audio files: 8 CC0 tracks committed at `app/public/music/` with `manifest.json` + `CREDITS.md` (§13). No external download needed during the build.

---

## 19. Out of scope (v3)
Native iOS/Android apps; server sync / accounts; user-uploaded lofi tracks; initiating Spotify playback for non-Premium users; public Spotify quota-extension review.
