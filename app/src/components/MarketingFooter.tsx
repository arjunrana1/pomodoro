/**
 * Expanded SEO marketing footer (REQUIREMENTS_V3 §12). Static, Home-only,
 * below the dashboard. Keyword-aware but written for humans.
 */
export default function MarketingFooter() {
  return (
    <footer className="relative w-full bg-white/60 backdrop-blur-sm border-t border-white/40">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-16">
        <Section title="What is Pomodoro Focus?">
          <p className="text-sm text-slate-600 leading-relaxed">
            Pomodoro Focus is a free pomodoro timer and focus timer designed to help you work with
            intention. Choose a focus duration, plan your tasks, put on some lofi focus music, and let
            the timer keep you accountable — all within a calming, distraction-free interface. Whether
            you need a study timer for exam prep, a work timer for deep focus sessions, or a simple
            break timer to recharge, Pomodoro Focus keeps your productivity on track.
          </p>
        </Section>

        <Section title="What is the Pomodoro Technique?">
          <p className="text-sm text-slate-600 leading-relaxed">
            The Pomodoro Technique is a time management method developed by Francesco Cirillo. It uses
            a timer to break work into focused intervals — traditionally 25 minutes — separated by
            short breaks. Each interval is called a "pomodoro," named after the tomato-shaped kitchen
            timer Cirillo used as a university student. Decades later it remains one of the most
            effective productivity techniques for studying, writing, programming, and any deep work.
          </p>
        </Section>

        <Section title="How to Use Pomodoro Focus">
          <ol className="text-sm text-slate-600 leading-relaxed space-y-2 list-decimal list-inside">
            <li>Choose a focus duration (15, 20, or 25 minutes) or set a custom time</li>
            <li>Pick your timer style in Settings — count down to zero or count up from zero</li>
            <li>Optionally plan your session: add tasks with time estimates in the Session Plan</li>
            <li>Click "Start Session" and focus on your work — check off tasks as you finish them</li>
            <li>When the timer ends, switch to Break mode and take a 5, 10, or 15 minute breather</li>
            <li>Review your progress in the Focus History dashboard and start your next session</li>
          </ol>
        </Section>

        <Section title="Focus & Break Sessions">
          <p className="text-sm text-slate-600 leading-relaxed">
            Pomodoro Focus has two modes: <span className="font-semibold text-slate-700">Work</span> and{' '}
            <span className="font-semibold text-slate-700">Break</span>. Work sessions are your focused
            pomodoro intervals — they're tracked in your daily stats and focus history. Break sessions
            are a separate break timer with 5, 10, and 15 minute presets that never touch your stats.
            Regular breaks are what make the Pomodoro Technique sustainable: stepping away briefly
            restores attention, prevents burnout, and makes your next focus session sharper. Use the
            Work/Break toggle in the header to switch any time between sessions.
          </p>
        </Section>

        <Section title="Tasks & Session Planning">
          <p className="text-sm text-slate-600 leading-relaxed">
            The built-in task planner turns the timer into a session planning tool. Add tasks with
            minute estimates, drag them into the order you'll do them, and the Session Plan builds a
            focused session from the total — your personal breakdown of the work ahead. Check tasks
            off mid-session and they move into the Completed Tasks log with a timestamp, so you can
            look back on exactly what you accomplished and when. It's a lightweight to-do list built
            for time-boxed, productive work.
          </p>
        </Section>

        <Section title="Focus Music">
          <p className="text-sm text-slate-600 leading-relaxed">
            Music helps many people slip into flow faster. Pomodoro Focus ships with a built-in lofi
            library — eight chill, royalty-free lo-fi tracks perfect as study music or background focus
            music, with play/pause, skip, loop, and an independent volume control. Prefer your own
            playlists? Connect Spotify and control your focus or study playlist right from Settings
            without leaving the timer (playback control requires Spotify Premium).
          </p>
        </Section>

        <Section title="Features" last>
          <ul className="text-sm text-slate-600 leading-relaxed space-y-3">
            <Feature name="Flexible Timer">
              Preset focus durations (15, 20, 25 min) or any custom length that fits your workflow.
            </Feature>
            <Feature name="Count Up / Count Down">
              Watch time remaining tick down to zero, or count up from zero — your choice, same session.
            </Feature>
            <Feature name="Work & Break Modes">
              A dedicated break timer with 5/10/15 minute presets alongside your pomodoro work sessions.
            </Feature>
            <Feature name="Session Planning">
              Plan tasks with time estimates before you begin so every focus session has a purpose.
            </Feature>
            <Feature name="Completed Tasks">
              Every task you check off is logged with a timestamp — a running record of what you've done.
            </Feature>
            <Feature name="Session Notes">
              Capture ideas, blockers, or reminders while you work without breaking your flow.
            </Feature>
            <Feature name="Daily Tracking">
              See your total focus time and number of sessions completed today at a glance.
            </Feature>
            <Feature name="Focus History Heatmap">
              A 7-day dashboard with an hourly heatmap showing when you do your best focused work.
            </Feature>
            <Feature name="Lofi & Spotify Music">
              Built-in lofi focus music plus Spotify Connect for your own study playlists.
            </Feature>
            <Feature name="Session Summary">
              Review your completed and pending tasks after each session to see your progress.
            </Feature>
            <Feature name="Sound Cues">
              Audio feedback for start, pause, resume, stop, and completion so you can stay heads-down.
            </Feature>
          </ul>
        </Section>

        <div className="text-center pt-6 border-t border-slate-200/60">
          <p className="text-xs text-slate-400">Pomodoro Focus — free online pomodoro timer</p>
        </div>
      </div>
    </footer>
  )
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? 'mb-10' : 'mb-12'}>
      <h3 className="text-xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>{title}</h3>
      <div className="w-8 h-0.5 bg-primary/40 mb-4" />
      {children}
    </section>
  )
}

function Feature({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <li>
      <span className="font-semibold text-slate-700">{name}</span>
      <span className="text-slate-400 mx-1.5">—</span>
      {children}
    </li>
  )
}
