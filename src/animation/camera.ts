import type { Container } from 'pixi.js'
import { experience } from '../config/experience'

export interface CameraState { x: number; y: number; zoom: number }

/** A cover camera with deliberate portrait framing, not a second animation system. */
export function positionCamera(root: Container, camera: CameraState, width: number, height: number) {
  const { world } = experience
  const scale = Math.max(width / world.width, height / world.height) * camera.zoom
  const focusX = width / height < 0.95 ? 315 : world.width / 2
  root.scale.set(scale)
  root.position.set(width / 2 - (focusX + camera.x) * scale, height / 2 - (world.height / 2 + camera.y) * scale)
}
