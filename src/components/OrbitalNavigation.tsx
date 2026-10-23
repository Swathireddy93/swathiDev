import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react'
import type { AudioManager } from '../audio/AudioManager'

const destinations = [
  { label: 'About Me', id: 'about', pixels: ['000111100000','001111110000','001111110000','000111100000','000011000000','001111110000','011111111000','111111111100','110000001100'] },
  { label: 'Experience', id: 'experience', pixels: ['000111111000','000100001000','111111111111','100000000001','100001100001','111111111111','100001100001','100000000001','111111111111'] },
  { label: 'Projects', id: 'projects', pixels: ['000001100000','001001100100','011001100110','110001100011','100001100001','110001100011','011001100110','001001100100','000001100000'] },
  { label: 'Experiments', id: 'experiments', pixels: ['000111111000','000011110000','000011110000','000110011000','001100001100','011111111110','011010101110','110101010111','111111111111'] },
  { label: 'Contact', id: 'contact', pixels: ['111111111111','110000000011','101000000101','100100001001','100010010001','100001100001','100000000001','100000000001','111111111111'] },
] as const

export function OrbitalNavigation({ audio, reducedMotion }: { audio: AudioManager; reducedMotion: boolean }) {
  const navigation = useRef<HTMLElement>(null)
  useEffect(() => {
    // Wait for the staggered entrance, then bring the destinations into view once.
    // An intentional scroll, tap or keyboard action takes precedence.
    const cancel = () => window.clearTimeout(timer)
    const timer = window.setTimeout(() => {
      navigation.current?.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'instant' : 'smooth' })
    }, reducedMotion ? 0 : 650)
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    window.addEventListener('pointerdown', cancel, { passive: true })
    window.addEventListener('keydown', cancel)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
      window.removeEventListener('pointerdown', cancel)
      window.removeEventListener('keydown', cancel)
    }
  }, [reducedMotion])
  const tilt = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reducedMotion || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--tilt-x', `${-((event.clientY - bounds.top) / bounds.height - .5) * 20}deg`)
    event.currentTarget.style.setProperty('--tilt-y', `${((event.clientX - bounds.left) / bounds.width - .5) * 24}deg`)
  }
  return <nav ref={navigation} className="bubble-navigation orbital-navigation" aria-label="Explore portfolio">
    {destinations.map(({ label, id, pixels }, index) => <a className="navigation-bubble orbital-link" href={`#${id}`} key={id}
      style={{ animationDelay: `${index * 80}ms`, '--orbit-delay': `${-index * 1.3}s` } as CSSProperties}
      onPointerMove={tilt} onPointerLeave={event => {
        event.currentTarget.style.removeProperty('--tilt-x'); event.currentTarget.style.removeProperty('--tilt-y')
      }}
      onAnimationStart={event => { if (event.target === event.currentTarget && event.animationName === 'bubble-arrive' && !reducedMotion) audio.cue('bubble', index) }}>
      <span className="orbital-world" aria-hidden="true">
        <span className="orbital-ring" />
        <span className="orbital-satellite" />
        <span className="orbital-model">
          {['front', 'back', 'left', 'right', 'top', 'bottom'].map(face => <span className={`model-face model-${face}`} key={face}>
            {face === 'front' && <svg viewBox="0 0 12 12" fill="currentColor" shapeRendering="crispEdges">{pixels.flatMap((row, y) => [...row].map((pixel, x) => pixel === '1' ? <rect key={`${x}-${y}`} x={x} y={y + 1} width={1} height={1} /> : null))}</svg>}
          </span>)}
        </span>
      </span>
      <span className="orbital-label">{label}</span><span className="orbital-index" aria-hidden="true">0{index + 1} ↗</span>
    </a>)}
  </nav>
}
