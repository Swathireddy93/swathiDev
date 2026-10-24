import { useRef } from 'react'
import { useCharacterActivity } from '../hooks/useCharacterActivity'
import { PixelFigure } from './PixelFigure'

/** An upright figure presents the glowing bulb with her left hand. */
export function CharacterPortrait() {
  const character = useRef<SVGSVGElement>(null)
  useCharacterActivity(character)
  return <svg ref={character} className="character-portrait character-idea" data-motion-active="false" viewBox="0 0 144 112" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <g transform="translate(18 22)"><PixelFigure presenting /></g>
    <g transform="translate(0 4) scale(.75)">
      <g className="idea-halo"><circle cx="146" cy="34" r="29" fill="#f2be5b" /></g>
      <g className="idea-bulb">
        <path d="M136 13h20v5h7v8h4v16h-5v9h-7v9h-18v-9h-7v-9h-5V26h4v-8h7z" fill="#f5cb75" />
        <path d="M135 23h6v-4h11v5h-14v11h-5V24h2z" fill="#fff0bf" />
        <path d="M138 34h5l3 8 3-8h5l-6 14v12h-4V48z" fill="#b68131" />
      </g>
      <path d="M137 60h18v5h-18zm2 7h14v4h-14zm4 6h6v3h-6z" fill="#9b9d98" />
      <g className="idea-rays" fill="#f5cb75"><path d="M144 0h4v7h-4zm-30 15 3-3 6 6-3 3zm52-3 3 3-6 6-3-3zM113 33h8v4h-8zm58 0h5v4h-5z" /></g>
    </g>
  </svg>
}
