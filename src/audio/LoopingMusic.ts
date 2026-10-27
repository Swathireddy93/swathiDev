interface MusicCallbacks {
  onplay: () => void
  onplayerror: (error: unknown) => void
  onloaderror: () => void
}

/** Stream a pre-trimmed track with browser-owned looping, independent of JS timers. */
export class LoopingMusic {
  private element: HTMLAudioElement
  private fadeTimer: ReturnType<typeof setInterval> | undefined
  private attempt = 0

  constructor(src: string, private callbacks: MusicCallbacks) {
    this.element = new Audio(src)
    this.element.loop = true
    this.element.preload = 'auto'
    this.element.volume = 0
    this.element.addEventListener('error', this.loadError)
  }
  private loadError = () => this.callbacks.onloaderror()
  play(_spriteOrId?: string | number) {
    const attempt = ++this.attempt
    void _spriteOrId
    if (this.element.error) this.element.load()
    void this.element.play().then(() => {
      if (attempt === this.attempt) this.callbacks.onplay()
    }).catch((error: unknown) => {
      if (attempt === this.attempt) this.callbacks.onplayerror(error)
    })
    return 1
  }
  playing(_id?: number) { void _id; return !this.element.paused && !this.element.ended }
  mute(muted: boolean) { this.element.muted = muted; return this }
  volume(): number
  volume(value: number): this
  volume(value?: number) {
    if (value === undefined) return this.element.volume
    clearInterval(this.fadeTimer)
    this.setVolume(value)
    return this
  }
  private setVolume(value: number) { this.element.volume = Math.max(0, Math.min(1, value)) }
  fade(from: number, to: number, duration: number) {
    clearInterval(this.fadeTimer)
    this.setVolume(from)
    if (duration <= 0) { this.setVolume(to); return this }
    const started = performance.now()
    this.fadeTimer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / duration)
      this.setVolume(from + (to - from) * progress)
      if (progress === 1) clearInterval(this.fadeTimer)
    }, 25)
    return this
  }
  seek(): number
  seek(position: number, id?: number): this
  seek(position?: number, _id?: number) {
    void _id
    if (position === undefined) return this.element.currentTime
    this.element.currentTime = position
    return this
  }
  stop() {
    this.attempt++
    clearInterval(this.fadeTimer)
    this.element.pause()
    this.element.currentTime = 0
    return this
  }
  unload() {
    this.stop()
    this.element.removeEventListener('error', this.loadError)
    this.element.removeAttribute('src')
    this.element.load()
    return this
  }
}
