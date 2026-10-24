import { useId } from 'react'

/** One aligned 48 × 80 pixel body shared by seated and standing poses. */
export function PixelFigure({ seated = false, walking = false, glasses = false, presenting = false, hideLimbs = false }: { seated?: boolean; walking?: boolean; glasses?: boolean; presenting?: boolean; hideLimbs?: boolean }) {
  const clip = useId()
  return <g className={`pixel-figure ${walking ? 'is-walking' : ''}`}>
    <defs><clipPath id={clip}><rect width="48" height="39" /></clipPath></defs>
    <path d="M12 27h6v29h-6zm18 0h6v29h-6z" fill="#182724" />
    <path d="M20 35h9v10h-9z" fill="#b48b62" />
    <path d="M14 42h20v25H14z" fill="#456c68" />
    <path d="M21 43h8v23h-8z" fill="#e8dfcb" />
    <g className="pixel-figure-head">
      <image className="character-face-neutral" href={`${import.meta.env.BASE_URL}assets/temporary/character-neutral.png`} width="48" height="80" clipPath={`url(#${clip})`} style={{ imageRendering: 'pixelated' }} />
      <image className="character-face-blink" href={`${import.meta.env.BASE_URL}assets/temporary/character-blink.png`} width="48" height="80" clipPath={`url(#${clip})`} style={{ imageRendering: 'pixelated' }} />
      {glasses && <g className="character-glasses" fill="none" stroke="#d5d8cf" strokeWidth="1.5"><path d="M14 21h9v8h-9zm13 0h9v8h-9zM23 24h4M11 22h3m22 0h2" /></g>}
    </g>
    {hideLimbs ? null : seated ? <>
      <path d="M11 44h6v16h9v6H10V49h1z" fill="#456c68" />
      <path d="M23 60h8v6h-8z" fill="#b48b62" />
      <path d="M32 43h5v5h8v7H35v-4h-3z" fill="#456c68" />
      <g className="seated-wave" style={{ transformOrigin: '44px 50px' }}>
        <path d="M41 35h6v17h-6z" fill="#456c68" />
        <path d="M41 27h6v9h-6zm0-4h2v5h-2zm4 0h2v5h-2z" fill="#b48b62" />
      </g>
    </> : <>
      <g className="figure-arm figure-arm-left" style={{ transformOrigin: '14px 44px' }}><path d="M9 44h6v17H9z" fill="#456c68" /><path d="M9 60h6v6H9z" fill="#b48b62" /></g>
      {presenting ? <g className="figure-tada-arm" style={{ transformOrigin: '34px 44px' }}>
        {/* Her left hand is on the viewer's right, presenting the bulb with an open palm. */}
        <path d="M32 43h6l4 9 13-13 5 5-17 17h-7l-4-10z" fill="#456c68" />
        <path d="M55 38h10v-3h3v5h-2v3H55z" fill="#b48b62" />
        <path d="M56 36h8v2h-8z" fill="#d0b18f" />
      </g> : <g className="figure-arm figure-arm-right" style={{ transformOrigin: '34px 44px' }}><path d="M33 44h6v17h-6z" fill="#456c68" /><path d="M33 60h6v6h-6z" fill="#b48b62" /></g>}
      <g className="figure-leg figure-leg-left" style={{ transformOrigin: '19px 66px' }}><path d="M15 66h8v12h-8z" fill="#293331" /><path d="M12 77h11v3H12z" fill="#14201d" /></g>
      <g className="figure-leg figure-leg-right" style={{ transformOrigin: '29px 66px' }}><path d="M26 66h8v12h-8z" fill="#293331" /><path d="M26 77h11v3H26z" fill="#14201d" /></g>
    </>}
  </g>
}
