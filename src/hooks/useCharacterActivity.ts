import { useEffect, type RefObject } from 'react'

/** Pause decorative CSS motion when its character leaves the viewport or tab. */
export function useCharacterActivity<T extends Element>(ref: RefObject<T | null>) {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    let visible = false
    const update = () => { element.setAttribute('data-motion-active', String(visible && !document.hidden)) }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() }, { threshold: .2 })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [ref])
}
