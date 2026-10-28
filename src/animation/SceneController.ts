import { gsap } from 'gsap'
import type { Container, Sprite, Texture } from 'pixi.js'
import type { AudioManager } from '../audio/AudioManager'
import { experience } from '../config/experience'
import type { CameraState } from './camera'

export interface SceneBindings {
  camera: CameraState
  character: Container
  portrait: Sprite
  poses: { neutral: Texture; blink: Texture; jump: Texture }
  thought: { element: HTMLDivElement; text: HTMLSpanElement }
  onFrame: () => void
  onStage: (stage: string) => void
  onComplete: () => void
  onFade: () => void
  audio: AudioManager
}

export class SceneController {
  private timeline: gsap.core.Timeline | null = null
  private bindings: SceneBindings
  constructor(bindings: SceneBindings) { this.bindings = bindings }
  play() {
    this.dispose()
    const b = this.bindings
    const { timing: t, character: c, camera } = experience
    const thought = experience.introThought
    // Keep emoji intact instead of revealing half of a UTF-16 surrogate pair.
    const message = Array.from(thought.lines.join('\n'))
    const typing = { count: 0 }
    const floating = { seconds: 0 }
    let previousCount = 0
    const typeAt = t.approachAt + thought.appearSeconds
    const readAt = typeAt + message.length * thought.letterSeconds
    const fadeAt = readAt + thought.readSeconds
    const approachAt = fadeAt + thought.fadeSeconds
    const delay = approachAt - t.approachAt
    const povAt = t.povAt + delay
    const duration = t.duration + delay
    b.thought.text.textContent = ''
    b.thought.element.dataset.state = 'hidden'
    b.thought.element.style.setProperty('--thought-bob', '0px')
    gsap.set(b.thought.element, { autoAlpha: 0, y: 10, scale: .975 })
    Object.assign(b.camera, { x: camera.startX, y: 0, zoom: camera.startZoom, focus: 0, cloudDrift: 0 })
    b.character.position.set(c.x, c.hiddenY)
    b.character.scale.set(c.scale)
    b.character.alpha = 0
    b.portrait.texture = b.poses.neutral
    const timeline = gsap.timeline({ onUpdate: b.onFrame, onComplete: b.onComplete })
    this.timeline = timeline
    timeline
      .to(b.camera, { cloudDrift: experience.atmosphere.cloudTravelPixels, duration, ease: 'none' }, 0)
      .call(() => b.onStage('mountains'), [], 0)
      .to(b.camera, { x: camera.endX, zoom: camera.endZoom, duration: t.approachAt, ease: 'sine.inOut' }, 0)
      .call(() => b.onStage('peeking'), [], t.peekAt)
      .set(b.character, { alpha: 1 }, t.peekAt)
      .to(b.character, { y: c.peekY, duration: t.peekDuration, ease: 'power2.out' }, t.peekAt)
      .call(() => { b.portrait.texture = b.poses.blink }, [], t.blinkAt)
      .call(() => { b.portrait.texture = b.poses.neutral }, [], t.blinkAt + 0.14)
      .to(b.character.scale, { x: c.scale * 1.05, y: c.scale * 0.92, duration: 0.16 }, t.jumpAt - 0.16)
      .call(() => {
        b.onStage('jumping')
        b.portrait.texture = b.poses.jump
        b.audio.cue('jump')
      }, [], t.jumpAt)
      .to(b.character.scale, { x: c.scale, y: c.scale, duration: 0.12 }, t.jumpAt)
      .to(b.character, { y: c.jumpY, duration: t.jumpUp, ease: 'power2.out' }, t.jumpAt)
      .to(b.character, { y: c.landY, duration: t.jumpDown, ease: 'power2.in' }, t.jumpAt + t.jumpUp)
      .call(() => {
        b.portrait.texture = b.poses.neutral
        b.audio.cue('land')
        b.onStage('settled')
      }, [], t.jumpAt + t.jumpUp + t.jumpDown)
      .to(b.character.scale, { x: c.scale * 1.04, y: c.scale * 0.96, duration: 0.12, yoyo: true, repeat: 1 }, t.jumpAt + t.jumpUp + t.jumpDown)
      .call(() => b.onStage('peeking-again'), [], t.duckAt)
      .to(b.character, { y: c.hiddenY + 40, duration: 0.45, ease: 'power2.in' }, t.duckAt)
      .to(b.character, { y: c.landY, duration: 0.65, ease: 'back.out(1.2)' }, t.peekAgainAt)
      .call(() => { b.onStage('thought'); b.thought.element.dataset.state = 'typing' }, [], t.approachAt)
      .to(b.thought.element, { autoAlpha: 1, y: 0, scale: 1, duration: thought.appearSeconds, ease: 'power2.out' }, t.approachAt)
      .to(floating, { seconds: delay, duration: delay, ease: 'none', onUpdate: () => {
        const bob = -Math.sin(floating.seconds / thought.floatSeconds * Math.PI * 2) * thought.floatPixels
        b.thought.element.style.setProperty('--thought-bob', `${bob}px`)
      } }, t.approachAt)
      .to(typing, { count: message.length, duration: message.length * thought.letterSeconds, ease: 'none', onUpdate: () => {
        const count = Math.floor(typing.count)
        if (count === previousCount) return
        b.thought.text.textContent = message.slice(0, count).join('')
        if (/\S/.test(message[count - 1])) b.audio.cue('type', count)
        previousCount = count
      } }, typeAt)
      .call(() => { b.thought.element.dataset.state = 'reading' }, [], readAt)
      .call(() => { b.thought.element.dataset.state = 'fading'; b.audio.cue('swoosh') }, [], fadeAt)
      .to(b.thought.element, { autoAlpha: 0, y: -6, duration: thought.fadeSeconds, ease: 'power1.in' }, fadeAt)
      .call(() => { b.thought.element.dataset.state = 'hidden'; b.onStage('approaching') }, [], approachAt)
      .to(b.camera, { x: 0, y: 115, zoom: 3.8, focus: 1, duration: t.approachDuration, ease: 'power2.inOut' }, approachAt)
      .call(() => b.onStage('pov'), [], povAt)
      .to(b.character, { alpha: 0, duration: 0.25 }, povAt)
      .to(b.camera, { zoom: 4.6, duration: t.duration - t.povAt, ease: 'power2.in' }, povAt)
      .call(b.onFade, [], duration - t.fadeOut)
    for (const offset of t.approachBlinks) {
      timeline
        .call(() => { b.portrait.texture = b.poses.blink; b.audio.cue('blink') }, [], approachAt + offset)
        .call(() => { b.portrait.texture = b.poses.neutral }, [], approachAt + offset + t.blinkDuration)
    }
  }
  pause() { this.timeline?.pause(); this.bindings.audio.stopCue('blink') }
  resume() { this.timeline?.resume() }
  dispose() {
    this.timeline?.kill()
    this.timeline = null
    this.bindings.audio.stopCue('type')
    this.bindings.audio.stopCue('swoosh')
    this.bindings.audio.stopCue('blink')
  }
}
