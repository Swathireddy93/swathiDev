import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { photography } from '../content/photography'
import type { AudioManager } from '../audio/AudioManager'
import { experience } from '../config/experience'

export function PhotographySection({ audio, reducedMotion }: { audio: AudioManager; reducedMotion: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const photo = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = photo.current
    if (!element || !imageLoaded || imageFailed || reducedMotion) return
    let visible = false
    let repeat: ReturnType<typeof setTimeout> | undefined
    let release: ReturnType<typeof setTimeout> | undefined
    const clear = () => { clearTimeout(repeat); clearTimeout(release); element.setAttribute('data-flash-active', 'false') }
    const pulse = () => {
      if (!visible || document.hidden) return
      element.setAttribute('data-flash-active', 'true')
      audio.cue('shutter')
      release = setTimeout(() => element.setAttribute('data-flash-active', 'false'), experience.photography.flashMs)
      repeat = setTimeout(pulse, experience.photography.intervalMs)
    }
    const update = () => {
      clear()
      if (visible && !document.hidden) pulse()
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .65
      update()
    }, { threshold: .65 })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); clear() }
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
      <a href={photography.instagram} target="_blank" rel="noreferrer" className="text-link">Explore my photography — {photography.handle} ↗</a>
    </div>
  </section>
}
