import { CharacterRestScene } from './CharacterRestScene'
import { PosingCharacter } from './PosingCharacter'
import { IdleCharacter } from './IdleCharacter'
import { CharacterPortrait } from './CharacterPortrait'

const messages: Record<string, string> = {
  about: 'Hi, I’m Swathi. Let me share a little about how I work.',
  experience: 'Start with Citi, then follow the work into Verizon. Each stop adds a new perspective.',
  projects: 'Six stops tell the Citi project story. Choose a year to explore the decisions behind the work.',
  experiments: 'These are ideas I brought to life beyond my enterprise work: Ritual and Jada.bit.',
  contact: 'Have something in mind? Here’s where we can connect.',
  'career-summary': 'Here are the clients and teams behind the projects.',
}

export function CharacterGuide({ section, onReturn, reducedMotion }: { section: string; onReturn: () => void; reducedMotion: boolean }) {
  const poses = section === 'experience' || section === 'career-summary'
  return <div className={`section-character-guide ${section === 'about' || poses || section === 'experiments' ? 'illustrated-guide' : ''}`} data-guide-section={section}>
    {section === 'experiments' ? <CharacterPortrait /> : section === 'about' ? <CharacterRestScene /> : poses ? <PosingCharacter reducedMotion={reducedMotion} pose={section === 'career-summary' ? 'flex' : 'dab'} /> : section === 'contact' ? null : <IdleCharacter />}
    <p>{messages[section]}</p>
    <a href="#portfolio-menu" onClick={event => { event.preventDefault(); onReturn() }} className="guide-back">← Back to menu</a>
  </div>
}
