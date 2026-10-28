interface Timer {
  callback: () => void
  remaining: number
  repeat?: number
  started: number
  handle?: number
}

/** Decorative timers share the movie's pause without losing their remaining time. */
export class PlaybackTimers {
  private timers = new Map<number, Timer>()
  private next = 0
  private paused = document.documentElement.classList.contains('is-story-paused')
  constructor() { document.addEventListener('portfolio:playback', this.sync) }
  private sync = () => {
    const paused = document.documentElement.classList.contains('is-story-paused')
    if (paused === this.paused) return
    this.paused = paused
    for (const [id, timer] of this.timers) {
      if (paused) {
        timer.remaining = Math.max(0, timer.remaining - (performance.now() - timer.started))
        window.clearTimeout(timer.handle)
      } else this.arm(id, timer)
    }
  }
  private arm(id: number, timer: Timer) {
    if (this.paused) return
    timer.started = performance.now()
    timer.handle = window.setTimeout(() => {
      if (timer.repeat === undefined) this.timers.delete(id)
      timer.callback()
      if (timer.repeat !== undefined && this.timers.has(id)) {
        timer.remaining = timer.repeat
        this.arm(id, timer)
      }
    }, timer.remaining)
  }
  timeout(callback: () => void, milliseconds: number, repeat?: number) {
    const id = ++this.next
    const timer = { callback, remaining: milliseconds, repeat, started: performance.now() }
    this.timers.set(id, timer); this.arm(id, timer)
    return id
  }
  interval(callback: () => void, milliseconds: number) { return this.timeout(callback, milliseconds, milliseconds) }
  clear(id: number | undefined) {
    if (id === undefined) return
    window.clearTimeout(this.timers.get(id)?.handle)
    this.timers.delete(id)
  }
  dispose() {
    for (const id of this.timers.keys()) this.clear(id)
    document.removeEventListener('portfolio:playback', this.sync)
  }
}
