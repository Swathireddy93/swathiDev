import { experience } from '../config/experience'

export const storyChapters = [
  { id: 'about', label: 'About Me' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'experiments', label: 'Beyond Work' },
  { id: 'contact', label: 'Contact' },
] as const
export type StoryChapter = typeof storyChapters[number]['id']
export interface StoryBeat {
  id: string
  chapter: StoryChapter
  kind: 'menu' | 'peek' | 'enter' | 'read' | 'year' | 'hold' | 'ending'
  target?: string
  year?: number
}

/** One continuous movie; detailed case studies remain available to manual exploration. */
export function buildStoryBeats(): StoryBeat[] {
  const beats: StoryBeat[] = []
  for (const { id: chapter } of storyChapters) {
    beats.push(
      { id: `${chapter}:menu`, chapter, kind: 'menu', target: '#portfolio-menu' },
      { id: `${chapter}:peek`, chapter, kind: 'peek' },
      { id: `${chapter}:enter`, chapter, kind: 'enter', target: `#${chapter}` },
    )
    if (chapter !== 'projects') {
      beats.push({ id: `${chapter}:read`, chapter, kind: 'read', target: `#${chapter}` })
      continue
    }
    for (let year = experience.journey.firstYear; year <= experience.journey.lastYear; year++) {
      beats.push({ id: `projects:${year}:year`, chapter, kind: 'year', year, target: '.journey-controls' })
    }
  }
  beats.push(
    { id: 'contact:hold', chapter: 'contact', kind: 'hold' },
    { id: 'movie:ending', chapter: 'contact', kind: 'ending' },
  )
  return beats
}
