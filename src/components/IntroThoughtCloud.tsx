import type { RefObject } from 'react'

/** The introduction's master timeline owns typing and opacity. */
export function IntroThoughtCloud({ cloud, text }: { cloud: RefObject<HTMLDivElement | null>; text: RefObject<HTMLSpanElement | null> }) {
  return <div className="intro-thought-cloud" ref={cloud} data-state="hidden" data-design="pixel-glass" aria-hidden="true">
    <div className="thought-float">
      <div className="dialogue-frame">
        <span className="dialogue-glass" />
        <span className="dialogue-highlight" />
        <span className="dialogue-pixels"><i /><i /><i /></span>
        <span className="thought-copy"><span ref={text} /><i className="thought-cursor" /></span>
      </div>
      <span className="thought-pointer"><i /></span>
    </div>
  </div>
}
