import { useState } from 'react'
import { profile, projects, type Project } from '../content/portfolio'
import { CaseStudy } from './CaseStudy'

export function Portfolio({ onReplay, reducedMotion, fallback }: { onReplay: () => void; reducedMotion: boolean; fallback: boolean }) {
  const [project, setProject] = useState<Project | null>(null)
  return (
    <main id="portfolio" tabIndex={-1} data-testid="portfolio">
      <section className="portfolio-hero" id="top" aria-labelledby="hero-title">
        <div className="hero-art" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy content-width">
          <p className="eyebrow"><span className="status-dot" /> FROM THE SAN FRANCISCO BAY AREA</p>
          <h1 id="hero-title">Good systems.<br /><span>A little perspective.</span></h1>
          <p className="hero-name">{profile.name}</p>
          <p className="hero-role">{profile.title}</p>
          <p className="hero-description">I connect thoughtful interfaces with the systems behind them.<br className="desktop-break" /> Eight-plus years building enterprise experiences, one project at a time.</p>
          <div className="hero-actions"><a className="button primary" href="#projects">Explore my work <span aria-hidden="true">↗</span></a><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">View résumé <span aria-hidden="true">↗</span></a></div>
        </div>
        <div className="hero-bottom content-width"><span className="pixel">A DIFFERENT KIND OF VIEW.</span><button type="button" onClick={onReplay} className="replay-button" disabled={reducedMotion}>{reducedMotion ? 'Reduced motion · still a great view' : '↻ Replay the introduction'}</button></div>
      </section>

      <section id="projects" className="section projects-section content-width" aria-labelledby="projects-title">
        <div className="section-heading"><div><p className="eyebrow">01 / SELECTED WORK</p><h2 id="projects-title">Built for the real world.</h2></div><p>Complex problems.<br />Clearer experiences.</p></div>
        <div className="project-grid">{projects.map((item) => <article key={item.id} className="project-window">
          <div className="window-bar"><span>{item.number} / {item.id}.project</span><span className="window-controls" aria-hidden="true"><i /><i /></span></div>
          <div className="project-body"><p className="project-client">{item.employer} · Client: {item.client}</p><h3>{item.shortTitle}</h3><p className="project-description">{item.description}</p><div className="tags">{item.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div><div className="project-outcome"><strong>{item.metric}</strong><span>{item.metricLabel}</span></div><button className="case-button" type="button" onClick={() => setProject(item)} aria-label={`Read case study: ${item.title}`}>Read case study <span aria-hidden="true">↗</span></button></div>
        </article>)}</div>
      </section>

      <section id="about" className="section about-section content-width" aria-labelledby="about-title">
        <div><p className="eyebrow">02 / A LITTLE ABOUT ME</p><h2 id="about-title">Curiosity, with<br />a practical side.</h2><div className="about-pixel-mark" aria-hidden="true">{'{ }'}</div></div>
        <div className="about-copy"><p>I’m Swathi, a full-stack developer and technical lead based in the Bay Area. I work where frontend architecture, enterprise workflows, and backend systems meet.</p><p>My work spans React and TypeScript, micro-frontends, reusable design systems, and Java/Spring Boot services. I enjoy turning a complicated workflow into something people can understand and use.</p><p>I also use AI-assisted development tools and am building foundational knowledge of LLMs, retrieval pipelines, and vector databases.</p><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">The full story, on my résumé ↗</a></div>
      </section>

      <section id="experience" className="section content-width" aria-labelledby="experience-title">
        <div className="section-heading"><div><p className="eyebrow">03 / THE PATH SO FAR</p><h2 id="experience-title">Experience that connects.</h2></div></div>
        <div className="experience-row"><p className="experience-date">MAR 2024 — PRESENT</p><div><h3>HCLTech</h3><p>Senior Software Engineer / Technical Lead</p><span>Client: Verizon</span></div><p>Operations platforms, federated frontends, reusable UI systems, automation, and real-time IoT dashboards.</p></div>
        <div className="experience-row"><p className="experience-date">OCT 2018 — MAR 2024</p><div><h3>TCS</h3><p>Web Developer, Full-Stack</p><span>Client: Citigroup</span></div><p>Mortgage application modernization, Angular SSR, enterprise API integration, accessibility, and delivery across teams.</p></div>
      </section>

      <section id="experiments" className="section experiment-section content-width" aria-labelledby="experiments-title"><div><p className="eyebrow">04 / ROOM TO EXPLORE</p><h2 id="experiments-title">A Bay Area,<br />in pixels.</h2><p>A small exploration of layered scenery, a curious character,<br className="desktop-break" /> and the space between software and storytelling.</p></div><div className="experiment-detail"><span className="pixel experiment-label">YOU’RE IN IT.</span><p>First prototype · mountains & character</p><button type="button" className="button secondary" onClick={onReplay} disabled={reducedMotion}>{reducedMotion ? 'Motion respects your preferences' : 'Take the scenic route →'}</button></div></section>

      <section id="contact" className="section contact-section content-width" aria-labelledby="contact-title"><p className="eyebrow">05 / LET’S CONNECT</p><h2 id="contact-title">What could we<br />build together?</h2><a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<span aria-hidden="true">↗</span></a><div className="contact-links"><a className="text-link" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a><a className="text-link" href={profile.resume} target="_blank" rel="noreferrer">Résumé ↗</a></div></section>
      <footer className="site-footer content-width"><span className="pixel">SWATHI / MADE WITH PERSPECTIVE</span><span>{fallback ? 'A quieter, static view.' : 'Early prototype · artwork in progress'}</span><a href="#top">Back to top ↑</a></footer>
      <CaseStudy project={project} onClose={() => setProject(null)} />
    </main>
  )
}
