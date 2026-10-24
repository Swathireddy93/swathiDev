import { useRef } from 'react'
import { useCharacterActivity } from '../hooks/useCharacterActivity'
import { PixelFigure } from './PixelFigure'

export function CharacterRestScene() {
  const character = useRef<SVGSVGElement>(null)
  useCharacterActivity(character)
  return <svg ref={character} data-motion-active="false" className="character-rest-scene" viewBox="0 0 112 112" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <path d="M40 72h32v25H40zm3 25h4v15h-4zm22 0h4v15h-4z" fill="#303c38" />
    <g transform="translate(32 14)"><PixelFigure seated /></g>
    <path d="M9 81h94v6H9z" fill="#909497" />
    <path d="M9 87h94v3H9zM16 90h5v22h-5zm75 0h5v22h-5z" fill="#4b4f52" />
    <path d="M14 68h11v11H14zm11 2h5v7h-5v-2h3v-3h-3z" fill="#b9bdc0" />
    <path d="M16 67h7v2h-7z" fill="#24282c" />
    <path d="M16 59h2v5h-2zm5-2h2v5h-2z" fill="#777d82" />
  </svg>
}
