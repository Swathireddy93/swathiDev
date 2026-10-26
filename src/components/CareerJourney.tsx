import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { gsap } from 'gsap'
import { experience } from '../config/experience'
import { chapterForYear } from '../content/career'
import { projects, type Project } from '../content/portfolio'

const years = Array.from({ length: experience.journey.lastYear - experience.journey.firstYear + 1 }, (_, i) => experience.journey.firstYear + i)

export function CareerJourney({ year, onYearChange, onProject, reducedMotion, dialogOpen, storyControlled, onPauseStory }: {
  year: number; onYearChange: (year: number) => void; onProject: (project: Project) => void; reducedMotion: boolean; dialogOpen: boolean; storyControlled: boolean; onPauseStory: () => void
}) {
  const [playing, setPlaying] = useState(!storyControlled)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  const panel = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const buttons = useRef<Record<number, HTMLButtonElement | null>>({})
  const chapter = chapterForYear(year)
  const visibleProjects = chapter.projectIds.map(id => projects.find(project => project.id === id)).filter((project): project is Project => !!project)
  const playEnabled = !reducedMotion && (playing || storyControlled)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .5), { threshold: .5 })
    if (rail.current) observer.observe(rail.current)
    const visibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  useLayoutEffect(() => {
    if (reducedMotion) return
    const animation = gsap.context(() => {
      gsap.fromTo(panel.current, { autoAlpha: .2, y: 16 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out' })
      const node = buttons.current[year]?.querySelector('.year-node')
      if (node) gsap.fromTo(node, { y: 0 }, { y: -12, duration: .18, repeat: 1, yoyo: true, ease: 'power2.out' })
    })
    return () => animation.revert()
  }, [year, reducedMotion])

  useEffect(() => {
    if (storyControlled || !playEnabled || !inView || !pageVisible || dialogOpen) return
    const timer = window.setTimeout(() => {
      if (year < experience.journey.lastYear) onYearChange(year + 1)
      else setPlaying(false)
    }, experience.journey.hopMs)
    return () => window.clearTimeout(timer)
  }, [storyControlled, playEnabled, inView, pageVisible, dialogOpen, year, onYearChange])

  useEffect(() => {
    const button = buttons.current[year]
    if (button && rail.current) {
      const target = button.offsetLeft - rail.current.clientWidth / 2 + button.offsetWidth / 2
      rail.current.scrollTo({ left: target, behavior: reducedMotion ? 'instant' : 'smooth' })
    }
  }, [year, reducedMotion])

  const select = (next: number) => { setPlaying(false); onYearChange(next) }
  const key = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = event.key === 'Home' ? years[0] : event.key === 'End' ? years.at(-1)!
      : event.key === 'ArrowRight' ? Math.min(year + 1, years.at(-1)!) : event.key === 'ArrowLeft' ? Math.max(year - 1, years[0]) : undefined
    if (next === undefined) return
    event.preventDefault(); select(next); buttons.current[next]?.focus()
  }

  return <>
    <div className="section-heading"><div><p className="eyebrow">01 / A CAREER IN MOTION</p><h2 id="projects-title">Every year, a new perspective.</h2></div><p>2018 — 2026<br />Choose a year. Follow the work.</p></div>
    <div className="journey-controls">
      <span className="pixel">MY TECH STORY</span>
      <button type="button" className="timeline-play" disabled={reducedMotion} aria-pressed={playEnabled} onClick={() => {
        if (storyControlled) { onPauseStory(); setPlaying(false); return }
        if (!playing && year === years.at(-1)) onYearChange(years[0])
        setPlaying(!playing)
      }}>{playEnabled ? 'Pause timeline' : 'Play timeline'} <span aria-hidden="true">{playEnabled ? 'Ⅱ' : '▷'}</span></button>
    </div>
    <div className="year-scroll" ref={rail}>
      <div className="year-rail" role="tablist" aria-label="Career year">
        <div className="year-track" aria-hidden="true"><i style={{ transform: `scaleX(${(year - years[0]) / (years.length - 1)})` }} /></div>
        {years.map(item => <button key={item} ref={button => { buttons.current[item] = button }} type="button" role="tab"
          id={`year-${item}`} aria-controls="career-panel" aria-selected={year === item} tabIndex={year === item ? 0 : -1}
          onKeyDown={key} onClick={() => select(item)} className="year-tab"><span className="year-node" aria-hidden="true" /><span>{item}</span></button>)}
      </div>
      <div className="project-era-rail">
        <div className={`project-era ${year <= 2023 ? 'is-current' : ''}`}>
          <span className="era-bracket" aria-hidden="true" />
          <span className="era-label"><span className="era-dot" aria-hidden="true" />Where my foundations took shape <span>· Oct 2018 – Mar 2024</span></span>
        </div>
      </div>
    </div>
    <div id="career-panel" role="tabpanel" aria-labelledby={`year-${year}`} tabIndex={0} ref={panel} className="career-panel" data-year={year}>
      <div className="career-chapter">
        <div className="chapter-year"><span className="pixel">{year}</span><span>{chapter.period}</span></div>
        <div className="chapter-story"><p className="eyebrow">{chapter.employer} · Client: {chapter.client}</p>{chapter.storyStep && <p className="story-step pixel">{chapter.storyStep}</p>}<h3>{chapter.title}</h3><p className="chapter-role">{chapter.role}</p><p>{chapter.summary}</p>
          <p className="stack-label">{chapter.stackLabel}</p><div className="tags">{chapter.tools.map(tool => <span key={tool}>{tool}</span>)}</div>
          {chapter.exploration && <div className="ai-exploration"><p className="stack-label">LEARNING & EXPLORATION</p><div className="tags">{chapter.exploration.map(tool => <span key={tool}>{tool}</span>)}</div></div>}
        </div>
      </div>
      {chapter.note && <p className="chapter-note">{chapter.note}</p>}
      {chapter.storyStep ? <div className="citi-case-link"><span>One project · six perspectives · Oct 2018 – Mar 2024</span><button className="button secondary case-study-trigger" type="button" onClick={() => onProject(visibleProjects[0])} aria-label="Read case study: Mortgage Application Modernization">Read the full Citi case study ↗</button></div> : <div className="project-grid">{visibleProjects.map(item => <article key={item.id} className="project-window">
        <div className="window-bar"><span>{item.number} / {item.windowLabel ?? `${item.id}.project`}</span><span className="window-controls" aria-hidden="true"><i /><i /></span></div>
        <div className="project-body"><p className="project-client">{item.period}</p><h3>{item.shortTitle}</h3><p className="project-description">{item.description}</p><div className="tags">{item.technologies.map(tech => <span key={tech}>{tech}</span>)}</div><div className="project-outcome"><strong>{item.metric}</strong><span>{item.metricLabel}</span></div><button className="case-button case-study-trigger" type="button" onClick={() => onProject(item)} aria-label={`Read case study: ${item.title}`}>Read case study <span aria-hidden="true">↗</span></button></div>
      </article>)}</div>}
    </div>
    <div className="year-steppers"><button type="button" disabled={year === years[0]} onClick={() => select(year - 1)} aria-label="Previous year">← Previous year</button><span className="pixel">{year} / 2026</span><button type="button" disabled={year === years.at(-1)} onClick={() => select(year + 1)} aria-label="Next year">Next year →</button></div>
  </>
}
