import { useEffect, useState } from 'react'

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useReducedMotion(onReduce: () => void) {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setReduced(media.matches)
      if (media.matches) onReduce()
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [onReduce])
  return reduced
}
