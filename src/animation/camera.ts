import type { Container } from 'pixi.js'
import { experience } from '../config/experience'

export interface CameraState { x: number; y: number; zoom: number; focus?: number; cloudDrift?: number }

/** Anchor the floating glass dialogue to the same transformed pixel character. */
export function positionThoughtCloud(bubble: HTMLDivElement, root: Container, character: Container, width: number) {
  const headX = root.x + character.x * root.scale.x
  const headY = root.y + (character.y - 80 * character.scale.y) * root.scale.y
  const left = Math.max(16, Math.min(width - bubble.offsetWidth - 16, headX - bubble.offsetWidth * .3))
  bubble.style.left = `${left}px`
  bubble.style.top = `${Math.max(108, headY - bubble.offsetHeight - 18)}px`
  bubble.style.setProperty('--thought-tail', `${Math.max(20, Math.min(bubble.offsetWidth - 28, headX - left))}px`)
}

/** A cover camera with deliberate portrait framing, not a second animation system. */
export function positionCamera(root: Container, camera: CameraState, width: number, height: number) {
  const { world } = experience
  const scale = Math.max(width / world.width, height / world.height) * camera.zoom
  const initialFocus = width / height < 0.95 ? 315 : world.width / 2
  const focusX = initialFocus + (experience.character.x - initialFocus) * (camera.focus ?? 0)
  root.scale.set(scale)
  root.position.set(width / 2 - (focusX + camera.x) * scale, height / 2 - (world.height / 2 + camera.y) * scale)
}
