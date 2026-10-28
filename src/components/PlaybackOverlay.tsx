import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react'

/** One viewport-anchored layer, outside scrolling and inert portfolio content. */
export function PlaybackOverlay({ children, onHost }: { children: ReactNode; onHost: (host: HTMLDivElement | null) => void }) {
  const overlay = useRef<HTMLDivElement>(null)
  const attach = useCallback((node: HTMLDivElement | null) => { overlay.current = node; onHost(node) }, [onHost])
  useLayoutEffect(() => {
    const element = overlay.current
    if (!element) return
    const viewport = window.visualViewport
    let frame = 0
    const position = () => {
      frame = 0
      element.style.left = `${viewport?.offsetLeft ?? 0}px`
      element.style.top = `${viewport?.offsetTop ?? 0}px`
      element.style.width = `${viewport?.width ?? window.innerWidth}px`
      element.style.height = `${viewport?.height ?? window.innerHeight}px`
      document.documentElement.style.setProperty('--playback-viewport-width', `${viewport?.width ?? window.innerWidth}px`)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(position) }
    position()
    viewport?.addEventListener('resize', schedule)
    viewport?.addEventListener('scroll', schedule)
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener('resize', schedule)
      viewport?.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      document.documentElement.style.removeProperty('--playback-viewport-width')
    }
  }, [])
  return <div className="playback-overlay" ref={attach}>{children}</div>
}
