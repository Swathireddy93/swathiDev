import { Howl, Howler } from 'howler'
import { experience } from '../config/experience'
import { LoopingMusic } from './LoopingMusic'

type Cue = 'mountain' | 'jump' | 'land' | 'bubble' | 'glass' | 'peek' | 'shutter' | 'type' | 'swoosh'
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
  private farewell: SpeechSynthesisUtterance | undefined

  sayBye = () => {
    if (!this.active || this.state.muted || this.state.status !== 'playing' || !('speechSynthesis' in window)) return
    this.stopBye()
    const voice = new SpeechSynthesisUtterance('Bye!')
    voice.lang = 'en-US'; voice.pitch = 1.25; voice.rate = 1.05; voice.volume = this.state.volume
    const available = window.speechSynthesis.getVoices()
    voice.voice = available.find(item => item.lang === 'en-US' && item.localService) ?? available.find(item => item.lang.startsWith('en')) ?? null
    this.farewell = voice
    window.speechSynthesis.speak(voice)
  }
  stopBye = () => {
    if (this.farewell && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    this.farewell = undefined
  }

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
  prepare = () => { this.sound('jump'); this.sound('land'); this.sound('bubble'); this.sound('glass'); this.sound('peek'); this.sound('shutter'); this.sound('type'); this.sound('swoosh') }
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
            if (!this.active) { sound?.stop(); return }
            this.autoplayPending = false
            sound?.mute(this.state.muted)
            sound?.fade(0, this.state.volume, 700)
            this.update({ status: this.state.muted ? 'muted' : 'playing', message: '' })
          },
          onplayerror: error => {
            if (this.autoplayPending && error instanceof DOMException && error.name === 'NotAllowedError' && this.state.status !== 'error') this.update({ muted: true, status: 'muted', message: '' })
            else this.fail('mountain')
          },
          onloaderror: () => {
            if (!this.active) return
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
          this.fail(cue)
        },
        onplayerror: () => {
          this.fail(cue)
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
    if (!this.active || this.state.muted || this.state.status !== 'error' || this.sounds.get('mountain') !== sound) return
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
    if (this.active && this.ambientId !== undefined) this.sounds.get('mountain')?.seek(0, this.ambientId)
  }
  stopCue = (cue: Exclude<Cue, 'mountain'>) => { this.sounds.get(cue)?.stop() }
  cue = (cue: Exclude<Cue, 'mountain'>, index = 0) => {
    if (!this.active || this.state.muted || this.state.status !== 'playing') return
    const sound = this.sound(cue)
    sound.mute(false)
    sound.volume(cue === 'type' ? experience.audio.typeVolume : cue === 'swoosh' ? experience.audio.swooshVolume : cue === 'shutter' ? experience.audio.shutterVolume : cue === 'peek' ? 0.24 : cue === 'glass' ? 0.3 : cue === 'bubble' ? 0.55 : cue === 'jump' ? experience.audio.jumpVolume : experience.audio.landVolume)
    if (cue === 'type') sound.rate(0.96 + index % 3 * .04)
    if (cue === 'bubble' || cue === 'peek') sound.rate(cue === 'peek' ? 0.72 + index * 0.025 : 0.9 + index * 0.07)
    sound.play()
    if (cue !== 'jump' && cue !== 'land') return
    const ambient = this.sounds.get('mountain')
    ambient?.fade(ambient.volume(), this.state.volume * experience.audio.duckTo, 80)
    clearTimeout(this.duckTimer)
    this.duckTimer = setTimeout(() => {
      if (this.active && !this.state.muted) ambient?.fade(ambient.volume(), this.state.volume, experience.audio.restoreMs)
    }, experience.audio.duckHoldMs)
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
