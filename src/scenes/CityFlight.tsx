import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { experience } from '../config/experience'
import { drawCity } from './cityRenderer'

export function CityBackdrop() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (context) drawCity(context, 1)
  }, [])
  return <canvas className="city-canvas" ref={canvas} width={480} height={270} aria-hidden="true" />
}

export function CityFlight({ onStage, onComplete, onFailure }: {
  onStage: (stage: string) => void; onComplete: () => void; onFailure: () => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context) { onFailure(); return }
    const camera = { progress: 0 }
    drawCity(context, 0)
    const t = experience.flight
    const timeline = gsap.timeline({ onComplete, onUpdate: () => drawCity(context, camera.progress) })
    timeline.call(() => onStage('lifting'))
      .to(camera, { progress: 1, duration: t.duration, ease: 'sine.inOut' }, 0)
      .call(() => onStage('over-the-bay'), [], t.bayAt)
      .call(() => onStage('downtown'), [], t.cityAt)
      .call(() => onStage('landing'), [], t.landingAt)
    const visibility = () => { if (document.hidden) timeline.pause(); else timeline.resume() }
    document.addEventListener('visibilitychange', visibility)
    return () => { timeline.kill(); document.removeEventListener('visibilitychange', visibility) }
  }, [onStage, onComplete, onFailure])
  return <div className="city-flight" data-testid="city-flight"><canvas className="city-canvas" ref={canvas} width={480} height={270} aria-hidden="true" /></div>
}
