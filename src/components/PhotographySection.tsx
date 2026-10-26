import { useState } from 'react'
import { photography } from '../content/photography'

export function PhotographySection() {
  const [imageFailed, setImageFailed] = useState(false)
  return <section className="photography-section" aria-labelledby="photography-title">
    <div className="photography-photo">
      {!imageFailed ? <img src={photography.image} alt={photography.imageAlt} width={photography.imageWidth} height={photography.imageHeight}
        loading="lazy" decoding="async" fetchPriority="low" onError={() => setImageFailed(true)} /> : <div className="photography-photo-placeholder" role="img" aria-label="Photography image unavailable">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10 21h12l4-6h14l4 6h10v29H10z" /><circle cx="33" cy="35" r="10" /><path d="M46 27h4m-27 8a10 10 0 0 1 10-10" /></svg>
        <span>PHOTO</span>
      </div>}
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
