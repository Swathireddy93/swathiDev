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
    Object.assign(b.camera, { x: camera.startX, y: 0, zoom: camera.startZoom })
    b.character.position.set(c.x, c.hiddenY)
    b.character.scale.set(c.scale)
    b.portrait.texture = b.poses.neutral
    const timeline = gsap.timeline({ onUpdate: b.onFrame, onComplete: b.onComplete })
    this.timeline = timeline
    timeline
      .call(() => b.onStage('mountains'), [], 0)
      .to(b.camera, { x: camera.endX, zoom: camera.endZoom, duration: t.duration, ease: 'sine.inOut' }, 0)
      .call(() => b.onStage('peeking'), [], t.peekAt)
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
        b.onStage('settled')
      }, [], t.jumpAt + t.jumpUp + t.jumpDown)
      .to(b.character.scale, { x: c.scale * 1.04, y: c.scale * 0.96, duration: 0.12, yoyo: true, repeat: 1 }, t.jumpAt + t.jumpUp + t.jumpDown)
      .call(() => { b.onFade(); b.audio.fadeOut(t.fadeOut * 1000) }, [], t.duration - t.fadeOut)
  }
  pause() { this.timeline?.pause() }
  resume() { this.timeline?.resume() }
  dispose() {
    this.timeline?.kill()
    this.timeline = null
  }
}
