import { useEffect, useState } from 'react'
import type { LoadedAssets } from '../assets/loadAssets'
import { experience } from '../config/experience'

export function useAssets(enabled: boolean, onReady: () => void, onFailure: () => void, cycle = 0) {
  const [loading, setLoading] = useState({ progress: 0, cycle })
  const [assets, setAssets] = useState<LoadedAssets | null>(null)
  useEffect(() => {
    if (!enabled) return
    let active = true
    let loadedProgress = 0
    let result: LoadedAssets | null = null
    let completedAt: number | null = null
    const startedAt = performance.now()
    // Pace the reveal without ever getting ahead of actual asset readiness.
    // Keep 100% visible briefly before beginning the character animation.
    const timer = window.setInterval(() => {
      const now = performance.now()
      const paced = Math.floor(Math.min(1, (now - startedAt) / experience.loading.minimumMs) * 100)
      const visible = Math.min(loadedProgress, paced, result ? 100 : 99)
      setLoading({ progress: visible, cycle })
      if (visible === 100 && result) {
        completedAt ??= now
        if (now - completedAt >= experience.loading.completeHoldMs) {
          window.clearInterval(timer)
          onReady()
        }
      }
    }, 40)
    import('../assets/loadAssets')
      .then(({ loadAssets }) => loadAssets((value) => { loadedProgress = value }))
      .then((loaded) => {
        if (!active) return
        result = loaded
        loadedProgress = 100
        setAssets(loaded)
      })
      .catch(() => {
        if (!active) return
        window.clearInterval(timer)
        onFailure()
      })
    return () => { active = false; window.clearInterval(timer) }
  }, [enabled, onReady, onFailure, cycle])
  return { assets, progress: loading.cycle === cycle ? loading.progress : 0 }
}
