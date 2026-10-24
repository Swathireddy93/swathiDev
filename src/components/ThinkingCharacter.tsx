import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { PixelFigure } from './PixelFigure'

/** Bee's Knees: planted feet, knees in/out and hands crossing between the knees. */
export function ThinkingCharacter({ reducedMotion }: { reducedMotion: boolean }) {
  const container = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const leftLeg = useRef<SVGPathElement>(null), rightLeg = useRef<SVGPathElement>(null)
  const leftArm = useRef<SVGPathElement>(null), rightArm = useRef<SVGPathElement>(null)
  const leftHand = useRef<SVGRectElement>(null), rightHand = useRef<SVGRectElement>(null)
  useEffect(() => {
    const element = container.current
    if (!element) return
    const motion = { phase: 0 }
    const render = () => {
      const swing = Math.sin(motion.phase), cross = (1 + Math.cos(motion.phase)) / 2
      const bob = 3 + Math.sin(motion.phase * 2)
      const kneeY = 82 + Math.cos(motion.phase * 2)
      const leftKnee = 19 + swing * 6, rightKnee = 29 - swing * 6
      const leftTarget = leftKnee * (1 - cross) + rightKnee * cross
      const rightTarget = rightKnee * (1 - cross) + leftKnee * cross
      const leg = (hip: number, knee: number, ankle: number) => `M${hip - 3},${66 + bob} L${knee - 3},${kneeY} L${ankle - 3},94 H${ankle + 3} L${knee + 3},${kneeY} L${hip + 3},${66 + bob}Z`
      body.current?.setAttribute('transform', `translate(0 ${bob})`)
      leftLeg.current?.setAttribute('d', leg(19, leftKnee, 18))
      rightLeg.current?.setAttribute('d', leg(29, rightKnee, 30))
      leftArm.current?.setAttribute('d', `M14,${44 + bob} L12,${63 + bob} L${leftTarget},${kneeY - 2}`)
      rightArm.current?.setAttribute('d', `M34,${44 + bob} L36,${63 + bob} L${rightTarget},${kneeY - 2}`)
      for (const [hand, x] of [[leftHand.current, leftTarget], [rightHand.current, rightTarget]] as const) {
        hand?.setAttribute('x', String(x - 3)); hand?.setAttribute('y', String(kneeY - 4))
      }
    }
    render()
    const dance = reducedMotion ? null : gsap.to(motion, { phase: Math.PI * 2, duration: 2.4, repeat: -1, ease: 'none', paused: true, onUpdate: render })
    let visible = false
    const sync = () => {
      const active = visible && !document.hidden
      element.setAttribute('data-motion-active', String(active))
      if (active) dance?.resume(); else dance?.pause()
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() }, { threshold: .2 })
    observer.observe(element)
    document.addEventListener('visibilitychange', sync)
    return () => { dance?.kill(); observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [reducedMotion])
  return <div ref={container} className="thinking-character" data-motion-active="false" aria-hidden="true">
    <div className="bees-knees-dancer">
      <span className="thinking-question question-one">?</span>
      <span className="thinking-question question-two">?</span>
      <svg className="thinking-figure" viewBox="0 0 64 104" focusable="false" shapeRendering="crispEdges">
        <g transform="translate(8 4)">
          <path ref={leftLeg} className="bees-knee-left" fill="#293331" />
          <path ref={rightLeg} className="bees-knee-right" fill="#35413d" />
          <g ref={body}><PixelFigure glasses hideLimbs /></g>
          <g fill="none" strokeWidth="6" strokeLinejoin="round">
            <path ref={leftArm} className="bees-arm-left" stroke="#456c68" />
            <path ref={rightArm} className="bees-arm-right" stroke="#527c76" />
          </g>
          <rect ref={leftHand} width="6" height="6" fill="#b48b62" />
          <rect ref={rightHand} width="6" height="6" fill="#cfad87" />
          <path className="bees-foot" d="M12 93h12v4H12zm15 0h12v4H27z" fill="#14201d" />
        </g>
      </svg>
    </div>
  </div>
}
