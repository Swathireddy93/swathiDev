/** The same signature stays visible when the movie hands over to its farewell. */
export function PortfolioCredits({ fallback }: { fallback: boolean }) {
  return <><span className="pixel">SWATHI / MADE WITH PERSPECTIVE</span><span>{fallback ? 'A quieter, static view.' : 'Early prototype · artwork in progress'}</span></>
}
