import { useEffect, useRef, useState } from 'react'
import { initialStory, StoryPlayer, type StorySnapshot } from '../story/StoryPlayer'
import type { StoryChapter } from '../story/storyboard'

export function usePortfolioStory({ reducedMotion, navigate, year, ending }: {
  reducedMotion: boolean
  navigate: (chapter: StoryChapter) => void
  year: (year: number) => void
  ending: () => void
}) {
  const [snapshot, setSnapshot] = useState<StorySnapshot>(initialStory)
  const player = useRef<StoryPlayer | null>(null)
  useEffect(() => {
    if (reducedMotion) return
    const controller = new StoryPlayer({ snapshot: setSnapshot, navigate, year, ending })
    player.current = controller
    if (location.hash && !['#top', '#portfolio-menu'].includes(location.hash) && document.getElementById(location.hash.slice(1))) controller.pause(true)
    const observer = new IntersectionObserver(([entry]) => controller.setMenuVisible(entry.isIntersecting), { threshold: .25 })
    const menu = document.getElementById('portfolio-menu')
    if (menu) observer.observe(menu)
    const visibility = () => controller.setHidden(document.hidden)
    const resize = () => controller.resize()
    const interrupt = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') { controller.pause(true); return }
      if (event.type !== 'wheel' && event.target instanceof Element && event.target.closest('.movie-controls, .sound-controls, .timeline-play')) return
      if (event instanceof KeyboardEvent && !['Tab', 'Escape', 'Enter', ' ', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) return
      controller.pause(true)
    }
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) document.addEventListener(event, interrupt, { passive: true, capture: true })
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)
    return () => {
      controller.dispose(); player.current = null; observer.disconnect()
      for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) document.removeEventListener(event, interrupt, true)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('resize', resize)
    }
  }, [reducedMotion, navigate, year, ending])
  return {
    snapshot: reducedMotion ? { ...initialStory, status: 'off' as const, focus: undefined } : snapshot,
    pause: () => player.current?.pause(),
    explore: () => player.current?.pause(true),
    play: () => player.current?.play(),
    restart: () => player.current?.restart(),
    finish: () => player.current?.finish(),
  }
}
