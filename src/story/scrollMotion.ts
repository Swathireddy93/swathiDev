const unit = (value: number) => Math.max(0, Math.min(1, value))
const sine = (value: number) => (1 - Math.cos(Math.PI * unit(value))) / 2

/** Reading cruises evenly, with short acceleration/deceleration ramps. */
export function readingCurve(progress: number, ramp: number): number {
  const p = unit(progress)
  if (p > 1 - ramp) return 1 - readingCurve(1 - p, ramp)
  if (p < ramp) return (p / 2 - ramp * Math.sin(Math.PI * p / ramp) / (2 * Math.PI)) / (1 - ramp)
  return (p - ramp / 2) / (1 - ramp)
}

/** Travel reaches its destination gently, then settles by just a few pixels. */
export function scrollFrame(from: number, to: number, progress: number, anchor: number, reading: boolean, settlePixels: number, readingRamp: number) {
  const p = unit(progress), start = unit(anchor)
  const curve = reading ? (value: number) => readingCurve(value, readingRamp) : (value: number) => sine(value / .84)
  const base = curve(start)
  // Re-anchor on viewport changes without restarting the easing or reading clock.
  const remaining = base < 1 - 1e-6 ? (curve(p) - base) / (1 - base)
    : start < 1 ? (p - start) / (1 - start) : 0
  const portion = unit(remaining)
  const settle = (value: number) => Math.sin(Math.PI * unit((value - .84) / .16)) ** 2
  const bounce = reading || Math.abs(to - from) < 12 ? 0
    : Math.sign(to - from) * settlePixels * (settle(p) - settle(start) * (1 - portion))
  return from + (to - from) * portion + bounce
}
