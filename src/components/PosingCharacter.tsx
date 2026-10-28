import { useEffect, useRef, useState } from 'react'
import { experience } from '../config/experience'
import { CharacterSprite } from './CharacterSprite'
import { PlaybackTimers } from '../story/PlaybackTimers'

export function PosingCharacter({ reducedMotion, pose }: { reducedMotion: boolean; pose: 'dab' | 'flex' }) {
  const container = useRef<HTMLSpanElement>(null)
  const [posing, setPosing] = useState(false)
  const [count, setCount] = useState(0)
  useEffect(() => {
    const clock = new PlaybackTimers()
    let visible = false
    let interval: number | undefined
    let release: number | undefined
    let first: number | undefined
    const clear = () => { clock.clear(interval); clock.clear(release); clock.clear(first) }
    const sync = () => {
      clear(); setPosing(false)
      if (!visible || document.hidden || reducedMotion) return
      const perform = () => {
        setPosing(true); setCount(value => value + 1)
        release = clock.timeout(() => setPosing(false), experience.guide.poseHoldMs)
      }
      if (pose === 'dab' && window.matchMedia('(max-width: 700px)').matches) first = clock.timeout(perform, 1200)
      interval = clock.interval(perform, experience.guide.poseEveryMs)
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting; sync()
    }, { threshold: .5 })
    if (container.current) observer.observe(container.current)
    document.addEventListener('visibilitychange', sync)
    return () => { clear(); clock.dispose(); observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [reducedMotion, pose])
  return <span ref={container} className="posing-character" data-character-pose={!reducedMotion && posing ? pose : 'neutral'} data-pose-count={count} aria-hidden="true">
    <CharacterSprite pose={!reducedMotion && posing ? pose : 'neutral'} />
  </span>
}
