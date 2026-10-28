import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { photography } from '../content/photography'
import type { AudioManager } from '../audio/AudioManager'
import { experience } from '../config/experience'
import { PlaybackTimers } from '../story/PlaybackTimers'
import { useCharacterActivity } from '../hooks/useCharacterActivity'

export function PhotographySection({ audio, reducedMotion }: { audio: AudioManager; reducedMotion: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const photo = useRef<HTMLDivElement>(null)
  const links = useRef<HTMLDivElement>(null)
  useCharacterActivity(links)
  useEffect(() => {
    const element = photo.current
    if (!element || !imageLoaded || imageFailed || reducedMotion) return
    const clock = new PlaybackTimers()
    let visible = false
    let lastFlash = -Infinity
    let repeat: number | undefined
    let release: number | undefined
    const clear = () => { clock.clear(repeat); clock.clear(release); element.setAttribute('data-flash-active', 'false') }
    const pulse = () => {
      if (!visible || document.hidden) return
      lastFlash = performance.now()
      element.setAttribute('data-flash-active', 'true')
      audio.cue('shutter')
      release = clock.timeout(() => element.setAttribute('data-flash-active', 'false'), experience.photography.flashMs)
      repeat = clock.timeout(pulse, experience.photography.intervalMs)
    }
    const update = () => {
      clear()
      // Let the image arrive before flashing. Viewport/threshold changes must
      // not restart the shutter repeatedly while the movie scrolls past it.
      if (visible && !document.hidden) repeat = clock.timeout(pulse,
        Math.max(350, experience.photography.intervalMs - (performance.now() - lastFlash)))
    }
    const observer = new IntersectionObserver(([entry]) => {
      const nextVisible = entry.isIntersecting && entry.intersectionRatio >= .65
      if (nextVisible === visible) return
      visible = nextVisible
      update()
    }, { threshold: .65 })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); clear(); clock.dispose() }
  }, [audio, imageLoaded, imageFailed, reducedMotion])
  return <section className="photography-section" aria-labelledby="photography-title">
    <div className="photography-photo" ref={photo} style={{ '--photo-flash-duration': `${experience.photography.flashMs}ms` } as CSSProperties}>
      {!imageFailed ? <img src={photography.image} alt={photography.imageAlt} width={photography.imageWidth} height={photography.imageHeight}
        loading="lazy" decoding="async" fetchPriority="low" onLoad={() => setImageLoaded(true)} onError={() => setImageFailed(true)} /> : <div className="photography-photo-placeholder" role="img" aria-label="Photography image unavailable">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10 21h12l4-6h14l4 6h10v29H10z" /><circle cx="33" cy="35" r="10" /><path d="M46 27h4m-27 8a10 10 0 0 1 10-10" /></svg>
        <span>PHOTO</span>
      </div>}
      <span className="photography-flash" aria-hidden="true" />
    </div>
    <div className="photography-copy">
      <p className="eyebrow">THROUGH MY LENS</p>
      <h3 id="photography-title">{photography.title}</h3>
      <p className="photography-tagline">{photography.tagline}</p>
      {photography.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <p className="photography-cta">Go on, have a peek 👀</p>
      <div className="photography-links" ref={links}>
        <a href={photography.instagram} target="_blank" rel="noreferrer" className="photography-link">
          <span className="photography-link-art" aria-hidden="true"><svg viewBox="0 0 20 16" fill="none" stroke="currentColor" shapeRendering="crispEdges"><path d="M2 4h4l2-2h5l2 2h3v10H2z" /><path d="M8 6h5v5H8zM15 6h1" /></svg><span>↗</span></span>
          <span className="photography-link-title">The Editorial Side</span>
          <span className="photography-link-description">Fashion, portraits &amp; creative campaigns</span><span className="photography-handle">{photography.handle}</span>
        </a>
        <a href={photography.personalInstagram} target="_blank" rel="noreferrer" className="photography-link">
          <span className="photography-link-art" aria-hidden="true"><svg viewBox="0 0 20 16" fill="none" stroke="currentColor" shapeRendering="crispEdges"><path d="M2 2h16v12H2zM3 12l5-6 4 5 2-3 3 4" /><path d="M13 4h2v2h-2z" /></svg><span>↗</span></span>
          <span className="photography-link-title">People, Places &amp; Pretty Views</span>
          <span className="photography-link-description">Travel, California landscapes &amp; the people around me</span><span className="photography-handle">{photography.personalHandle}</span>
        </a>
      </div>
    </div>
  </section>
}
