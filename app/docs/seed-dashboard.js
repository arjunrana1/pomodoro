/*
 * Dashboard demo-data seeder — Pomodoro Focus v3
 * --------------------------------------------------
 * Populates realistic Focus History + Completed Tasks so the dashboard can be
 * tested comprehensively WITHOUT running real sessions (TEST_PLAN_V3 §6a).
 *
 * HOW TO USE
 *   1. Open the app at http://127.0.0.1:5173/
 *   2. Open DevTools → Console
 *   3. Paste this whole file, press Enter. It seeds localStorage and reloads.
 *
 * It writes only:
 *   - pomodoro-focus-history          (FocusHistory: { days })
 *   - pomodoro-focus-completed-tasks  (CompletedTask[])
 * Neither key triggers the fresh-start purge, so seeded data survives reload.
 *
 * To clear the seed:  seedDashboard.clear()
 */
(function () {
  const HISTORY_KEY = 'pomodoro-focus-history';
  const COMPLETED_KEY = 'pomodoro-focus-completed-tasks';

  const dateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const daysAgo = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };

  // Distribute a day's focus seconds across realistic hours.
  // profile: array of [hour, weight]. Includes pre-9am + evening to test wrap.
  const spread = (totalSec, profile) => {
    const seg = new Array(24).fill(0);
    const wsum = profile.reduce((s, [, w]) => s + w, 0) || 1;
    for (const [h, w] of profile) seg[h] += Math.round((totalSec * w) / wsum);
    return seg;
  };

  // Per-day plan for the last 14 days (index 0 = today). hours in 24h local time.
  // Mix: a zero day, a peak day, weekends lighter, some early-morning & night usage.
  const H = 3600;
  const plan = [
    { total: 1.6 * H, prof: [[9, 2], [10, 3], [14, 2], [16, 1]] },                 // 0  today
    { total: 2.4 * H, prof: [[9, 2], [10, 2], [11, 2], [15, 2], [17, 1]] },         // 1
    { total: 0.0 * H, prof: [] },                                                   // 2  ZERO day (baseline line)
    { total: 3.5 * H, prof: [[8, 1], [9, 3], [10, 3], [13, 2], [14, 3], [16, 2], [21, 1]] }, // 3 PEAK day (max intensity)
    { total: 1.2 * H, prof: [[10, 2], [11, 2], [15, 1]] },                          // 4
    { total: 0.7 * H, prof: [[22, 2], [23, 1]] },                                   // 5  late-night only
    { total: 1.9 * H, prof: [[9, 2], [12, 2], [14, 2], [18, 1]] },                  // 6
    { total: 1.0 * H, prof: [[7, 2], [8, 2]] },                                     // 7  early-morning (pre-9 wrap)
    { total: 2.1 * H, prof: [[9, 2], [10, 2], [13, 2], [16, 2]] },                  // 8
    { total: 0.5 * H, prof: [[11, 1], [15, 1]] },                                   // 9  light (weekend-ish)
    { total: 1.4 * H, prof: [[9, 1], [10, 2], [14, 2]] },                           // 10
    { total: 2.7 * H, prof: [[8, 1], [9, 2], [11, 3], [14, 2], [20, 1]] },          // 11
    { total: 0.9 * H, prof: [[16, 2], [17, 1]] },                                   // 12
    { total: 1.7 * H, prof: [[9, 2], [10, 1], [13, 2], [15, 1]] },                  // 13
  ];

  const days = {};
  plan.forEach((p, i) => {
    const key = dateKey(daysAgo(i));
    const total = Math.round(p.total);
    days[key] = {
      dateKey: key,
      totalFocusSeconds: total,
      sessionsCount: total === 0 ? 0 : Math.max(1, Math.round(total / 1500)), // ~25-min sessions
      segmentSeconds: spread(total, p.prof),
    };
  });

  // Completed tasks across the last 7 days (drives Tasks Completed tile + drawer log).
  const taskTitles = [
    ['Interview Prep — Conflict question', 25], ['Draft proposal outline', 45],
    ['Review PR #248', 30], ['Outline Q3 roadmap', 50], ['Write blog draft', 40],
    ['Refactor auth module', 35], ['Sync notes from standup', 15], ['Design review feedback', 25],
    ['Email triage', 20], ['Prep demo script', 30], ['Fix dashboard bug', 45],
    ['Read research paper', 25], ['Plan sprint backlog', 35], ['Update changelog', 15],
  ];
  const completed = taskTitles.map(([title, minutes], i) => {
    const d = daysAgo(i % 7);
    d.setHours(9 + (i % 8), (i * 7) % 60, 0, 0);
    return { id: `seed-${i}`, title, minutes, completedAt: d.toISOString() };
  });

  localStorage.setItem(HISTORY_KEY, JSON.stringify({ days }));
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));

  window.seedDashboard = {
    clear() { localStorage.removeItem(HISTORY_KEY); localStorage.removeItem(COMPLETED_KEY); location.reload(); },
  };

  const totalWeek = Object.values(days).slice(0, 7).reduce((s, d) => s + d.totalFocusSeconds, 0);
  console.log('%cSeeded dashboard data', 'color:#6A5AE7;font-weight:bold');
  console.log(`  ${Object.keys(days).length} days of history, ${completed.length} completed tasks`);
  console.log(`  last-7-day total ≈ ${(totalWeek / 3600).toFixed(1)}h. Reloading…`);
  console.log('  run seedDashboard.clear() to remove.');
  setTimeout(() => location.reload(), 600);
})();
