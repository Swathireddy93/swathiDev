import { useState } from 'react'

const links = [['About me','about'], ['Experience','experience'], ['Projects','projects'], ['Experiments','experiments'], ['Contact','contact']] as const

export function Header({ portfolio, onSkip }: { portfolio: boolean; onSkip: () => void }) {
  const [menu, setMenu] = useState(false)
  return (
    <header className={`site-header ${portfolio ? 'portfolio-header' : 'intro-header'}`}>
      {portfolio ? <a className="wordmark pixel" href="#top">SWATHI<span aria-hidden="true">_</span></a> : <button className="wordmark pixel" type="button" onClick={onSkip} aria-label="Go directly to portfolio">SWATHI<span aria-hidden="true">_</span></button>}
      {portfolio ? <>
        <button className="menu-toggle" type="button" aria-expanded={menu} aria-controls="main-navigation" onClick={() => setMenu(!menu)}>{menu ? 'Close ×' : 'Menu +'}</button>
        <nav id="main-navigation" aria-label="Main navigation" className={menu ? 'is-open' : ''}>{links.map(([label,id]) => <a href={`#${id}`} key={id} onClick={() => setMenu(false)}>{label}</a>)}</nav>
      </> : <button className="skip-intro pixel" type="button" onClick={onSkip}>Skip intro <span aria-hidden="true">→</span></button>}
    </header>
  )
}
