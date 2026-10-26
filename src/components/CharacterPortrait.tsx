import { useRef } from 'react'
import { useCharacterActivity } from '../hooks/useCharacterActivity'
import { PixelFigure } from './PixelFigure'

/** A seated maker, viewed over the back of her laptop as an idea lights up. */
export function CharacterPortrait() {
  const character = useRef<SVGSVGElement>(null)
  useCharacterActivity(character)
  return <svg ref={character} className="character-portrait character-idea idea-workshop" data-motion-active="false" viewBox="0 0 144 112" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <g className="maker-chair" fill="#3b4b43"><path d="M19 47h27v34H19zm-1 34h30v5H18zm13 5h3v22h-3zm-7 22h19v3H24z" /></g>
    <g className="maker-seated-legs">
      <path d="M22 76h8v18h-8zm12 0h8v18h-8z" fill="#35413d" />
      <path d="M23 92h7v14h-7zm12 0h7v14h-7z" fill="#293331" />
      <path d="M20 105h12v5H20zm14 0h12v5H34z" fill="#a5b0a8" />
    </g>
    <g className="maker-character" transform="translate(8 10)"><PixelFigure seated typing /></g>
    <g className="maker-laptop laptop-back">
      <path d="M19 79h42v4H19z" fill="#8c9994" />
      <path d="M22 57h35v22H22z" fill="#9caca3" />
      <path d="M24 59h31v18H24z" fill="#53675e" />
      <path d="M36 64h6v7h-6z" fill="#c5d3c7" />
      <path d="M38 66h2v3h-2z" fill="#83978a" />
      <path d="M24 77h31v2H24z" fill="#33483e" />
    </g>
    <path d="M8 83h66v5H8zm5 5h4v24h-4zm52 0h4v24h-4z" fill="#737e7b" />
    <g className="build-pixels" fill="#b48b62">
      <path className="build-pixel pixel-one" d="M64 55h3v3h-3z" />
      <path className="build-pixel pixel-two" d="M68 64h3v3h-3z" />
      <path className="build-pixel pixel-three" d="M63 73h2v2h-2z" />
    </g>
    <g className="idea-bulb-halo"><circle cx="108" cy="35" r="23" fill="#f2be5b" /></g>
    <g className="idea-lightbulb">
      <path d="M99 14h18v5h6v7h4v14h-5v8h-6v8h-16v-8h-6v-8h-5V26h4v-7h6z" fill="#f5cb75" />
      <path d="M99 22h6v-3h8v4h-12v9h-5v-8h3z" fill="#fff0bf" />
      <path d="M101 33h4l3 7 3-7h4l-5 13v10h-4V46z" fill="#a8772e" />
      <path d="M100 57h16v4h-16zm2 6h12v4h-12zm3 6h6v3h-6z" fill="#a0aaa4" />
      <g fill="#f5cb75"><path d="M106 2h4v7h-4zm-29 20 3-3 6 6-3 3zm55-3 3 3-6 6-3-3zM77 37h7v4h-7zm55 0h7v4h-7z" /></g>
    </g>
  </svg>
}
