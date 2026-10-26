import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AudioManager } from './audio/AudioManager'
import { type IntroPhase } from './config/experience'
import { useAssets } from './hooks/useAssets'
import { prefersReducedMotion, useReducedMotion } from './hooks/useReducedMotion'
import { LoadingScreen } from './components/LoadingScreen'
import { SoundControls } from './components/SoundControls'
import { Header } from './components/Header'
import { Portfolio } from './components/Portfolio'
import { SceneBoundary } from './components/SceneBoundary'
import { CityFlight } from './scenes/CityFlight'
import { TelevisionSceneReveal } from './components/TelevisionSceneReveal'
import { experience } from './config/experience'

const MountainWorld = lazy(() => import('./scenes/MountainWorld'))

function canRender() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}
export default function App() {
  const [audio] = useState(() => new AudioManager())
  const [graphics] = useState(canRender)
  const [fallback, setFallback] = useState(!graphics)
  const [phase, setPhase] = useState<IntroPhase>(() => prefersReducedMotion() || !graphics ? 'portfolio' : 'loading')
  const [fading, setFading] = useState(false)
  const [sceneStage, setSceneStage] = useState('mountains')
  const assetsReady = useRef(false)
  const firstFrameReady = useRef(false)
  const finish = useCallback(() => {
    setPhase('portfolio')
    requestAnimationFrame(() => document.getElementById('portfolio')?.focus({ preventScroll: true }))
  }, [])
  const reducedMotion = useReducedMotion(finish)
  const revealWhenReady = useCallback(() => {
    if (assetsReady.current && firstFrameReady.current) setPhase(current => current === 'loading' ? 'playing' : current)
  }, [])
  const onReady = useCallback(() => { assetsReady.current = true; revealWhenReady() }, [revealWhenReady])
  const onRendered = useCallback(() => { firstFrameReady.current = true; revealWhenReady() }, [revealWhenReady])
  const onFailure = useCallback(() => { setFallback(true); finish() }, [finish])
  const { assets, progress } = useAssets((phase === 'loading' || phase === 'playing') && !reducedMotion && graphics, onReady, onFailure)
  useEffect(() => {
    if (phase !== 'loading' || !assets) return
    const timeout = window.setTimeout(() => { if (!firstFrameReady.current) onFailure() }, experience.assetsTimeoutMs)
    return () => window.clearTimeout(timeout)
  }, [assets, phase, onFailure])
  const onFade = useCallback(() => setFading(true), [])
  const startFlight = useCallback(() => { setFading(false); setPhase('flight') }, [])
  const land = useCallback(() => { setSceneStage('landed'); finish() }, [finish])
  const replay = useCallback(() => {
    if (reducedMotion || fallback) return
    assetsReady.current = false
    firstFrameReady.current = false
    setFading(false)
    setSceneStage('mountains')
    setPhase('loading')
    window.scrollTo({ top: 0, behavior: 'instant' })
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.skip-intro')?.focus())
  }, [reducedMotion, fallback])

  useEffect(() => {
    audio.prepare()
    audio.startOnLoad()
    const interact = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.sound-toggle')) return
      if (event instanceof KeyboardEvent && !['Enter', ' '].includes(event.key)) return
      audio.resumeOnInteraction()
    }
    document.addEventListener('click', interact, true)
    document.addEventListener('keydown', interact, true)
    return () => {
      document.removeEventListener('click', interact, true)
      document.removeEventListener('keydown', interact, true)
      audio.dispose()
    }
  }, [audio])

  return (
    <div className={`app phase-${phase}`} data-phase={phase} data-scene={sceneStage}>
      <a className="skip-content" href="#portfolio" onClick={phase !== 'portfolio' ? finish : undefined}>Skip to portfolio content</a>
      <Header portfolio={phase === 'portfolio'} onSkip={finish} />
      {phase !== 'portfolio' && <section className={`intro ${fading ? 'is-fading' : ''}`} aria-label="A pixel-art introduction" data-testid="intro">
        {(phase === 'loading' || phase === 'playing') && assets && <SceneBoundary onFailure={onFailure}>
          <Suspense fallback={<div className="scene-poster" aria-hidden="true" />}>
            <MountainWorld assets={assets} playing={phase === 'playing'} audio={audio}
              onComplete={startFlight} onFade={onFade} onStage={setSceneStage} onFailure={onFailure} onRendered={onRendered} />
          </Suspense>
        </SceneBoundary>}
        {phase === 'flight' && <CityFlight onStage={setSceneStage} onComplete={land} onFailure={onFailure} />}
        <div className="intro-vignette" aria-hidden="true" />
        {phase === 'loading' && <LoadingScreen progress={progress} />}
        {phase === 'playing' && <TelevisionSceneReveal />}
        {!!assets?.failures.length && <p className="asset-notice scene-notice" role="status">Some scenery is unavailable. Skip intro to view the portfolio.</p>}
        <p className="sr-only" aria-live="polite">{phase !== 'loading' ? `Introduction: ${sceneStage}.` : ''}</p>
      </section>}
      {phase === 'portfolio' && <Portfolio audio={audio} onReplay={replay} reducedMotion={reducedMotion || fallback} fallback={fallback} />}
      <SoundControls audio={audio} />
    </div>
  )
}
