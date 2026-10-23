/** A deterministic pixel-art city with perspective projection, not a 3D engine. */
export interface FlightCamera { progress: number }
const palette = { forest: '#172522', teal: '#456c68', plum: '#77717a', amber: '#b48b62', cream: '#e8dfcb' }
interface Building { x: number; z: number; w: number; d: number; h: number; seed: number; landmark?: boolean }
const buildings: Building[] = Array.from({ length: 60 }, (_, index) => {
  const row = Math.floor(index / 6)
  const slot = index % 6
  return { x: (slot < 3 ? -1 : 1) * (21 + (slot % 3) * 24), z: 50 + row * 43,
    w: 12 + index % 5, d: 15, h: 20 + (index * 17) % 43, seed: index }
})
buildings.push({ x: 8, z: 505, w: 18, d: 18, h: 108, seed: 80, landmark: true })
buildings.push({ x: -25, z: 460, w: 14, d: 14, h: 79, seed: 81, landmark: true })

export function drawCity(ctx: CanvasRenderingContext2D, progress: number) {
  const w = 480, h = 270
  const p = Math.max(0, Math.min(1, progress))
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = palette.teal; ctx.fillRect(0, 0, w, h)
  const bands = ['#223b37', '#385551', '#526663', '#77717a', '#948374', '#b48b62']
  bands.forEach((color, index) => { ctx.fillStyle = color; ctx.fillRect(0, index * 20, w, 21) })
  ctx.fillStyle = '#d0b38b'
  for (let y = -13; y <= 13; y += 2) {
    const half = Math.floor(Math.sqrt(169 - y * y))
    ctx.fillRect(365 - half, 73 + y, half * 2, 2)
  }
  const horizon = 100 + Math.max(0, p - .8) * 60
  ctx.fillStyle = '#45605a'
  for (let x = 0; x < w; x += 3) {
    const height = 5 + Math.round(7 * Math.sin(x / 37) + 4 * Math.sin(x / 11))
    ctx.fillRect(x, 101 - height, 3, 18 + height)
  }
  ctx.fillStyle = '#385551'; ctx.fillRect(0, 112, w, h - 112)
  for (let y = 116; y < h; y += 6) {
    ctx.fillStyle = y % 12 ? '#456c68' : '#55736b'
    ctx.fillRect(0, y, w, 1)
    ctx.fillStyle = '#b48b6266'
    ctx.fillRect(320 + (y % 19), y, 65 - y % 23, 1)
  }
  // Bay Bridge silhouette during the approach.
  ctx.strokeStyle = '#b48b62'; ctx.lineWidth = 1
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
    polygon([project(-13, 0, cameraZ + 10), project(13, 0, cameraZ + 10), project(13, 0, 600), project(-13, 0, 600)], '#233633')
    ctx.strokeStyle = '#b48b6280'
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
    const front = [project(left, 0, z), project(right, 0, z), project(right, height, z), project(left, height, z)]
    const side = x < 0 ? [project(right, 0, z), project(right, 0, z + d), project(right, height, z + d), project(right, height, z)]
      : [project(left, 0, z), project(left, 0, z + d), project(left, height, z + d), project(left, height, z)]
    polygon(side, seed % 2 ? '#263e39' : '#304b45')
    polygon(front, seed % 3 ? '#38534c' : '#53605e')
    polygon([project(left, height, z), project(right, height, z), project(right, height, z + d), project(left, height, z + d)], '#77717a')
    if (building.landmark) {
      polygon([project(left, height, z), project(right, height, z), project(x, height + (seed % 2 ? 23 : 9), z + d / 2)], '#b48b62')
    }
    const windowSize = Math.max(1, Math.round(near * .65))
    for (let floor = 3; floor < height - 2; floor += 3.5) {
      for (let column = 2; column < width - 1; column += 2.7) {
        if ((Math.floor(floor) * 7 + Math.floor(column) * 3 + seed) % 5 > 1) continue
        const [sx, sy] = project(left + column, floor, z - .1)
        if (sx < -5 || sx > w + 5 || sy < -5 || sy > h + 5) continue
        ctx.fillStyle = (seed + Math.floor(floor)) % 3 ? palette.amber : '#e8dfcb'
        ctx.fillRect(sx, sy, windowSize, Math.max(1, Math.round(near * 1.1)))
      }
    }
  }
  // The last approach settles onto a roof; this frame becomes the portfolio backdrop.
  if (p > .82) {
    const rise = Math.min(1, (p - .82) / .18)
    const y = 270 - rise * 70
    polygon([[0, 270], [480, 270], [378, y], [102, y]], '#263a35')
    ctx.fillStyle = palette.amber; ctx.fillRect(102, y, 276, 3)
    ctx.fillStyle = '#456c68'; ctx.fillRect(108, y + 3, 264, 4)
    ctx.strokeStyle = '#456c6866'
    for (let x = 36; x < 480; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 270); ctx.lineTo(240 + (x - 240) * .55, y + 8); ctx.stroke()
    }
  }
}
