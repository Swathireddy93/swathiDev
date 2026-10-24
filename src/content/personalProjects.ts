import { profile } from './portfolio'

export interface PersonalProject {
  id: string
  name: string
  category: string
  tagline: string
  description: string
  detail: string
  technologies: readonly string[]
  repository?: { url: string | null; label?: string }
}

export const personalProjects: readonly PersonalProject[] = [
  {
    id: 'ritual', name: 'Ritual', category: 'Web Application',
    tagline: 'A quiet archive of food, light, timing and evidence.',
    description: 'Designed and developed a personalized wellness web application inspired by Ayurvedic principles and supported by scientific research. Ritual organizes daily routines, nutrition, ingredients, recipes and wellness practices into an intuitive, visually calming digital experience.',
    detail: 'Interactive timelines, ingredient exploration, searchable wellness routines and evidence-based insights bring the experience together.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Framer Motion'],
  },
  {
    repository: { url: profile.github, label: 'GitHub profile' },
    id: 'jada-bit', name: 'Jada.bit', category: 'Wearable Technology & Embedded Systems',
    tagline: 'Where wearable fashion meets programmable technology.',
    description: 'Designed and built a programmable digital hair accessory featuring a circular 1.28-inch LCD display powered by an ESP32-S3 microcontroller.',
    detail: 'The rechargeable wearable combines embedded electronics with a compact, jewelry-inspired enclosure, allowing users to display custom pixel art, animations and personalized visuals.',
    technologies: ['ESP32-S3', 'C/C++', 'SPI LCD Display', 'Bluetooth / Wi-Fi', 'Li-Po Battery', 'Embedded Systems'],
  },
] as const
