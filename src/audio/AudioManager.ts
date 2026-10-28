import { Howl, Howler } from 'howler'
import { experience } from '../config/experience'
import { LoopingMusic } from './LoopingMusic'

type Cue = 'mountain' | 'jump' | 'land' | 'bubble' | 'glass' | 'peek' | 'shutter' | 'type' | 'swoosh' | 'blink' | 'bye'
interface AudioState {
  muted: boolean
  volume: number
  status: 'idle' | 'loading' | 'playing' | 'muted' | 'error'
  message: string
  lastCue: '' | Exclude<Cue, 'mountain'>
}
const cues = {
  mountain: { src: `${import.meta.env.BASE_URL}audio/portfolio-background-loop.mp3`, loop: true },
  jump: { src: `${import.meta.env.BASE_URL}audio/temporary-jump.wav`, loop: false },
  glass: { src: `${import.meta.env.BASE_URL}audio/glass-reveal.wav`, loop: false },
  peek: { src: `${import.meta.env.BASE_URL}audio/menu-bubble.wav`, loop: false },
  bubble: { src: `${import.meta.env.BASE_URL}audio/menu-bubble.wav`, loop: false },
  land: { src: `${import.meta.env.BASE_URL}audio/temporary-land.wav`, loop: false },
  shutter: { src: `${import.meta.env.BASE_URL}audio/camera-shutter.wav`, loop: false },
  type: { src: `${import.meta.env.BASE_URL}audio/thought-type.wav`, loop: false },
  swoosh: { src: `${import.meta.env.BASE_URL}audio/thought-swoosh.wav`, loop: false },
  blink: { src: `${import.meta.env.BASE_URL}audio/character-blink.wav`, loop: false },
  bye: { src: `${import.meta.env.BASE_URL}audio/character-bye.wav`, loop: false },
} satisfies Record<Cue, { src: string; loop: boolean }>

export class AudioManager {
  private sounds = new Map<Cue, Howl | LoopingMusic>()
  private listeners = new Set<() => void>()
  private active = false
  private ambientId: number | undefined
  private autoplayPending = false
  private state: AudioState = { muted: true, volume: experience.audio.musicVolume, status: 'idle', message: '', lastCue: '' }
  private fadeTimer: ReturnType<typeof setTimeout> | undefined
  private duckTimer: ReturnType<typeof setTimeout> | undefined
  private farewellId: number | undefined
  private musicFinished = false

  sayBye = () => {
    if (!this.active || this.state.muted || this.state.status !== 'playing') return
    this.stopBye()
    this.cue('bye')
  }
  stopBye = () => { this.stopCue('bye') }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  snapshot = () => this.state
  private update(next: Partial<AudioState>) {
    this.state = { ...this.state, ...next }
    this.listeners.forEach((listener) => listener())
  }
  /** Preload short effects and register touch unlock before the first gesture. */
  prepare = () => { this.sound('jump'); this.sound('land'); this.sound('bubble'); this.sound('glass'); this.sound('peek'); this.sound('shutter'); this.sound('type'); this.sound('swoosh'); this.sound('blink'); this.sound('bye') }
  startOnLoad = () => {
    this.autoplayPending = true
    this.startPlayback()
  }
  resumeOnInteraction = () => {
    if (this.autoplayPending) this.enable()
  }
  private sound(cue: 'mountain'): LoopingMusic
  private sound(cue: Exclude<Cue, 'mountain'>): Howl
  private sound(cue: Cue) {
    let sound = this.sounds.get(cue)
    if (!sound) {
      if (cue === 'mountain') {
        sound = new LoopingMusic(cues.mountain.src, {
          onplay: () => {
            if (!this.active || this.musicFinished) { sound?.stop(); return }
            this.autoplayPending = false
            sound?.mute(this.state.muted)
            sound?.fade(0, this.state.volume, 700)
            this.update({ status: this.state.muted ? 'muted' : 'playing', message: '' })
          },
          onplayerror: error => {
            if (this.musicFinished) return
            if (this.autoplayPending && error instanceof DOMException && error.name === 'NotAllowedError' && this.state.status !== 'error') this.update({ muted: true, status: 'muted', message: '' })
            else this.fail('mountain')
          },
          onloaderror: () => {
            if (!this.active || this.musicFinished) return
            this.autoplayPending = false
            this.update({ muted: true, status: 'error', message: 'Sound couldn’t start. Tap the speaker to try again.' })
          },
        })
        this.sounds.set(cue, sound)
        return sound
      }
      const { src, loop } = cues[cue]
      sound = new Howl({
        src: [src], loop, volume: 0,
        html5: false, preload: true,
        onloaderror: () => {
          sound?.unload()
          this.sounds.delete(cue)
          if (cue === 'bye') { this.farewellId = undefined; this.restoreMusic() }
          this.fail(cue)
        },
        onplayerror: id => {
          if (cue === 'bye' && this.farewellId === id) { this.farewellId = undefined; this.restoreMusic() }
          this.fail(cue)
        },
        onend: id => {
          if (cue === 'bye' && this.farewellId === id) { this.farewellId = undefined; this.restoreMusic() }
        },
        onplay: () => {
          if (!this.active) { sound?.stop(); return }
          this.update({ lastCue: cue })
        },
      })
      this.sounds.set(cue, sound)
    }
    return sound
  }
  private fail(cue: Cue) {
    if (cue === 'mountain' && this.active && !this.state.muted) {
      this.update({ status: 'error', message: 'Sound couldn’t start. Tap the speaker to try again.' })
    }
  }
  private retryAfterUnlock(sound: Howl | LoopingMusic) {
    if (!this.active || this.musicFinished || this.state.muted || this.state.status !== 'error' || this.sounds.get('mountain') !== sound) return
    this.update({ status: 'loading', message: '' })
    this.ambientId = sound.play(this.ambientId)
  }
  /** Call directly inside a click/keyboard event, before any asynchronous work. */
  enable = () => {
    this.autoplayPending = false
    this.startPlayback()
  }
  private startPlayback() {
    clearTimeout(this.fadeTimer)
    clearTimeout(this.duckTimer)
    this.active = true
    this.update({ muted: false, status: 'loading', message: '' })
    const ambient = this.sound('mountain')
    this.sound('jump')
    // Howler creates its context above. Resuming here retains the user gesture.
    const context = Howler.ctx
    // iOS may report "interrupted" as well as "suspended" after app switching.
    if (context && context.state !== 'running' && context.state !== 'closed') {
      void context.resume().then(() => this.retryAfterUnlock(ambient)).catch(() => this.fail('mountain'))
    }
    this.sounds.forEach((sound) => sound.mute(false))
    if (this.musicFinished) { this.update({ status: 'playing' }); return }
    ambient.volume(this.state.volume)
    if (!ambient.playing(this.ambientId)) this.ambientId = ambient.play(this.ambientId)
    else this.update({ status: 'playing' })
  }
  mute = () => {
    this.stopBye()
    this.autoplayPending = false
    clearTimeout(this.duckTimer)
    this.sounds.forEach((sound) => sound.mute(true))
    this.sounds.get('mountain')?.volume(this.state.volume)
    this.update({ muted: true, status: 'muted', message: '' })
  }
  /** Restart the selected music segment without changing mute or requesting playback. */
  restartMusic = () => {
    const finished = this.musicFinished
    this.musicFinished = false
    const ambient = this.sounds.get('mountain')
    if (this.active && ambient) {
      ambient.seek(0, this.ambientId)
      if (finished) this.ambientId = ambient.play()
    }
  }
  /** Finish the soundtrack without suppressing the one-shot farewell or later UI cues. */
  finishMusic = () => {
    this.musicFinished = true
    this.autoplayPending = false
    clearTimeout(this.duckTimer)
    this.sounds.get('mountain')?.stop()
    this.ambientId = undefined
  }
  stopCue = (cue: Exclude<Cue, 'mountain'>) => {
    const sound = this.sounds.get(cue)
    const restore = cue === 'bye' && this.farewellId !== undefined
    if (cue === 'bye') this.farewellId = undefined
    sound?.stop()
    if (restore) this.restoreMusic()
  }
  cue = (cue: Exclude<Cue, 'mountain'>, index = 0) => {
    if (!this.active || this.state.muted || this.state.status !== 'playing') return
    const sound = this.sound(cue)
    sound.mute(false)
    sound.volume(cue === 'bye' ? experience.audio.farewellVolume : cue === 'blink' ? experience.audio.blinkVolume : cue === 'type' ? experience.audio.typeVolume : cue === 'swoosh' ? experience.audio.swooshVolume : cue === 'shutter' ? experience.audio.shutterVolume : cue === 'peek' ? 0.24 : cue === 'glass' ? 0.3 : cue === 'bubble' ? 0.55 : cue === 'jump' ? experience.audio.jumpVolume : experience.audio.landVolume)
    if (cue === 'type') sound.rate(0.96 + index % 3 * .04)
    if (cue === 'bubble' || cue === 'peek') sound.rate(cue === 'peek' ? 0.72 + index * 0.025 : 0.9 + index * 0.07)
    const id = sound.play()
    if (cue === 'bye') { this.farewellId = id; this.duckMusic(experience.audio.farewellDuckTo, experience.audio.farewellDuckHoldMs) }
    else if (cue === 'blink') this.duckMusic(experience.audio.blinkDuckTo, experience.audio.blinkDuckHoldMs)
    else if (cue === 'jump' || cue === 'land') this.duckMusic(experience.audio.duckTo, experience.audio.duckHoldMs)
  }
  private restoreMusic = () => {
    clearTimeout(this.duckTimer)
    const ambient = this.sounds.get('mountain')
    if (this.active && !this.state.muted && !this.musicFinished) ambient?.fade(ambient.volume(), this.state.volume, experience.audio.restoreMs)
  }
  private duckMusic(ratio: number, holdMs: number) {
    if (this.musicFinished) return
    clearTimeout(this.duckTimer)
    const ambient = this.sounds.get('mountain')
    ambient?.fade(ambient.volume(), this.state.volume * ratio, 80)
    // A bounded fallback restores music even if a cue is interrupted by the device.
    this.duckTimer = setTimeout(this.restoreMusic, holdMs)
  }
  fadeOut = (milliseconds = 500) => {
    clearTimeout(this.fadeTimer)
    clearTimeout(this.duckTimer)
    this.sounds.forEach((sound) => sound.fade(sound.volume(), 0, milliseconds))
    this.fadeTimer = setTimeout(() => this.stop(), milliseconds)
  }
  stop = () => {
    this.stopBye()
    clearTimeout(this.fadeTimer)
    clearTimeout(this.duckTimer)
    this.active = false
    this.autoplayPending = false
    this.ambientId = undefined
    this.sounds.forEach((sound) => { sound.stop(); sound.mute(true) })
    this.update({ muted: true, status: 'idle', message: '' })
  }
  dispose = () => {
    this.stop()
    this.sounds.forEach((sound) => sound.unload())
    this.sounds.clear()
  }
}
