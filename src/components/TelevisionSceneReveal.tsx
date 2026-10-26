import { useEffect, useState, type CSSProperties } from 'react'
import { experience } from '../config/experience'

/** Brief analog-TV tracking over the already-painted landscape. */
export function TelevisionSceneReveal() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), experience.loading.tvRevealMs)
    return () => window.clearTimeout(timer)
  }, [])
  if (!visible) return null
  return <div className="tv-scene-reveal" data-testid="tv-scene-reveal" aria-hidden="true"
    style={{ '--tv-reveal-duration': `${experience.loading.tvRevealMs}ms` } as CSSProperties}>
    <span className="tv-static" />
    <span className="tv-scanlines" />
    <span className="tv-tracking" />
  </div>
}
