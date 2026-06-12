# DESIGN_V3 — Pomodoro Focus

Visual source of truth for v3. Pairs with [REQUIREMENTS_V3.md](REQUIREMENTS_V3.md) (behavior) — this file owns **tokens** and the **per-screen visual spec**. Screenshots live in [`reference_designs/v3/`](reference_designs/v3/). When a screenshot and this file disagree, this file's text wins; when this file and REQUIREMENTS_V3 disagree on behavior, REQUIREMENTS_V3 wins.

All tokens below are exported verbatim from the design source (`explore2.0.pen`). Implement them as CSS variables / Tailwind theme tokens. **Do not hardcode hex/px values that exist as a token.**

---

## 1. Design tokens

### 1.1 Brand & semantic colors

| Token | Value | Use |
|---|---|---|
| `--primary` | `#6A5AE7` | Brand purple — Work mode accent, primary CTAs, selected pills |
| `--primary-fixed` | `#5341CD` | Pressed/darker primary |
| `--primary-container` | `#6C5CE7` | Filled primary surfaces |
| `--primary-10/20/30/60` | `#6A5AE7` @ 10/20/30/60% | Tints (rings, hovers, badges) |
| `--break` | `#14B8A6` | Break mode accent (teal) — Break CTAs, orb, toggle |
| `--break-fixed` | `#0E8C7E` | Pressed/darker break |
| `--break-container` | `#CCFBF1` | Filled break surfaces |
| `--break-10/20/30/60` | `#14B8A6` @ 10/20/30/60% | Break tints |
| `--color-success` | `#22C55E` | Completed-task check, "Connected" badge |
| `--color-error` | `#BA1A1A` | Destructive (Clear), FAB badge, validation errors |
| `--color-warning` | `#F59E0B` | Warnings |
| `--color-info` | `#6A5AE7` | Info |

### 1.2 Surfaces & glass

| Token | Value | Use |
|---|---|---|
| `--surface-bg` / `--background` | `#F6F6F8` / `#F6F6F8` | App background base |
| `--surface` / `--card` | `#FCF8FF` | Card base |
| `--surface-container` | `#F0ECF8` | Raised container |
| `--surface-container-low/high/higher` | `#F6F2FE` / `#EBE6F2` / `#E5E0ED` | Container elevation steps |
| `--glass-05 … --glass-95` | white @ 5%→95% | Glass layers. Background→low %, panels/cards→mid (40–70%), modals/drawers→high (70–95%) |
| `--glass-border-10/20/30/40` | white @ 10/20/30/40% | Glass strokes |
| `--border` | `#FFFFFF4D` | Default hairline border |

Glass hierarchy rule: pick opacity by layer — background elements low, sidebars/panels mid + backdrop-blur, cards mid-high, modals/drawers high.

### 1.3 Background gradients & blur orbs

| Token | Value |
|---|---|
| `--gradient-ethereal` | `linear-gradient(135deg, #E0E7FF 0%, #F3E8FF 50%, #E0E7FF 100%)` — Work home/idle |
| `--gradient-session` | `linear-gradient(135deg, #EBEBFF 0%, #E4E1FF 40%, #EEEAFF 70%, #F4F2FF 100%)` — Work active |
| `--gradient-celebration` | `linear-gradient(128.63deg, #FEF3C7 0%, #FCE7F3 50%, #FAE8FF 100%)` — Flow Complete |
| `--gradient-orb-inner` | `linear-gradient(45deg, rgba(106,90,231,0.05) 0%, transparent 50%, rgba(106,90,231,0.10) 100%)` |

Break screens use a teal-tinted variant of the ethereal gradient (`#E0F7F2 → #F3E8FF → #E0E7FF`). Decorative blurred orbs: `--blur-violet #8B5CF6BF`, `--blur-lavender #A78BFA94`, `--blur-pink #EC4899A6`, `--blur-sky #38BDF899`, `--blur-amber #FB923C80`. Break screens swap violet/pink orbs for **teal** (`#5EEAD4` tints).

### 1.4 Typography

Fonts: `--font-primary` **Sora** (headings, timer, UI), `--font-secondary` **Inter** (body), `--font-mono` **JetBrains Mono** (numeric/minute inputs). Load all three from Google Fonts.

| Role | Size | Weight |
|---|---|---|
| Timer — home | 128 | 200 |
| Timer — active | 96 | 900 |
| Timer — complete | 60 | — |
| H1 | 36 | 700 |
| H2 | 20 | 700 |
| Button | 18 | 700 |
| Body | 16 | 500 |
| Body sm | 14 | — |
| Caption | 12 | 600 |
| Rail label | 11 | 700 |
| Micro | 10 | — |

Section labels (e.g. `ADD TASK`, `CURRENT BREAKDOWN`, `SAVED NOTES`, `READY TO START?`, `FOCUS FLOW`, `TAKE A BREATHER`) are uppercase, letter-spaced, caption/rail size, muted color.

### 1.5 Spacing, radius, sizing

- Spacing scale: `--sp-1`=4, `-2`=8, `-3`=12, `-4`=16, `-6`=24, `-8`=32, `-10`=40, `-12`=48.
- Radius: `--radius-sm`=4, `-md`=8, `-lg`=12, `-m`/`-xl`=16, `-2xl`=24, `-full`/`-pill`=9999.
- Orb sizes: `--orb-home`=480, `--orb-active`=420 (desktop). Mobile orbs scale to ~viewport width (≈320 on a 390 frame).
- `--sidebar-width`=320 (drawer width); `--edge-strip`=60.

### 1.6 Text colors

`--foreground`/`--text-body` `#2D3436`, `--text-darkest` `#0F172A`, `--text-dark` `#1E293B`, `--text-secondary` `#334155`, `--text-tertiary` `#475569`, `--text-muted`/`--muted-foreground` `#64748B`, `--text-placeholder` `#94A3B8`, `--text-divider` `#CBD5E1`.

### 1.7 Shadows, motion

- Shadows: `--shadow-card`, `--shadow-orb`, `--shadow-orb-glow`, `--shadow-button-cta`, `--shadow-button-primary`, `--shadow-break-cta`, `--shadow-break-orb`, `--shadow-logo`, `--shadow-input`, `--shadow-inset-orb` (values in the token export; match approximately, not pixel-perfect).
- Motion: `--dur-quick` 150ms, `--dur-base`/`--dur-drawer` 300ms. Easing `--ease-fluid` `cubic-bezier(0.25,0.46,0.45,0.94)`, `--ease-spring` `cubic-bezier(0.34,1.56,0.64,1)`. Drawers open/close on `--dur-drawer` + `--ease-fluid`.

Fidelity note: match look and hierarchy closely, not pixel-perfectly. Exact blur/glow/gradient values may be approximated.

---

## 2. Global chrome

**Header (all screens).** Brand mark (logo + "Pomodoro Focus") top-left. **Work / Break segmented toggle** center (desktop) — pill, glass-40 track, selected segment filled (Work=primary, Break=break-teal). **Sound (speaker) icon** + **Settings (gear) icon** top-right. During an active session the toggle is **disabled/greyed** with a lock glyph (see REQUIREMENTS_V3 §3). On mobile the toggle becomes a full-width pill below the brand (Break/idle) — see per-screen notes.

**FABs.** Circular floating buttons: **Notes FAB** bottom-left (`--glass-70`, notes/edit icon), **Tasks FAB** bottom-right (`--primary` filled, checklist icon, `--color-error` count **badge** top-right). Reusable components `FAB · Notes` and `FAB · Tasks (with badge)`. Present on Home (idle), Dashboard, and active Work session. **Hidden in Break mode and on Flow Complete / Break Done.**

---

## 3. Per-screen spec

Each entry: `reference image` → purpose → key elements.

### 3.1 `Home — Desktop (Focus mode).jpg`
Work idle home. Ethereal gradient bg + blurred orbs. Header with Work/Break toggle (Work selected), gear + speaker. Center **Timer Orb** (glass-40, 480) showing `25:00`, subtitle `READY TO START?`, duration pills `15m 20m 25m +` (25m selected by default — see REQUIREMENTS §4), primary CTA **Start Session ▷**, daily stats row beneath (`0h` / `FOCUS TIME TODAY`, `0` / `SESSIONS`). Notes FAB bottom-left, Tasks FAB bottom-right. Below the fold (scroll): Focus History dashboard, then marketing footer.

### 3.2 `A · Home — Mobile (idle, FABs).jpg`
Mobile Work idle. Brand top-left, speaker top-right. Orb `25:00`, `READY TO START?`, pills `15m 20m 25m +` (25m selected), **Start Session ▷**, stats (`0h FOCUS TIME` / `0 SESSIONS`). Notes FAB bottom-left (white glass), Tasks FAB bottom-right (purple, badge `3`).

### 3.3 `Home — Mobile (Break mode).jpg`
Mobile Break idle. Teal-tinted bg + teal orb glow. Brand (teal dot) + speaker. **Work/Break toggle pill** below brand (Break selected, teal). Orb `05:00`, subtitle `TAKE A BREATHER`, break pills `5m 10m 15m +` (5m selected, default), CTA **Start Break ▷** (teal). **No daily stats, no FABs** (Tasks/Notes hidden in Break).

### 3.4 `Active Break — Desktop.jpg`
Desktop Break running. Teal gradient. Header toggle shows Break selected but **disabled+lock** (active session). Teal orb (running, glow) `03:42`, subtitle `TAKE A BREATHER`, controls **End** (outline) + **Pause** (teal filled). No tasks/notes/FABs.

### 3.5 `Break Done — Desktop.jpg`
Break completion. Centered glass card: small clock icon, heading **Break Done**, subtext **You took 5 minutes to recharge** (duration reflects actual break length), CTA **Start Focus Session** (primary). Gear top-right. No FABs. (This is the Break analog of Flow Complete.)

### 3.6 `D · Active Session — Mobile.jpg`
Mobile Work running. Brand top-left, `SESSION ACTIVE` badge top-right. Orb `19:57`, `FOCUS FLOW`. Controls **Pause** + **Stop**. Below: `SESSION PLAN` header with progress `3 of 5 · 1h 30m`, task checklist rows (circle checkbox · title · minute pill), `+2 more ⌄` expander. Notes FAB bottom-left. (Desktop Work active session is not separately drawn — adapt v2's desktop active layout with the new header chrome + hours-min format.)

### 3.7 `B · Tasks Panel — Mobile drawer.jpg`  (component `Tasks Panel — Mobile drawer`)
Session Plan / Tasks drawer (glass-70, backdrop-blur, radius-2xl). Header: checklist icon + **Session Plan** title + `✕` close. **ADD TASK** label → `Enter task title` input. **TIME (MINUTES)** label → `00` input (mono). **＋ Add Task** button. **CURRENT BREAKDOWN** + `15m total` pill → active task rows (drag handle ⠿ · circle checkbox · title · `Scheduled for N min` subtext · `15m` pill). **COMPLETED TASKS** + `5 done` pill → completed rows (green ✓ · title · `Jun 11 · 14:32` timestamp · `25 min` duration). **Clear Completed Tasks** button (error-outline). Bottom CTA **▷ Start Focused Session** (primary).

### 3.8 `C · Notes Panel — Mobile drawer.jpg`  (component `Notes Panel — Mobile drawer`)
Notes drawer (glass-70). Header: edit icon + **Notes** + `✕`. **ADD NOTE** → `Capture a thought…` textarea. **＋ Add Note** button. **SAVED NOTES** + count pill → note cards (`Today · 2:14 PM` timestamp · note text · edit ✎ + delete 🗑 icons).

### 3.9 `E · Desktop — FAB + Drawer (Tasks open).jpg`
Desktop with Session Plan drawer open (left, 320 wide) over a dimmed home; demonstrates drawer-over-content + scrim. Same drawer contents as §3.7.

### 3.10 `Data Dashboard — Desktop.jpg`
Focus History dashboard (below-the-fold on Home; on both desktop and mobile via scroll — no separate route). Centered **Focus History** title. **7-Day Activity** bar chart card (label `Hours · Minutes`; day initials `S M T W T F`; bars annotated `1h 24m`, `18m`, `1h 48m`; today emphasized). **Stats grid** 2×2: **DAILY TOTAL** `0h 0m`, **DAILY AVG** `0h 36m`, **WEEKLY TOTAL** `4h 6m`, **TASKS COMPLETED** `4`. **7-Day Focus Heatmap — Hourly** card: 7 day-rows × hourly columns starting **9a** (`9a 10a … 12a 1a`), range label `9 AM – 1 AM`, pre-9am hours wrap to the end; `Less ▢▢▢ More` legend. FABs present.

### 3.11 `Settings — Desktop.jpg` / `Settings — Mobile.jpg`
Full **Settings** screen (not a modal), reached via header gear. Centered **⚙ Settings** title. Four cards:
- **Timer** ("Control how the focus timer counts.") — **Timer Direction** `[Count Down | Count Up]` (Count Down default); **Session Mode** `[Work | Break]` (mirrors header toggle).
- **Sound** ("Chimes and audio feedback.") — **Sound Effects** toggle (on); **Sound Volume** slider `70%`.
- **Music** ("Background music for your focus sessions.") — **LOFI LIBRARY · BUILT-IN** track list (title · artist · duration; selected row highlighted) with transport `⏮ ⏯ ⏭ 🔁` + music volume slider; **Spotify Connect** sub-panel (connected: now-playing + transport + Disconnect + "Playback control requires Spotify Premium"; disconnected: see §3.12).
- **Data & Privacy** ("Manage the data stored on this device.") — **Clear focus history** (Clear, destructive), **Clear completed tasks** (Clear, destructive), **Export data (JSON)** (Export).

### 3.12 `Spotify Widget — Disconnected.jpg`  (component)
Spotify panel, disconnected state: `SPOTIFY · NOT CONNECTED` caption, green Spotify mark + **Spotify Connect** + `Not connected` badge, copy "Connect your Spotify account to control playback right from Settings.", green **Connect Spotify** button, footnote "Playback control requires Spotify Premium."

### 3.13 `header.jpg`
Isolated header component reference (brand left, controls right) — see §2.

---

## 4. Components inventory (reusable)

From the design file: **Timer Orb**, **FAB · Notes**, **FAB · Tasks (with badge)**, **Tasks Panel — Mobile drawer**, **Notes Panel — Mobile drawer**, plus header **Mode Toggle**, duration **pills**, primary/secondary **buttons**, **stat tile**, **task row** (active + completed variants), **note card**, **settings card/section**, **toggle switch**, **slider**, **track row**, **Spotify panel** (connected/disconnected). Build these as shared components so Work/Break variants are prop-driven (accent = primary vs break).
