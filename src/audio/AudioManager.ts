import { Howl, Howler } from 'howler'

type Cue = 'mountain' | 'jump'
interface AudioState {
  muted: boolean
  volume: number
  status: 'idle' | 'loading' | 'playing' | 'muted' | 'error'
  message: string
}
const cues = {
  mountain: { src: `${import.meta.env.BASE_URL}audio/temporary-mountain-ambient.wav`, loop: true },
  jump: { src: `${import.meta.env.BASE_URL}audio/temporary-jump.wav`, loop: false },
} satisfies Record<Cue, { src: string; loop: boolean }>

export class AudioManager {
  private sounds = new Map<Cue, Howl>()
  private listeners = new Set<() => void>()
  private active = false
  private state: AudioState = { muted: true, volume: 0.35, status: 'idle', message: '' }
  private fadeTimer: ReturnType<typeof setTimeout> | undefined

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  snapshot = () => this.state
  private update(next: Partial<AudioState>) {
    this.state = { ...this.state, ...next }
    this.listeners.forEach((listener) => listener())
  }
  private sound(cue: Cue) {
    let sound = this.sounds.get(cue)
    if (!sound) {
      const { src, loop } = cues[cue]
      sound = new Howl({
        src: [src], loop, volume: 0, preload: true,
        onloaderror: () => this.fail(cue),
        onplayerror: () => this.fail(cue),
        onplay: () => {
          if (!this.active) { sound?.stop(); return }
          if (cue === 'mountain') {
            sound?.mute(this.state.muted)
            sound?.fade(0, this.state.volume, 700)
            this.update({ status: this.state.muted ? 'muted' : 'playing' })
          }
        },
      })
      this.sounds.set(cue, sound)
    }
    return sound
  }
  private fail(cue: Cue) {
    this.sounds.get(cue)?.stop()
    if (cue === 'mountain') {
      this.update({ muted: true, status: 'error', message: 'Sound couldn’t start. You can continue muted or try the sound control again.' })
    }
  }
  /** Call directly inside a click/keyboard event, before any asynchronous work. */
  enable = () => {
    clearTimeout(this.fadeTimer)
    this.active = true
    this.update({ muted: false, status: 'loading', message: '' })
    const ambient = this.sound('mountain')
    this.sound('jump')
    // Howler creates its context above. Resuming here retains the user gesture.
    if (Howler.ctx?.state === 'suspended') void Howler.ctx.resume().catch(() => this.fail('mountain'))
    ambient.mute(false)
    ambient.volume(this.state.volume)
    if (!ambient.playing()) ambient.play()
    else this.update({ status: 'playing' })
  }
  mute = () => {
    this.sounds.forEach((sound) => sound.mute(true))
    this.update({ muted: true, status: 'muted' })
  }
  setVolume = (volume: number) => {
    const value = Math.min(1, Math.max(0, volume))
    this.sounds.forEach((sound, cue) => sound.volume(value * (cue === 'jump' ? 0.45 : 1)))
    this.update({ volume: value })
  }
  cue = (cue: Cue) => {
    if (!this.active || this.state.muted) return
    const sound = this.sound(cue)
    sound.volume(this.state.volume * 0.45)
    sound.play()
  }
  fadeOut = (milliseconds = 500) => {
    clearTimeout(this.fadeTimer)
    this.sounds.forEach((sound) => sound.fade(sound.volume(), 0, milliseconds))
    this.fadeTimer = setTimeout(() => this.stop(), milliseconds)
  }
  stop = () => {
    clearTimeout(this.fadeTimer)
    this.active = false
    this.sounds.forEach((sound) => { sound.stop(); sound.mute(true) })
    this.update({ muted: true, status: 'idle', message: '' })
  }
  dispose = () => {
    this.stop()
    this.sounds.forEach((sound) => sound.unload())
    this.sounds.clear()
  }
}
