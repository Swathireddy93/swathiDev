import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { AudioManager } from '../audio/AudioManager'
import { PixelFigure } from './PixelFigure'
import { useCharacterActivity } from '../hooks/useCharacterActivity'

export function MovieEnding({ audio, playing, onExit }: { audio: AudioManager; playing: boolean; onExit: () => void }) {
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
  return <section className="movie-ending" data-testid="movie-ending" data-playing={playing} aria-labelledby="movie-ending-title" onWheel={onExit} onTouchStart={onExit}>
    <div className="ending-content">
      <svg className="ending-character" ref={character} viewBox="0 0 64 88" aria-hidden="true" focusable="false" shapeRendering="crispEdges"><g transform="translate(6 4)"><PixelFigure waving /></g></svg>
      <h2 id="movie-ending-title" className="pixel">THE END</h2>
      <p className="pixel">Until next time.</p>
      <button className="ending-exit pixel" type="button" onClick={onExit}>Back to portfolio →</button>
    </div>
  </section>
}
