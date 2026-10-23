import { useState } from 'react'
import type { AudioManager } from '../audio/AudioManager'
import { profile, type Project } from '../content/portfolio'
import { CaseStudy } from './CaseStudy'
import { CareerJourney } from './CareerJourney'
import { personalProjects } from '../content/personalProjects'
import { CityBackdrop } from '../scenes/CityFlight'

const destinations = [['About Me', 'about'], ['Experience', 'experience'], ['Projects', 'projects'], ['Experiments', 'experiments'], ['Contact', 'contact']] as const

export function Portfolio({ audio, onReplay, reducedMotion, fallback }: { audio: AudioManager; onReplay: () => void; reducedMotion: boolean; fallback: boolean }) {
  const [project, setProject] = useState<Project | null>(null)
  const [year, setYear] = useState(2018)
  return (
    <main id="portfolio" tabIndex={-1} data-testid="portfolio">
      <section className="portfolio-hero landing-hero" id="top" aria-labelledby="hero-title">
        <div className="hero-art city-art" aria-hidden="true"><CityBackdrop /></div>
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy landing-copy content-width">
          <div className="hero-glass" onAnimationStart={(event) => { if (event.target === event.currentTarget && !reducedMotion) audio.cue('glass') }}>
          <h1 id="hero-title" className="pixel">{profile.name}</h1>
          <p className="hero-role">{profile.title}</p>
          <p className="hero-description">From enterprise foundations in 2018 to connected systems and AI-assisted development in 2026.</p>
          <div className="hero-actions"><a className="button primary" href="#projects">Explore my journey <span aria-hidden="true">↗</span></a><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">View résumé <span aria-hidden="true">↗</span></a></div>
          </div>
          <nav className="bubble-navigation" aria-label="Explore portfolio">{destinations.map(([label, id], index) => <a className="navigation-bubble" onAnimationStart={(event) => { if (event.target === event.currentTarget && event.animationName === 'bubble-arrive' && !reducedMotion) audio.cue('bubble', index) }} href={`#${id}`} key={id} style={{ animationDelay: `${index * 80}ms` }}><span className="bubble-number" aria-hidden="true">0{index + 1}</span><span>{label}</span><span aria-hidden="true">↗</span></a>)}</nav>
        </div>
        <div className="hero-bottom content-width"><button type="button" onClick={onReplay} className="replay-button" disabled={reducedMotion}>{reducedMotion ? 'Reduced motion enabled' : '↻ Replay the introduction'}</button></div>
      </section>

      <section id="experience" className="section projects-section content-width" aria-labelledby="projects-title"><div id="projects">
        <CareerJourney year={year} onYearChange={setYear} onProject={setProject} reducedMotion={reducedMotion} />
      </div></section>

      <section id="about" className="section about-section content-width" aria-labelledby="about-title">
        <div><p className="eyebrow">02 / A LITTLE ABOUT ME</p><h2 id="about-title">Curiosity, with<br />a practical side.</h2><div className="about-pixel-mark" aria-hidden="true">{'{ }'}</div></div>
        <div className="about-copy"><p>I’m Swathi, a full-stack developer and technical lead based in the Bay Area. I work where frontend architecture, enterprise workflows, and backend systems meet.</p><p>My work spans React and TypeScript, micro-frontends, reusable design systems, and Java/Spring Boot services. I enjoy turning a complicated workflow into something people can understand and use.</p><p>I also use AI-assisted development tools and am building foundational knowledge of LLMs, retrieval pipelines, and vector databases.</p><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">The full story, on my résumé ↗</a></div>
      </section>

      <section id="career-summary" className="section content-width" aria-labelledby="experience-title">
        <div className="section-heading"><div><p className="eyebrow">03 / EMPLOYERS & CLIENTS</p><h2 id="experience-title">The teams behind the work.</h2></div></div>
        <div className="experience-row"><p className="experience-date">MAR 2024 — PRESENT</p><div><h3>HCLTech</h3><p>Senior Software Engineer / Technical Lead</p><span>Client: Verizon</span><a className="text-link experience-chapter-link" href="#projects" onClick={() => setYear(2024)}>Explore this chapter →</a></div><p>Operations platforms, federated frontends, reusable UI systems, automation, and real-time IoT dashboards.</p></div>
        <div className="experience-row"><p className="experience-date">OCT 2018 — MAR 2024</p><div><h3>TCS</h3><p>Web Developer, Full-Stack</p><span>Client: Citigroup</span><a className="text-link experience-chapter-link" href="#projects" onClick={() => setYear(2018)}>Explore this chapter →</a></div><p>Mortgage application modernization, Angular SSR, enterprise API integration, accessibility, and delivery across teams.</p></div>
      </section>

      <section id="experiments" className="section personal-projects-section content-width" aria-labelledby="experiments-title">
        <div className="section-heading"><div><p className="eyebrow">04 / INSIDE THE JOURNEY</p><h2 id="experiments-title">Ideas I brought to life.</h2></div><p>From daily rituals to wearable pixels.<br />Personal projects across web and hardware.</p></div>
        <div className="personal-project-grid">{personalProjects.map((item, index) => <article className={`personal-project personal-project-${item.id}`} key={item.id} aria-labelledby={`${item.id}-title`}>
          <div className="window-bar"><span>0{index + 1} / {item.id}</span><span className="window-controls" aria-hidden="true"><i /><i /></span></div>
          <div className="personal-project-body">
            <p className="eyebrow">{item.category}</p>
            <h3 id={`${item.id}-title`} className="pixel">{item.name}</h3>
            <p className="personal-tagline">{item.tagline}</p>
            <p>{item.description}</p><p>{item.detail}</p>
            <p className="stack-label">BUILT WITH</p><div className="tags">{item.technologies.map(tool => <span key={tool}>{tool}</span>)}</div>
          </div>
        </article>)}</div>
        <div className="portfolio-engineering"><div><span className="pixel">BEHIND THIS PORTFOLIO</span><p>Layered sprites, a perspective-projected city, synchronized sound cues, and an interruptible camera timeline.</p></div><button type="button" className="button secondary" onClick={onReplay} disabled={reducedMotion}>{reducedMotion ? 'Motion respects your preferences' : 'Replay the journey →'}</button></div>
      </section>

      <section id="contact" className="section contact-section content-width" aria-labelledby="contact-title"><p className="eyebrow">05 / LET’S CONNECT</p><h2 id="contact-title">What could we<br />build together?</h2><a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<span aria-hidden="true">↗</span></a><div className="contact-links"><a className="text-link" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">Résumé ↗</a></div></section>
      <footer className="site-footer content-width"><span className="pixel">SWATHI / MADE WITH PERSPECTIVE</span><span>{fallback ? 'A quieter, static view.' : 'Early prototype · artwork in progress'}</span><a href="#top">Back to top ↑</a></footer>
      <CaseStudy project={project} onClose={() => setProject(null)} />
    </main>
  )
}
