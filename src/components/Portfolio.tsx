import { useCallback, useState } from 'react'
import type { AudioManager } from '../audio/AudioManager'
import { profile, type Project } from '../content/portfolio'
import { CaseStudy } from './CaseStudy'
import { CareerJourney } from './CareerJourney'
import { personalProjects } from '../content/personalProjects'
import { PhotographySection } from './PhotographySection'
import { OrbitalNavigation } from './OrbitalNavigation'
import { CharacterGuide } from './CharacterGuide'
import { ThinkingCharacter } from './ThinkingCharacter'
import { CityBackdrop } from '../scenes/CityFlight'
import { usePortfolioStory } from '../hooks/usePortfolioStory'
import { MovieControls } from './MovieControls'
import { menuPosition } from '../story/menuPosition'
import { MovieEnding } from './MovieEnding'

export function Portfolio({ audio, onReplay, reducedMotion, fallback, ending, onMovieEnd, onMovieLoop, onMovieExit }: { audio: AudioManager; onReplay: () => void; reducedMotion: boolean; fallback: boolean; ending: boolean; onMovieEnd: () => void; onMovieLoop: () => void; onMovieExit: () => void }) {
  const [project, setProject] = useState<Project | null>(null)
  const [year, setYear] = useState(2018)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [sectionVisit, setSectionVisit] = useState(0)
  const selectSection = useCallback((section: string) => { setSelectedSection(section); setSectionVisit(value => value + 1); if (section === 'projects') setYear(2018) }, [])
  const story = usePortfolioStory({ reducedMotion: reducedMotion || fallback, navigate: selectSection, year: setYear, ending: onMovieEnd, restart: onMovieLoop })
  const exitEnding = () => { story.pause(); onMovieExit() }
  const navigate = (section: string) => { story.pause(); selectSection(section) }
  const guideKey = (section: string) => `${section}-${selectedSection === section ? sectionVisit : 0}`
  const returnToMenu = () => {
    story.pause()
    setSelectedSection(null)
    requestAnimationFrame(() => {
      const menu = document.getElementById('portfolio-menu')
      if (menu) window.scrollTo({ top: menuPosition(menu), behavior: reducedMotion ? 'instant' : 'smooth' })
      menu?.focus({ preventScroll: true })
    })
  }
  return (
    <main id="portfolio" tabIndex={-1} data-testid="portfolio">
      <div inert={ending} aria-hidden={ending || undefined}>
      <section className="portfolio-hero landing-hero" id="top" aria-labelledby="hero-title">
        <div className="city-panorama" aria-hidden="true"><CityBackdrop /></div>
        <div className="hero-copy landing-copy content-width">
          <div className="hero-introduction" onAnimationStart={(event) => { if (event.target === event.currentTarget && !reducedMotion) audio.cue('glass') }}>
          <h1 id="hero-title" className="pixel">{profile.name}</h1>
          <p className="hero-role">{profile.title}</p>
          <p className="hero-description">From enterprise foundations in 2018 to connected systems and AI-assisted development in 2026.</p>
          <div className="hero-actions"><a className="button primary" href="#projects">Explore my journey <span aria-hidden="true">↗</span></a><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">View résumé <span aria-hidden="true">↗</span></a></div>
          </div>
          <OrbitalNavigation audio={audio} reducedMotion={reducedMotion} onNavigate={navigate} storyActive={story.snapshot.status === 'waiting' || story.snapshot.status === 'playing'} storyPeek={story.snapshot.peek} />
        </div>
        <div className="hero-bottom content-width"><button type="button" onClick={onReplay} className="replay-button" disabled={reducedMotion}>{reducedMotion ? 'Reduced motion enabled' : '↻ Replay the introduction'}</button></div>
      </section>

      <section id="projects" className="section projects-section content-width" aria-labelledby="projects-title">
        <CharacterGuide key={guideKey('projects')} section="projects" onReturn={returnToMenu} reducedMotion={reducedMotion} />
        <CareerJourney key={selectedSection === 'projects' ? `journey-${sectionVisit}` : 'journey'} year={year} onYearChange={setYear} onProject={item => { story.pause(); setProject(item) }} reducedMotion={reducedMotion} dialogOpen={project !== null} storyControlled={story.snapshot.status === 'playing'} onPauseStory={story.pause} />
      </section>

      <section id="about" className="section about-section content-width" aria-labelledby="about-title">
        <CharacterGuide key={guideKey('about')} section="about" onReturn={returnToMenu} reducedMotion={reducedMotion} />
        <div><p className="eyebrow">02 / A LITTLE ABOUT ME</p><h2 id="about-title">Curiosity, with<br />a practical side.</h2><div className="about-pixel-mark" aria-hidden="true">{'{ }'}</div></div>
        <div className="about-copy">
          <p>Hey, I'm Swathi!</p>
          <p>I've been building things with code since 2018. What started as a career in software development slowly became something I genuinely enjoy - figuring out how things work, making complicated things simpler, and bringing ideas to life.</p>
          <p>Over the years, I've worked on complex enterprise applications, grown into a technical lead and learned that good engineering isn't just about making things work. It's also about making them work well for the people using them.</p>
          <p>But my curiosity doesn't really clock out after work.</p>
          <p>I love experimenting with design, exploring new technology and occasionally getting carried away with an idea just to see if I can build it. From websites to programmable hardware, some of my favorite projects started with a simple, <em>"Wait, what if I tried this?"</em></p>
          <p>And now, with AI changing what's possible, there's even more to explore. The tools are evolving, but I still believe that knowing what to build, why it matters, and how it should feel is just as important as knowing how to build it.</p>
          <p><strong>So, this little corner of the internet is a mix of what I've learned, what I've built and everything I'm still curious about.</strong></p>
          <a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">The full story, on my résumé ↗</a>
        </div>
      </section>

      <section id="experience" className="section content-width" aria-labelledby="experience-title"><div id="career-summary">
        <CharacterGuide key={guideKey('experience')} section="experience" onReturn={returnToMenu} reducedMotion={reducedMotion} />
        <div className="section-heading"><div><p className="eyebrow">03 / EMPLOYERS & CLIENTS</p><h2 id="experience-title">The teams behind the work.</h2></div></div>
        <div className="experience-row"><p className="experience-date">MAR 2024 — PRESENT</p><div><h3>Client: Verizon</h3><p>Senior Software Engineer / Technical Lead</p><span>HCLTech</span><a className="text-link experience-chapter-link" href="#projects" onClick={() => setYear(2024)}>Explore this chapter →</a></div><p>Operations platforms, federated frontends, reusable UI systems, automation and real-time IoT dashboards.</p></div>
        <div className="experience-row"><p className="experience-date">OCT 2018 — MAR 2024</p><div><h3>Client: Citigroup</h3><p>Web Developer, Full-Stack</p><span>TCS</span><a className="text-link experience-chapter-link" href="#projects" onClick={() => setYear(2018)}>Explore this chapter →</a></div><p>Mortgage application modernization, Angular SSR, enterprise API integration, accessibility and delivery across teams.</p></div>
      </div></section>

      <section id="experiments" className="section personal-projects-section content-width" aria-labelledby="experiments-title">
        <CharacterGuide key={guideKey('experiments')} section="experiments" onReturn={returnToMenu} reducedMotion={reducedMotion} />
        <div className="section-heading"><div><p className="eyebrow">04 / BEYOND WORK</p><h2 id="experiments-title">Ideas I brought to life.</h2></div><p>Web, wearables and photography.<br />Curiosity beyond the day job.</p></div>
        <div className="personal-project-grid">{personalProjects.map((item, index) => <article className={`personal-project personal-project-${item.id}`} key={item.id} aria-labelledby={`${item.id}-title`}>
          <div className="window-bar"><span>0{index + 1} / {item.id}</span><span className="window-controls" aria-hidden="true"><i /><i /></span></div>
          <div className="personal-project-body">
            <p className="eyebrow">{item.category}</p>
            <h3 id={`${item.id}-title`} className="pixel">{item.name}</h3>
            <p className="personal-tagline">{item.tagline}</p>
            {item.website && <p><a className="text-link personal-site" href={item.website} target="_blank" rel="noreferrer">Visit {item.name} ↗</a></p>}
            {item.repository && <div className="project-repository">
              {item.repository.url ? <a className="button secondary" href={item.repository.url} target="_blank" rel="noreferrer"><span aria-hidden="true">&lt;/&gt;</span> {item.repository.label ?? 'GitHub repository'} ↗</a> :
                <span className="button secondary repository-placeholder github-placeholder"><span aria-hidden="true">&lt;/&gt;</span> GitHub link coming soon</span>}
            </div>}
            {item.introduction && <p className="personal-introduction">{item.introduction}</p>}
            <p>{item.description}</p><p>{item.detail}</p>
            <p className="stack-label">BUILT WITH</p><div className="tags">{item.technologies.map(tool => <span key={tool}>{tool}</span>)}</div>
          </div>
        </article>)}</div>
        <PhotographySection audio={audio} reducedMotion={reducedMotion} />
        <section className="github-projects" aria-labelledby="github-projects-title" id="github-projects">
          <div className="window-bar"><span>GITHUB / WORKSPACE</span><span className="build-status"><i aria-hidden="true" />IN DEVELOPMENT</span></div>
          <div className="github-projects-body">
            <div><p className="eyebrow">GITHUB PROJECTS</p><h3 id="github-projects-title">Builds in progress.</h3><p>Experiments, practical tools and ideas taking shape. Selected repositories will appear here as they’re ready to share.</p></div>
            {profile.github ? <a className="text-link" href={profile.github} target="_blank" rel="noreferrer">Explore my GitHub ↗</a> : <span className="text-link github-placeholder">GitHub link coming soon</span>}
          </div>
        </section>
        <div className="portfolio-engineering"><div><span className="pixel">BEHIND THIS PORTFOLIO</span><p>A hands-free story of my career, projects and curiosity. Built with React and TypeScript, with PixiJS for pixel-art scenes, GSAP for motion and Howler.js for sound. It brings the component-based thinking I use in enterprise engineering into a creative experience, with each animation planned to guide the story while keeping navigation in your hands.</p></div><button type="button" className="button secondary" onClick={onReplay} disabled={reducedMotion}>{reducedMotion ? 'Motion respects your preferences' : 'Replay the journey →'}</button></div>
      </section>

      <section id="contact" className="section contact-section content-width" aria-labelledby="contact-title"><CharacterGuide key={guideKey('contact')} section="contact" onReturn={returnToMenu} reducedMotion={reducedMotion} /><p className="eyebrow">05 / LET’S CONNECT</p><div className="contact-scene"><h2 id="contact-title"><span>What could we</span><span>build together?</span></h2><ThinkingCharacter key={`thinker-${guideKey('contact')}`} reducedMotion={reducedMotion} /></div><a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<span aria-hidden="true">↗</span></a><div className="contact-links">{profile.github ? <a className="text-link" href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a> : <span className="text-link github-placeholder">GitHub link coming soon</span>}<a className="text-link" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">Résumé ↗</a></div></section>
      <footer className="site-footer content-width"><span className="pixel">SWATHI / MADE WITH PERSPECTIVE</span><span>{fallback ? 'A quieter, static view.' : 'Early prototype · artwork in progress'}</span><a href="#top">Back to top ↑</a></footer>
      </div>
      <MovieControls story={story.snapshot} onPause={story.pause} onPlay={story.play} />
      {ending && <MovieEnding audio={audio} playing={story.snapshot.status === 'playing'} onExit={exitEnding} />}
      <CaseStudy project={project} onClose={() => setProject(null)} />
    </main>
  )
}
