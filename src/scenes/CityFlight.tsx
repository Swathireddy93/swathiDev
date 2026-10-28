import { useEffect, useRef, type RefObject } from 'react'
import { gsap } from 'gsap'
import { experience } from '../config/experience'
import { drawCity } from './cityRenderer'

export function CityBackdrop() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const light = { seconds: experience.flight.duration }
    drawCity(context, 1, light.seconds)
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    let lastFrame = light.seconds
    const timeline = gsap.to(light, { seconds: light.seconds + experience.atmosphere.searchlightCycleSeconds,
      duration: experience.atmosphere.searchlightCycleSeconds, repeat: -1, ease: 'none', paused: true,
      onUpdate: () => {
        if (Math.abs(light.seconds - lastFrame) < 1 / 30) return
        lastFrame = light.seconds
        drawCity(context, 1, light.seconds)
      } })
    const update = () => {
      if (!visible || document.hidden || motion.matches || document.documentElement.classList.contains('is-story-paused')) timeline.pause()
      else timeline.resume()
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update() })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    document.addEventListener('portfolio:playback', update)
    motion.addEventListener('change', update)
    return () => {
      timeline.kill(); observer.disconnect()
      document.removeEventListener('visibilitychange', update)
      document.removeEventListener('portfolio:playback', update)
      motion.removeEventListener('change', update)
    }
  }, [])
  return <canvas className="city-canvas" ref={canvas} width={480} height={270} aria-hidden="true" />
}

export function CityFlight({ onStage, onComplete, onFailure, lens }: {
  onStage: (stage: string) => void; onComplete: () => void; onFailure: () => void
  lens: RefObject<HTMLDivElement | null>
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context) { onFailure(); return }
    const camera = { progress: 0, lightSeconds: 0, lensAlignment: 0 }
    drawCity(context, 0)
    const t = experience.flight
    const timeline = gsap.timeline({ onComplete, onUpdate: () => drawCity(context, camera.progress, camera.lightSeconds, camera.lensAlignment) })
    timeline.call(() => onStage('lifting'))
      .to(camera, { progress: 1, duration: t.duration, ease: 'sine.inOut' }, 0)
      .to(camera, { lightSeconds: t.duration, duration: t.duration, ease: 'none' }, 0)
      .to(camera, { lensAlignment: 1, duration: t.lensCatchSeconds, ease: 'sine.inOut' }, t.duration - t.lensCatchSeconds)
      .call(() => onStage('over-the-bay'), [], t.bayAt)
      .call(() => onStage('downtown'), [], t.cityAt)
      .call(() => onStage('landing'), [], t.landingAt)
    if (lens.current) timeline.fromTo(lens.current, { autoAlpha: 0, scale: .94 },
      { autoAlpha: t.lensStrength, scale: 1, duration: t.lensCatchSeconds, ease: 'sine.in' }, t.duration - t.lensCatchSeconds)
    const visibility = () => { if (document.hidden) timeline.pause(); else timeline.resume() }
    document.addEventListener('visibilitychange', visibility)
    return () => { timeline.kill(); document.removeEventListener('visibilitychange', visibility) }
  }, [onStage, onComplete, onFailure, lens])
  return <div className="city-flight" data-testid="city-flight"><canvas className="city-canvas" ref={canvas} width={480} height={270} aria-hidden="true" /></div>
}
