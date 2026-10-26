import { useEffect, useRef, type CSSProperties } from 'react'
import { gsap } from 'gsap'
import { experience } from '../config/experience'
import { PixelFigure } from './PixelFigure'

/** A complete out-and-back walk, with a quiet thinking pause at each end. */
export function ThinkingCharacter({ reducedMotion }: { reducedMotion: boolean }) {
  const container = useRef<HTMLDivElement>(null)
  const traveler = useRef<HTMLDivElement>(null)
  const figure = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const element = container.current, actor = traveler.current, sprite = figure.current
    if (!element || !actor || !sprite) return
    const leftLeg = sprite.querySelector<SVGGElement>('.figure-leg-left')!
    const rightLeg = sprite.querySelector<SVGGElement>('.figure-leg-right')!
    const leftArm = sprite.querySelector<SVGGElement>('.figure-arm-left')!
    const rightArm = sprite.querySelector<SVGGElement>('.figure-arm-right')!
    const motion = { position: reducedMotion ? .5 : 0, step: 0, facing: 1 }
    let distance = Math.max(0, element.clientWidth - 60)
    const render = () => {
      const stride = Math.sin(motion.step)
      gsap.set(actor, { x: distance * motion.position })
      gsap.set(sprite, { scaleX: motion.facing, y: -Math.abs(stride) * 1.2 })
      leftLeg.style.rotate = `${stride * 12}deg`
      rightLeg.style.rotate = `${-stride * 12}deg`
      leftArm.style.rotate = `${-stride * 8}deg`
      rightArm.style.rotate = `${stride * 8}deg`
    }
    const state = (thinking: boolean, direction: string) => {
      element.setAttribute('data-walk-state', thinking ? 'thinking' : 'walking')
      element.setAttribute('data-walk-direction', direction)
    }
    render()
    state(reducedMotion, 'right')
    const timeline = reducedMotion ? null : gsap.timeline({ paused: true, repeat: -1, onUpdate: render })
    if (timeline) {
      const leg = (position: number, step: number, facing: number, direction: string) => {
        timeline.call(() => { motion.facing = facing; state(false, direction) })
        const start = timeline.duration()
        timeline.to(motion, { position, duration: experience.guide.thinkingWalkSeconds, ease: 'sine.inOut' }, start)
          .to(motion, { step, duration: experience.guide.thinkingWalkSeconds, ease: 'none' }, start)
          .call(() => state(true, direction))
          .to({}, { duration: experience.guide.thinkingPauseSeconds })
      }
      leg(1, Math.PI * 8, 1, 'right')
      leg(0, Math.PI * 16, -1, 'left')
    }
    let visible = false
    const sync = () => {
      const active = visible && !document.hidden
      element.setAttribute('data-motion-active', String(active))
      if (active) timeline?.resume(); else timeline?.pause()
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() }, { threshold: .2 })
    const resize = new ResizeObserver(() => { distance = Math.max(0, element.clientWidth - 60); render() })
    observer.observe(element); resize.observe(element)
    document.addEventListener('visibilitychange', sync)
    return () => { timeline?.kill(); observer.disconnect(); resize.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [reducedMotion])
  return <div ref={container} className="thinking-character" data-motion-active="false" aria-hidden="true" style={{ '--thinking-pause': `${experience.guide.thinkingPauseSeconds}s` } as CSSProperties}>
    <div ref={traveler} className="thinking-traveler">
      <span className="thinking-question question-one">?</span>
      <span className="thinking-question question-two">?</span>
      <span className="thinking-question question-three">?</span>
      <svg ref={figure} className="thinking-figure" viewBox="0 0 48 80" focusable="false" shapeRendering="crispEdges"><PixelFigure walking glasses /></svg>
    </div>
  </div>
}
