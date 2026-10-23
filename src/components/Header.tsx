export function Header({ portfolio, onSkip }: { portfolio: boolean; onSkip: () => void }) {
  return (
    <header className={`site-header ${portfolio ? 'portfolio-header' : 'intro-header'}`}>
      {portfolio ? <a className="wordmark pixel" href="#top">SWATHI</a> : <button className="wordmark pixel" type="button" onClick={onSkip} aria-label="Go directly to portfolio">SWATHI</button>}
      {!portfolio && <button className="skip-intro pixel" type="button" onClick={onSkip}>Skip intro <span aria-hidden="true">→</span></button>}
    </header>
  )
}
