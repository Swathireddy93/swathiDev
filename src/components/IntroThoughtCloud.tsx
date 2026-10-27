import { useId, type RefObject } from 'react'

const outline = 'M49 111C24 115 9 100 17 80C2 64 12 42 37 39C35 17 66 10 84 24C100 2 132 2 149 20C169 1 199 5 208 24C229 7 259 13 269 33C295 20 324 34 325 53C349 54 358 77 344 93C343 111 323 122 301 117C280 134 254 135 237 122C215 136 184 135 171 124C147 139 117 135 105 120C80 133 54 128 49 111Z'

/** The introduction's master timeline owns typing and opacity. */
export function IntroThoughtCloud({ cloud, text }: { cloud: RefObject<HTMLDivElement | null>; text: RefObject<HTMLSpanElement | null> }) {
  const clip = useId()
  const mist = useId()
  return <div className="intro-thought-cloud" ref={cloud} data-state="hidden" aria-hidden="true">
    <div className="thought-float">
      <span className="thought-haze" style={{ clipPath: `url(#${clip})` }} />
      <svg className="thought-silhouette" viewBox="0 0 360 140" preserveAspectRatio="none" focusable="false">
        <defs>
          <clipPath id={clip} clipPathUnits="objectBoundingBox"><path d={outline} transform="scale(.002777778 .007142857)" /></clipPath>
          <linearGradient id={mist} x2="0" y2="1"><stop stopColor="#e4ede5" stopOpacity=".5" /><stop offset="1" stopColor="#becfc6" stopOpacity=".28" /></linearGradient>
        </defs>
        <path d={outline} fill={`url(#${mist})`} stroke="#dce8df66" strokeWidth="1" />
      </svg>
      <span className="thought-copy pixel"><span ref={text} /><i className="thought-cursor" /></span>
      <span className="thought-trail"><i /><i /><i /></span>
    </div>
  </div>
}
