/** A small articulated rig built from the original opening-scene sprite. */
export function CharacterSprite({ pose = 'neutral' }: { pose?: 'neutral' | 'dab' | 'flex' }) {
  const src = `${import.meta.env.BASE_URL}assets/temporary/character-neutral.png`
  return <span className={`character-rig ${pose === 'dab' ? 'is-dabbing' : pose === 'flex' ? 'is-flexing' : ''}`} aria-hidden="true">
    <img className="rig-head" src={src} width="48" height="80" alt="" />
    <img className="rig-core" src={src} width="48" height="80" alt="" />
    <img className="rig-leg rig-leg-left" src={src} width="48" height="80" alt="" />
    <img className="rig-leg rig-leg-right" src={src} width="48" height="80" alt="" />
    <svg className="rig-arm rig-arm-left" viewBox="-20 0 88 80"><g className="rig-neutral-arm"><path className="rig-walking-arm" d="M12 43h5v17h-2v5h-5V48h2z" fill="#456c68"/><path className="rig-hand-down" d="M10 61h5v6h-5z" fill="#b48b62"/></g><g className="rig-dab-arm"><path d="M10 44l-3-12 16-5 2 5-12 4 3 7z" fill="#456c68"/><path d="M22 27h5v5h-5z" fill="#b48b62"/></g><g className="rig-flex-arm"><path d="M12 42H2L0 31h-6l2 18h16l5-4z" fill="#456c68" /><path d="M-6 24h7v9h-7z" fill="#b48b62" /></g></svg>
    <svg className="rig-arm rig-arm-right" viewBox="-20 0 88 80"><g className="rig-neutral-arm"><path d="M31 43h5v18h2v5h-5v-6h-2z" fill="#456c68"/><path d="M33 61h5v6h-5z" fill="#b48b62"/></g><g className="rig-dab-arm"><path d="M31 43l13-16 4 4-13 16z" fill="#456c68"/><path d="M44 27l4-4 4 4-4 4z" fill="#b48b62"/></g><g className="rig-flex-arm"><path d="M32 42h10l2-11h6l-2 18H32l-5-4z" fill="#456c68" /><path d="M44 24h7v9h-7z" fill="#b48b62" /></g></svg>
  </span>
}
