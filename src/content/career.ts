export interface CareerChapter {
  title: string
  period: string
  employer: string
  client: string
  role: string
  summary: string
  stackLabel: string
  tools: string[]
  projectIds: string[]
  note?: string
  exploration?: string[]
  storyStep?: string
}

const enterprise: CareerChapter = {
  title: 'Enterprise foundations.', period: 'Oct 2018 — Mar 2024', employer: 'TCS', client: 'Citigroup',
  role: 'Web Developer, Full-Stack',
  summary: 'The first chapter: enterprise mortgage applications, API integration, accessibility, testing and modernization across engineering teams.',
  stackLabel: 'Tools documented across the 2018–2024 chapter',
  tools: ['Angular', 'React', 'TypeScript', 'Java / REST', 'Jasmine / Karma', 'Jenkins'],
  projectIds: ['mortgage'],
}

// Six narrative perspectives on the same documented tenure, not dated releases.
const citiStory = [
  {
    title: 'Mortgage Application Modernization',
    summary: 'At TCS, I worked with Citigroup on modernizing enterprise mortgage applications. This is the project behind my first six timeline stops: one foundation viewed through the problem, my contribution, engineering decisions and delivery.',
  },
  {
    title: 'What it meant for Citi.',
    summary: 'Legacy mortgage workflows needed more accessible screens, maintainable architecture and dependable API integration. The work focused on modernizing the application experience while supporting the complexity of an enterprise mortgage platform.',
  },
  {
    title: 'My role in the modernization.',
    summary: 'I led the migration from client-side rendering to Angular 13 server-side rendering and redesigned workflows and application architecture. My contribution connected frontend modernization with the services and validation that mortgage workflows rely on.',
  },
  {
    title: 'Connecting the workflow securely.',
    summary: 'I integrated enterprise REST APIs with input validation, error handling and pagination. Angular security practices and DOM sanitization helped mitigate XSS risks as application workflows moved toward a more maintainable architecture.',
  },
  {
    title: 'Making the experience work better.',
    summary: 'I applied lazy loading, optimized change detection and memoization to improve application performance. Lighthouse, NVDA and axe supported accessibility and performance audits, keeping usability alongside the technical modernization.',
  },
  {
    title: 'Quality, collaboration and recognition.',
    summary: 'Jasmine and Karma supported unit testing, with 90% coverage achieved on one mortgage workflow. I coordinated with more than ten engineering, QA and product teams and received the TCS Star of the Sprint Award for the modernization work.',
  },
] as const

export function chapterForYear(year: number): CareerChapter {
  if (year <= 2023) {
    const step = Math.max(0, year - 2018)
    return { ...enterprise, ...citiStory[step], storyStep: `CITI STORY · ${String(step + 1).padStart(2, '0')} / 06` }
  }
  if (year === 2024) return {
    title: 'From workflows to live systems.', period: 'Mar 2024 — Jan 2025', employer: 'HCLTech', client: 'Verizon',
    role: 'Senior Software Engineer / Technical Lead',
    summary: 'A new role at HCLTech, building React and TypeScript dashboards for real-time IoT monitoring, device events and session management.',
    stackLabel: 'Vision IoT stack', tools: ['React', 'TypeScript', 'REST APIs'], projectIds: ['vision'],
  }
  if (year === 2025) return {
    title: 'Independent apps. Shared foundations.', period: '2025 · four overlapping project chapters', employer: 'HCLTech', client: 'Verizon',
    role: 'Senior Software Engineer / Technical Lead',
    summary: 'From IoT and enterprise automation to a React 19 shell, federated frontends, reusable design systems and shared delivery workflows.',
    stackLabel: 'Tools used across the 2025 projects',
    tools: ['React 19', 'TypeScript', 'Redux Toolkit', 'Vite', 'Module Federation', 'GitLab CI'],
    projectIds: ['vision', 'vbg', 'ecommerce', 'contract'],
  }
  return {
    title: 'Systems at scale. AI alongside.', period: 'Jan 2026 — present', employer: 'HCLTech', client: 'Verizon',
    role: 'Senior Software Engineer / Technical Lead',
    summary: 'A unified billing operations portal, asynchronous ingestion and a configurable Action Engine. GitHub Copilot with Claude and GPT-based models supports development, debugging and refactoring.',
    stackLabel: 'Delivery stack and development tools',
    tools: ['React', 'Spring Boot', 'Oracle', 'Quartz', 'YAML', 'GitHub Copilot'],
    projectIds: ['magna', 'ecommerce', 'contract'],
    exploration: ['LLM foundations', 'Retrieval pipelines', 'Vector databases'],
  }
}
