/** Shared camera margins for landing frames and automatic content stops. */
export function contentBounds(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const styles = getComputedStyle(element)
  const section = element.classList.contains('section')
  return {
    top: rect.top + (section ? parseFloat(styles.paddingTop) || 0 : 0),
    bottom: rect.bottom - (section ? parseFloat(styles.paddingBottom) || 0 : 0),
  }
}

export function storyViewport() {
  const styles = getComputedStyle(document.documentElement)
  const gap = parseFloat(styles.getPropertyValue('--story-top-gap')) || 24
  const bottomGap = parseFloat(styles.getPropertyValue('--story-bottom-gap')) || 28
  const visual = window.visualViewport
  const visibleTop = visual?.offsetTop ?? 0
  const visibleBottom = visibleTop + (visual?.height ?? window.innerHeight)
  const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 92
  const top = Math.max(visibleTop, headerBottom) + gap
  const bottom = visibleBottom - bottomGap
  return { top, bottom, height: Math.max(0, bottom - top), gap }
}
