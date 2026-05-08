let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch { /* AudioContext blocked (e.g. autoplay policy) — silent fallback */ }
}

export function playClickSound() {
  playTone(800, 0.08, 'sine', 0.1)
}

export function playStartSound() {
  playTone(523, 0.15, 'sine', 0.15)
  setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 100)
  setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 200)
}

export function playPauseSound() {
  playTone(440, 0.15, 'sine', 0.12)
}

export function playResumeSound() {
  playTone(523, 0.12, 'sine', 0.12)
  setTimeout(() => playTone(659, 0.16, 'sine', 0.12), 90)
}

export function playStopSound() {
  playTone(500, 0.12, 'sine', 0.1)
  setTimeout(() => playTone(350, 0.2, 'sine', 0.1), 100)
}

export function playCompletionSound() {
  const notes = [523, 659, 784, 1047, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.6, 'sine', 0.18), i * 600)
  })
}
