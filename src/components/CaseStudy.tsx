import { useEffect, useRef } from 'react'
import type { Project } from '../content/portfolio'
import { ProjectDetails } from './ProjectDetails'

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
        <ProjectDetails project={project} titleId="case-title" onClose={onClose} />
      </div>}
    </dialog>
  )
}
