import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AudioManager } from './audio/AudioManager'
import { experience, type IntroPhase } from './config/experience'
import { useAssets } from './hooks/useAssets'
import { prefersReducedMotion, useReducedMotion } from './hooks/useReducedMotion'
import { LoadingScreen } from './components/LoadingScreen'
import { SoundControls } from './components/SoundControls'
import { Header } from './components/Header'
import { Portfolio } from './components/Portfolio'
import { SceneBoundary } from './components/SceneBoundary'

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
function wasSeen() {
  try { return sessionStorage.getItem(experience.sessionKey) === 'true' }
  catch { return false }
}
function markSeen() {
  try { sessionStorage.setItem(experience.sessionKey, 'true') }
  catch { /* Storage may be restricted; the current session still works. */ }
}

export default function App() {
  const [audio] = useState(() => new AudioManager())
  const [graphics] = useState(canRender)
  const [fallback, setFallback] = useState(!graphics)
  const [phase, setPhase] = useState<IntroPhase>(() => prefersReducedMotion() || wasSeen() || !graphics ? 'portfolio' : 'loading')
  const [fading, setFading] = useState(false)
  const [sceneStage, setSceneStage] = useState('mountains')
  const finish = useCallback(() => {
    audio.stop()
    markSeen()
    setPhase('portfolio')
    requestAnimationFrame(() => document.getElementById('portfolio')?.focus({ preventScroll: true }))
  }, [audio])
  const reducedMotion = useReducedMotion(finish)
  const onReady = useCallback(() => setPhase((current) => current === 'loading' ? 'choice' : current), [])
  const onFailure = useCallback(() => { setFallback(true); finish() }, [finish])
  const { assets, progress } = useAssets(phase !== 'portfolio' && !reducedMotion && graphics, onReady, onFailure)
  const onFade = useCallback(() => setFading(true), [])
  const start = (withSound: boolean) => {
    if (withSound) audio.enable()
    else audio.stop()
    setPhase('playing')
  }
  const replay = useCallback(() => {
    if (reducedMotion || fallback) return
    audio.stop()
    setFading(false)
    setSceneStage('mountains')
    setPhase('loading')
    window.scrollTo({ top: 0, behavior: 'instant' })
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.skip-intro')?.focus())
  }, [audio, reducedMotion, fallback])

  useEffect(() => () => audio.dispose(), [audio])

  return (
    <div className={`app phase-${phase}`} data-phase={phase} data-scene={sceneStage}>
      <a className="skip-content" href="#portfolio" onClick={phase !== 'portfolio' ? finish : undefined}>Skip to portfolio content</a>
      <Header portfolio={phase === 'portfolio'} onSkip={finish} />
      {phase !== 'portfolio' && <section className={`intro ${fading ? 'is-fading' : ''}`} aria-label="A pixel-art journey through the Bay Area" data-testid="intro">
        {phase !== 'loading' && assets && <SceneBoundary onFailure={onFailure}>
          <Suspense fallback={<div className="scene-poster" aria-hidden="true" />}>
            <MountainWorld assets={assets} playing={phase === 'playing'} audio={audio}
              onComplete={finish} onFade={onFade} onStage={setSceneStage} onFailure={onFailure} />
          </Suspense>
        </SceneBoundary>}
        <div className="intro-vignette" aria-hidden="true" />
        {phase === 'loading' && <LoadingScreen progress={progress} />}
        {phase === 'choice' && <div id="intro-choice" className="intro-choice">
          <p className="eyebrow">A SMALL ADVENTURE BEFORE THE WORK.</p>
          <h1 className="pixel">Take the scenic route.</h1>
          <p>A little nature. A little curiosity. A new perspective.</p>
          <div className="intro-choice-actions"><button type="button" className="button primary" onClick={() => start(true)}>Start with Sound <span aria-hidden="true">↗</span></button><button type="button" className="button quiet" onClick={() => start(false)}>Continue Muted <span aria-hidden="true">→</span></button></div>
          <span className="intro-note">About 10 seconds · temporary artwork & original audio</span>
          {!!assets?.failures.length && <p className="asset-notice" role="status">Some scenery is unavailable. You can continue or skip straight to the portfolio.</p>}
        </div>}
        <p className="sr-only" aria-live="polite">{phase === 'playing' ? `Introduction: ${sceneStage}. The character faces the camera, peeks over the ridge, and jumps.` : ''}</p>
      </section>}
      {phase === 'portfolio' && <Portfolio onReplay={replay} reducedMotion={reducedMotion || fallback} fallback={fallback} />}
      {phase !== 'loading' && <SoundControls audio={audio} />}
    </div>
  )
}
