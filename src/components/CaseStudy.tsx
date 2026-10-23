import { useEffect, useRef } from 'react'
import type { Project } from '../content/portfolio'

export function CaseStudy({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (project) dialog.current?.showModal()
    else dialog.current?.close()
  }, [project])
  return (
    <dialog className="case-study" ref={dialog} aria-labelledby="case-title" onCancel={(event) => { event.preventDefault(); onClose() }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]'))
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (controls.length === 1 || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault()
          ;(event.shiftKey ? last : first)?.focus()
        }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      {project && <div className="case-content">
        <div className="window-bar"><span>CASE STUDY / {project.number}</span><button type="button" className="window-close" onClick={onClose} aria-label="Close case study">×</button></div>
        <div className="case-inner">
          <p className="eyebrow">{project.employer} · Client: {project.client} · {project.period}</p>
          <h2 id="case-title">{project.title}</h2>
          <div className="tags">{project.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div>
          <h3>The problem</h3><p>{project.problem}</p>
          <h3>My contribution</h3><p>{project.role}</p>
          <h3>Technical decisions</h3><ul>{project.decisions.map((decision) => <li key={decision}>{decision}</li>)}</ul>
          <h3>Documented outcomes</h3><ul>{project.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
          <p className="case-note">Employer/client project. Details and outcomes are drawn from my résumé; public source code and demos are not available here.</p>
          <button className="button secondary case-back" type="button" onClick={onClose}>Back to projects →</button>
        </div>
      </div>}
    </dialog>
  )
}
