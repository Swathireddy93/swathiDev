import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { experience, type IntroPhase } from '../config/experience'

/** Persists across the city/menu handoff so the same light reveals the menu. */
export function LandingLensFlare({ target, phase, reducedMotion }: {
  target: RefObject<HTMLDivElement | null>; phase: IntroPhase; reducedMotion: boolean
}) {
  useEffect(() => {
    const element = target.current
    if (!element || phase === 'flight') return
    if (phase !== 'portfolio' || reducedMotion) {
      gsap.set(element, { autoAlpha: 0, scale: .94 })
      return
    }
    const fade = gsap.to(element, { autoAlpha: 0, scale: 1.12, duration: experience.flight.lensFadeSeconds, ease: 'power2.out' })
    const sync = () => {
      if (document.hidden || document.documentElement.classList.contains('is-story-paused')) fade.pause()
      else fade.resume()
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    document.addEventListener('portfolio:playback', sync)
    return () => {
      fade.kill()
      document.removeEventListener('visibilitychange', sync)
      document.removeEventListener('portfolio:playback', sync)
    }
  }, [phase, reducedMotion, target])
  return <div ref={target} className="landing-lens-flare" aria-hidden="true" />
}
