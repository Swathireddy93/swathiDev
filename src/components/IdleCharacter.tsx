import { useRef } from 'react'
import { useCharacterActivity } from '../hooks/useCharacterActivity'

export function IdleCharacter() {
  const character = useRef<HTMLSpanElement>(null)
  useCharacterActivity(character)
  return <span ref={character} className="guide-idle-character" data-motion-active="false" aria-hidden="true">
    <img className="character-face-neutral" src={`${import.meta.env.BASE_URL}assets/temporary/character-neutral.png`} width="48" height="80" alt="" />
    <img className="character-face-blink" src={`${import.meta.env.BASE_URL}assets/temporary/character-blink.png`} width="48" height="80" alt="" />
  </span>
}
