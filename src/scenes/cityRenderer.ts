/** A deterministic pixel-art city with perspective projection, not a 3D engine. */
import { experience } from '../config/experience'
export interface FlightCamera { progress: number }
const palette = { forest: '#0d0e10', teal: '#191b1e', plum: '#42464b', amber: '#bfc4ca', cream: '#f1f2f3' }
interface Building { x: number; z: number; w: number; d: number; h: number; seed: number; landmark?: boolean }
const buildings: Building[] = Array.from({ length: 60 }, (_, index) => {
  const row = Math.floor(index / 6)
  const slot = index % 6
  return { x: (slot < 3 ? -1 : 1) * (21 + (slot % 3) * 24), z: 50 + row * 43,
    w: 12 + index % 5, d: 15, h: 32 + (index * 17) % 60, seed: index }
})
buildings.push({ x: 8, z: 505, w: 18, d: 18, h: 108, seed: 80, landmark: true })
buildings.push({ x: -25, z: 460, w: 14, d: 14, h: 79, seed: 81, landmark: true })
// Four distinct rooftops at different heights and depths, split across the city.
const searchlightBuildings = new Set([42, 47, 55, 80])

export function drawCity(ctx: CanvasRenderingContext2D, progress: number, lightSeconds = 0, lensAlignment = 0) {
  const w = 480, h = 270
  const p = Math.max(0, Math.min(1, progress))
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = palette.teal; ctx.fillRect(0, 0, w, h)
  const bands = ['#08090b', '#0c0d10', '#111317', '#17191d', '#1e2126', '#282c32']
  bands.forEach((color, index) => { ctx.fillStyle = color; ctx.fillRect(0, index * 20, w, 21) })
  // Fixed pixel stars and a cratered moon: no flicker during camera movement.
  for (let i = 0; i < 57; i++) {
    const x = (i * 83 + 19) % w, y = (i * 37 + 11) % 88;
    if (Math.hypot(x - 365, y - 43) < 25) continue
    ctx.fillStyle = i % 4 ? '#707680' : '#d8dce1'; ctx.fillRect(x, y, 1, 1)
    if (i % 17 === 0) { ctx.fillStyle = '#5a6069'; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3) }
  }
  ctx.fillStyle = '#282c33';
  for (let y = -22; y <= 22; y += 2) {
    const half = Math.floor(Math.sqrt(484 - y * y)); ctx.fillRect(365 - half, 43 + y, half * 2, 2)
  }
  for (let y = -15; y <= 15; y++) {
    const half = Math.floor(Math.sqrt(225 - y * y));
    ctx.fillStyle = y < -8 ? '#c5c9ce' : '#e4e6e9'; ctx.fillRect(365 - half, 43 + y, half * 2, 1)
  }
  for (const [x, y, size] of [[358, 36, 4], [368, 48, 5], [373, 38, 3], [359, 50, 2]]) {
    ctx.fillStyle = '#a0a6ae'; ctx.fillRect(x, y, size, size - 1)
    ctx.fillStyle = '#c2c7ce'; ctx.fillRect(x + 1, y + size - 1, size - 1, 1)
  }
  const horizon = 100 + Math.max(0, p - .8) * 60
  ctx.fillStyle = '#16191d'
  for (let x = 0; x < w; x += 3) {
    const height = 5 + Math.round(7 * Math.sin(x / 37) + 4 * Math.sin(x / 11))
    ctx.fillRect(x, 101 - height, 3, 18 + height)
  }
  ctx.fillStyle = '#101318'; ctx.fillRect(0, 112, w, h - 112)
  for (let y = 116; y < h; y += 6) {
    ctx.fillStyle = y % 12 ? '#22272e' : '#2d343e'
    ctx.fillRect(0, y, w, 1)
    ctx.fillStyle = y % 3 ? '#a6b0bf55' : '#e2e7ef88'
    ctx.fillRect(320 + (y % 19), y, 65 - y % 23, 1)
  }
  // Bay Bridge silhouette during the approach.
  ctx.strokeStyle = '#919191'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(35, 122); ctx.lineTo(260, 122); ctx.stroke()
  for (const x of [90, 204]) {
    ctx.fillStyle = palette.forest; ctx.fillRect(x, 94, 4, 33)
    ctx.beginPath(); ctx.moveTo(x - 54, 122); ctx.lineTo(x + 2, 95); ctx.lineTo(x + 58, 122); ctx.stroke()
  }
  const cameraZ = -155 + p * 420
  const cameraY = 56 - Math.sin(p * Math.PI) * 20
  const cameraX = Math.sin(p * Math.PI * 2) * 2.5
  const project = (x: number, y: number, z: number): [number, number] => {
    const scale = 230 / Math.max(8, z - cameraZ)
    return [Math.round(w / 2 + (x - cameraX) * scale), Math.round(horizon - (y - cameraY) * scale)]
  }
  const polygon = (points: [number, number][], color: string) => {
    ctx.fillStyle = color; ctx.beginPath()
    points.forEach(([x, y], index) => { if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
    ctx.closePath(); ctx.fill()
  }
  if (p > .22) {
    polygon([project(-13, 0, cameraZ + 10), project(13, 0, cameraZ + 10), project(13, 0, 600), project(-13, 0, 600)], '#0a0b0e')
    ctx.strokeStyle = '#91919180'
    for (let z = 65; z < 600; z += 24) {
      if (z - cameraZ < 12) continue
      const a = project(0, .1, z), b = project(0, .1, z + 9)
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke()
    }
  }
  for (const building of [...buildings].sort((a, b) => b.z - a.z)) {
    const { x, z, d, h: height, w: width, seed } = building
    if (z - cameraZ < 12) continue
    const near = 230 / (z - cameraZ)
    const left = x - width / 2, right = x + width / 2
    // A few roof-mounted searchlights sweep slowly. Drawing in depth order lets
    // nearer buildings naturally hide the beams; the low-resolution canvas
    // keeps their edges in the same pixel grid as the skyline.
    if (searchlightBuildings.has(seed)) {
      const [sx, sy] = project(x, height + (building.landmark ? 10 : 1), z + d / 2)
      if (sx > -40 && sx < w + 40 && sy > -10 && sy < h) {
        const phase = lightSeconds / experience.atmosphere.searchlightCycleSeconds * Math.PI * 2 + seed
        const reach = Math.min(110, Math.max(32, 70 * near))
        // On arrival, one beam turns toward the camera to motivate the lens glow.
        const aim = seed === 80 ? Math.max(0, Math.min(1, lensAlignment)) : 0
        const sweepX = sx + Math.sin(phase) * reach * .55
        const tipX = sweepX + (w * .52 - sweepX) * aim
        const tipY = sy - reach + (h * .43 - (sy - reach)) * aim
        const spread = Math.max(6, Math.min(18, reach * .16)) + aim * 26
        const glow = ctx.createLinearGradient(sx, sy, tipX, tipY)
        glow.addColorStop(0, '#f1f2f32e'); glow.addColorStop(.5, '#f1f2f314'); glow.addColorStop(1, '#f1f2f300')
        ctx.fillStyle = glow; ctx.beginPath(); ctx.moveTo(sx - 1, sy); ctx.lineTo(tipX - spread, tipY)
        ctx.lineTo(tipX + spread, tipY); ctx.lineTo(sx + 1, sy); ctx.closePath(); ctx.fill()
        ctx.fillStyle = '#f1f2f3b3'; ctx.fillRect(sx - 1, sy, 2, 1)
      }
    }
    const front = [project(left, 0, z), project(right, 0, z), project(right, height, z), project(left, height, z)]
    const side = x < 0 ? [project(right, 0, z), project(right, 0, z + d), project(right, height, z + d), project(right, height, z)]
      : [project(left, 0, z), project(left, 0, z + d), project(left, height, z + d), project(left, height, z)]
    polygon(side, seed % 2 ? '#101216' : '#171a1f')
    polygon(front, seed % 3 ? '#24282e' : '#30353c')
    polygon([project(left, height, z), project(right, height, z), project(right, height, z + d), project(left, height, z + d)], '#535b66')
    if (building.landmark) {
      polygon([project(left, height, z), project(right, height, z), project(x, height + (seed % 2 ? 23 : 9), z + d / 2)], '#919191')
    }
    // Narrow reflective glass strips and illuminated roof lines, without smooth blur.
    if (seed % 3 === 0) polygon([project(left + width * .2, 0, z - .02), project(left + width * .3, 0, z - .02), project(left + width * .3, height, z - .02), project(left + width * .2, height, z - .02)], '#434b56')
    ctx.strokeStyle = seed % 2 ? '#8993a0' : '#bdc5cf';
    ctx.beginPath(); ctx.moveTo(...project(left, height, z)); ctx.lineTo(...project(right, height, z)); ctx.stroke()
    const windowSize = Math.max(1, Math.round(near * .65))
    for (let floor = 3; floor < height - 2; floor += 3.5) {
      for (let column = 2; column < width - 1; column += 2.7) {
        if ((Math.floor(floor) * 7 + Math.floor(column) * 3 + seed) % 7 > 3) continue
        const [sx, sy] = project(left + column, floor, z - .1)
        if (sx < -5 || sx > w + 5 || sy < -5 || sy > h + 5) continue
        ctx.fillStyle = (seed + Math.floor(floor)) % 3 ? palette.amber : '#f5f7fa'
        ctx.fillRect(sx, sy, windowSize, Math.max(1, Math.round(near * 1.1)))
      }
    }
  }
  // The last approach settles onto a roof; this frame becomes the portfolio backdrop.
  if (p > .82) {
    const rise = Math.min(1, (p - .82) / .18)
    const y = 270 - rise * 70
    polygon([[0, 270], [480, 270], [378, y], [102, y]], '#15181c')
    ctx.fillStyle = palette.amber; ctx.fillRect(102, y, 276, 3)
    ctx.fillStyle = '#39414c'; ctx.fillRect(108, y + 3, 264, 4)
    ctx.strokeStyle = '#63636366'
    for (let x = 36; x < 480; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 270); ctx.lineTo(240 + (x - 240) * .55, y + 8); ctx.stroke()
    }
  }
}
