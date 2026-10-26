import { storyViewport } from './viewport'

/** Frame the introduction and five destinations below the header with breathing room. */
export function menuPosition(menu: HTMLElement) {
  const viewport = storyViewport()
  const introduction = document.querySelector('.hero-introduction')
  const intro = introduction?.getBoundingClientRect()
  // Frame its final layout position, not the temporary 8px entrance translation.
  const translation = introduction ? getComputedStyle(introduction).translate.split(/\s+/) : []
  const entranceY = parseFloat(translation[1]) || 0
  const bounds = menu.getBoundingClientRect()
  const top = window.scrollY + (intro ? intro.top - entranceY : bounds.top)
  const bottom = window.scrollY + bounds.bottom
  const movie = document.querySelector('.movie-toggle')?.getBoundingClientRect()
  // Leave the short hint clear of the last circle, including on compact phones.
  const clearBottom = movie ? Math.min(viewport.bottom, movie.top + movie.height / 2 - 20) : viewport.bottom
  const available = Math.max(0, clearBottom - viewport.top)
  const centered = top - viewport.top - Math.max(0, available - (bottom - top)) / 2
  return Math.max(0, Math.min(centered, document.documentElement.scrollHeight - window.innerHeight))
}
