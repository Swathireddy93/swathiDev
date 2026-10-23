import { useEffect, useState } from 'react'
import type { LoadedAssets } from '../assets/loadAssets'

export function useAssets(enabled: boolean, onReady: () => void, onFailure: () => void) {
  const [progress, setProgress] = useState(0)
  const [assets, setAssets] = useState<LoadedAssets | null>(null)
  useEffect(() => {
    if (!enabled) return
    let active = true
    import('../assets/loadAssets')
      .then(({ loadAssets }) => loadAssets((value) => { if (active) setProgress(value) }))
      .then((result) => {
        if (!active) return
        setAssets(result)
        onReady()
      })
      .catch(() => { if (active) onFailure() })
    return () => { active = false }
  }, [enabled, onReady, onFailure])
  return { assets, progress }
}
