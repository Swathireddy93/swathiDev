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
}

const enterprise: CareerChapter = {
  title: 'Enterprise foundations.', period: 'Oct 2018 — Mar 2024', employer: 'TCS', client: 'Citigroup',
  role: 'Web Developer, Full-Stack',
  summary: 'The first chapter: enterprise mortgage applications, API integration, accessibility, testing, and modernization across engineering teams.',
  stackLabel: 'Tools documented across the 2018–2024 chapter',
  tools: ['Angular', 'React', 'TypeScript', 'Java / REST', 'Jasmine / Karma', 'Jenkins'],
  projectIds: ['mortgage'],
}

export function chapterForYear(year: number): CareerChapter {
  if (year <= 2023) return { ...enterprise, title: year === 2018 ? 'Where the journey begins.' : enterprise.title }
  if (year === 2024) return {
    title: 'From workflows to live systems.', period: 'Mar 2024 — Jan 2025', employer: 'HCLTech', client: 'Verizon',
    role: 'Senior Software Engineer / Technical Lead',
    summary: 'A new role at HCLTech, building React and TypeScript dashboards for real-time IoT monitoring, device events, and session management.',
    stackLabel: 'Vision IoT stack', tools: ['React', 'TypeScript', 'REST APIs'], projectIds: ['vision'],
  }
  if (year === 2025) return {
    title: 'Independent apps. Shared foundations.', period: '2025 · four overlapping project chapters', employer: 'HCLTech', client: 'Verizon',
    role: 'Senior Software Engineer / Technical Lead',
    summary: 'From IoT and enterprise automation to a React 19 shell, federated frontends, reusable design systems, and shared delivery workflows.',
    stackLabel: 'Tools used across the 2025 projects',
    tools: ['React 19', 'TypeScript', 'Redux Toolkit', 'Vite', 'Module Federation', 'GitLab CI'],
    projectIds: ['vision', 'vbg', 'ecommerce', 'contract'],
  }
  return {
    title: 'Systems at scale. AI alongside.', period: 'Jan 2026 — present', employer: 'HCLTech', client: 'Verizon',
    role: 'Senior Software Engineer / Technical Lead',
    summary: 'A unified billing operations portal, asynchronous ingestion, and a configurable Action Engine. GitHub Copilot with Claude and GPT-based models supports development, debugging, and refactoring.',
    stackLabel: 'Delivery stack and development tools',
    tools: ['React', 'Spring Boot', 'Oracle', 'Quartz', 'YAML', 'GitHub Copilot'],
    projectIds: ['magna', 'ecommerce', 'contract'],
    exploration: ['LLM foundations', 'Retrieval pipelines', 'Vector databases'],
    note: 'AI foundations are an area of exploration. The existing AI agent in the Magna ecosystem is not presented as an agent I built.',
  }
}
