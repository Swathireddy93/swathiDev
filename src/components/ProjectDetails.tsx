import type { Project } from '../content/portfolio'

/** The existing project case-study content, available during manual exploration. */
export function ProjectDetails({ project, titleId, onClose }: { project: Project; titleId: string; onClose: () => void }) {
  return <div className="case-inner">
    <p className="eyebrow">{project.employer} · Client: {project.client} · {project.period}</p>
    <h2 id={titleId}>{project.title}</h2>
    <div className="tags">{project.technologies.map(tech => <span key={tech}>{tech}</span>)}</div>
    <h3>The problem</h3><p>{project.problem}</p>
    <h3>My contribution</h3><p>{project.role}</p>
    <h3>Technical decisions</h3><ul>{project.decisions.map(decision => <li key={decision}>{decision}</li>)}</ul>
    <h3>Documented outcomes</h3><ul>{project.outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul>
    <p className="case-note">Employer/client project. Details and outcomes are drawn from my résumé; public source code and demos are not available here.</p>
    <button className="button secondary case-back" type="button" onClick={onClose}>Back to projects →</button>
  </div>
}
