import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { AudioManager } from '../audio/AudioManager'
import { PixelFigure } from './PixelFigure'
import { useCharacterActivity } from '../hooks/useCharacterActivity'
import { PortfolioCredits } from './PortfolioCredits'

export function MovieEnding({ audio, playing, fallback, onExit }: { audio: AudioManager; playing: boolean; fallback: boolean; onExit: () => void }) {
  const character = useRef<SVGSVGElement>(null)
  const greeted = useRef(false)
  const sound = useSyncExternalStore(audio.subscribe, audio.snapshot)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (playing && !sound.muted && sound.status === 'playing' && !greeted.current) {
      timer = setTimeout(() => { greeted.current = true; audio.sayBye() }, 100)
    }
    return () => { clearTimeout(timer); audio.stopBye() }
  }, [audio, playing, sound.muted, sound.status])
  useCharacterActivity(character)
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onExit() }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [onExit])
  return <section className="movie-ending" data-testid="movie-ending" data-playing={playing} aria-label="Thanks for watching!">
    <div className="ending-content">
      <svg className="ending-character" ref={character} viewBox="0 0 64 88" aria-hidden="true" focusable="false" shapeRendering="crispEdges"><g transform="translate(6 4)"><PixelFigure waving /></g></svg>
      <p className="pixel">Thanks for watching!</p>
      <button className="ending-exit pixel" type="button" onClick={onExit}>Back to portfolio →</button>
    </div>
    <div className="ending-credits"><PortfolioCredits fallback={fallback} /></div>
  </section>
}
