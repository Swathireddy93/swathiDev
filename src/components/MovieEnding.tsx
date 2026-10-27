import { useEffect, useRef } from 'react'
import { PixelFigure } from './PixelFigure'
import { useCharacterActivity } from '../hooks/useCharacterActivity'

export function MovieEnding({ playing, onExit }: { playing: boolean; onExit: () => void }) {
  const character = useRef<SVGSVGElement>(null)
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
