import { useId, type CSSProperties, type RefObject } from 'react'

/** The introduction's master timeline owns typing and opacity. */
export function IntroThoughtCloud({ cloud, text }: { cloud: RefObject<HTMLDivElement | null>; text: RefObject<HTMLSpanElement | null> }) {
  const outline = useId()
  return <div className="intro-thought-cloud" ref={cloud} data-state="hidden" data-design="pixel-glass" aria-hidden="true"
    style={{ '--dialogue-edge': `url("#${outline}")` } as CSSProperties}>
    <svg className="dialogue-outline" width="0" height="0" focusable="false"><defs>
      <clipPath id={outline} clipPathUnits="objectBoundingBox">
        <path d="M.13.86 C.055.86 0 .77 0 .65 C0 .55 .025.47 .07.435 C.045.27 .16.16 .26.21 C.30.03 .49.015 .57.17 C.68.045 .83.12 .84.29 C.95.26 1 .38 .965.49 C1 .55 1 .70 .945.76 C.925.865 .80.91 .74.85 C.66.99 .50.96 .45.875 C.34.97 .21.96 .18.86 Z" />
      </clipPath>
    </defs></svg>
    <div className="thought-float">
      <div className="dialogue-frame">
        <span className="dialogue-glass" />
        <span className="thought-copy"><span ref={text} /><i className="thought-cursor" /></span>
      </div>
      <span className="thought-pointer"><i /></span>
    </div>
  </div>
}
