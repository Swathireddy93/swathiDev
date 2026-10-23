export interface Project {
  id: string
  number: string
  title: string
  shortTitle: string
  employer: string
  client: string
  period: string
  description: string
  technologies: string[]
  metric: string
  metricLabel: string
  problem: string
  role: string
  decisions: string[]
  outcomes: string[]
}

export const profile = {
  name: 'Swathi Shivashankar Reddy',
  title: 'Senior Full Stack Developer & Technical Lead',
  location: 'San Francisco Bay Area',
  email: 'swathisreddy.work@gmail.com',
  linkedin: 'https://www.linkedin.com/in/swathishivashankar1993',
  resume: `${import.meta.env.BASE_URL}swathi-reddy-resume.pdf`,
}

export const projects: Project[] = [
  {
    id: 'magna', number: '01', title: 'Magna Billing Operations Platform', shortTitle: 'Magna billing',
    employer: 'HCLTech', client: 'Verizon', period: 'Jan 2026 — present',
    description: 'One operations portal. Fewer handoffs. A clearer picture of complex billing workflows.',
    technologies: ['React', 'Spring Boot', 'Oracle'],
    metric: '65%', metricLabel: 'less operational context switching',
    problem: 'Billing monitoring was spread across six monitoring workflows and five regional systems. Operators needed a unified way to follow bill cycles, SLAs, alerts, and job states.',
    role: 'Built the unified React operations portal and asynchronous Java/Spring Boot services, and led technical design, cross-team coordination, and CI/CD delivery within the Magna ecosystem.',
    decisions: [
      'Connected the React portal to Spring Boot REST APIs and Oracle for monitoring, SLA tracking, and alerts.',
      'Used Quartz Scheduler for 65 parallel data-ingestion workflows.',
      'Designed a YAML- and database-driven Action Engine for REST and shell triggers on job-state transitions, reducing the need for code changes when onboarding workflow rules.',
    ],
    outcomes: [
      '65% reduction in operational context switching and 40% less manual job-status verification time.',
      '35% increase in background processing throughput.',
      'Workflow-rule onboarding reduced from two weeks to under three hours.',
    ],
  },
  {
    id: 'ecommerce', number: '02', title: 'Ecommerce Gateway Platform', shortTitle: 'Connected commerce',
    employer: 'HCLTech', client: 'Verizon', period: 'Sep 2025 — Jan 2026',
    description: 'A shared foundation for six independently deployable frontend applications.',
    technologies: ['React 19', 'TypeScript', 'Module Federation'],
    metric: '6', metricLabel: 'federated micro-frontends',
    problem: 'Multiple frontend applications needed independent delivery while sharing navigation, UI conventions, and dependencies.',
    role: 'Architected the React 19 shell, built a reusable UI kit, implemented state management, and automated workspace delivery workflows.',
    decisions: [
      'Combined React Router, Vite, and Module Federation with shared singleton dependencies.',
      'Built an 18-component React/TypeScript UI kit using Verizon VDS for shared controls.',
      'Used Redux Toolkit with runtime reducer injection, persisted domain slices, and typed selectors; normalized API data and handled Axios request cancellation.',
    ],
    outcomes: [
      'Six federated micro-frontends with independent deployment enabled.',
      'Shared controls standardized across six frontend applications.',
      'Build, test, lint, and preview workflows automated across seven Vite workspaces; six independently previewable remote bundles.',
    ],
  },
  {
    id: 'mortgage', number: '03', title: 'Mortgage Application Modernization', shortTitle: 'Modernizing mortgages',
    employer: 'TCS', client: 'Citigroup', period: 'Oct 2018 — Mar 2024',
    description: 'Moving legacy workflows toward a more accessible, maintainable application architecture.',
    technologies: ['Angular 13', 'TypeScript', 'Java / REST'],
    metric: '90%', metricLabel: 'unit-test coverage on one mortgage workflow',
    problem: 'Legacy mortgage applications needed modernization of rendering, core workflows, API integration, accessibility, and performance.',
    role: 'Led migration from client-side rendering to Angular 13 server-side rendering, redesigned workflows and architecture, and coordinated with more than ten engineering, QA, and product teams.',
    decisions: [
      'Migrated a legacy application to Angular 13 SSR and integrated enterprise REST APIs with validation, error handling, and pagination.',
      'Applied lazy loading, optimized change detection, and memoization; used Angular security and DOM sanitization to mitigate XSS risks.',
      'Used Jasmine/Karma for unit tests, and Lighthouse, NVDA, and axe for accessibility and performance audits.',
    ],
    outcomes: [
      '90% unit-test coverage achieved on a mortgage workflow; this figure is not claimed for the entire platform.',
      'Received the TCS Star of the Sprint Award for the modernization work.',
    ],
  },
]
