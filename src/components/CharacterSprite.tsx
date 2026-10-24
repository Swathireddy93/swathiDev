/** A small articulated rig built from the original opening-scene sprite. */
export function CharacterSprite({ pose = 'neutral' }: { pose?: 'neutral' | 'dab' | 'flex' }) {
  const src = `${import.meta.env.BASE_URL}assets/temporary/character-neutral.png`
  return <span className={`character-rig ${pose === 'dab' ? 'is-dabbing' : pose === 'flex' ? 'is-flexing' : ''}`} aria-hidden="true">
    <img className="rig-head" src={src} width="48" height="80" alt="" />
    <img className="rig-core" src={src} width="48" height="80" alt="" />
    <img className="rig-leg rig-leg-left" src={src} width="48" height="80" alt="" />
    <img className="rig-leg rig-leg-right" src={src} width="48" height="80" alt="" />
    <svg className="rig-arm rig-arm-left" viewBox="-20 0 88 80"><g className="rig-neutral-arm"><path className="rig-walking-arm" d="M12 43h5v17h-2v5h-5V48h2z" fill="#456c68"/><path className="rig-hand-down" d="M10 61h5v6h-5z" fill="#b48b62"/></g><g className="rig-dab-arm"><path d="M10 43l9-18 15 10-4 5-9-7-6 14z" fill="#456c68"/><path d="M30 34l6 3-3 5-6-3z" fill="#b48b62"/></g><g className="rig-flex-arm"><path d="M12 42H2L0 31h-6l2 18h16l5-4z" fill="#456c68" /><path d="M-6 24h7v9h-7z" fill="#b48b62" /></g></svg>
    <svg className="rig-arm rig-arm-right" viewBox="-20 0 88 80"><g className="rig-neutral-arm"><path d="M31 43h5v18h2v5h-5v-6h-2z" fill="#456c68"/><path d="M33 61h5v6h-5z" fill="#b48b62"/></g><g className="rig-dab-arm"><path d="M32 43l25-23 4 5-23 24z" fill="#456c68"/><path d="M57 20l5-4 4 5-5 4z" fill="#b48b62"/></g><g className="rig-flex-arm"><path d="M32 42h10l2-11h6l-2 18H32l-5-4z" fill="#456c68" /><path d="M44 24h7v9h-7z" fill="#b48b62" /></g></svg>
  </span>
}
