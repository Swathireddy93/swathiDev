import { experience } from '../config/experience'
import { buildStoryBeats, type StoryBeat, type StoryChapter } from './storyboard'
import { menuPosition } from './menuPosition'
import { contentBounds, storyViewport } from './viewport'
import { scrollFrame } from './scrollMotion'

export interface StorySnapshot {
  status: 'waiting' | 'playing' | 'paused' | 'complete' | 'off'
  chapter: StoryChapter
  beat: string
  peek: StoryChapter | null
  year?: number
  focus?: StoryChapter | 'menu'
  exploring?: boolean
}
export const initialStory: StorySnapshot = { status: 'waiting', chapter: 'about', beat: 'waiting', peek: null, focus: 'menu' }
interface StoryCallbacks {
  snapshot: (snapshot: StorySnapshot) => void
  navigate: (chapter: StoryChapter) => void
  year: (year: number) => void
  ending: () => void
}
const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max))

/** One interruptible clock owns scroll, reading holds and year changes. No synthetic clicks. */
export class StoryPlayer {
  private beats = buildStoryBeats()
  private state: StorySnapshot = { ...initialStory }
  private index = 0
  private frame = 0
  private last = 0
  private elapsed = 0
  private idle = 0
  private idleY = window.scrollY
  private ready = 0
  private duration = 0
  private remainingLead = 0
  private from = 0
  private motionAnchor = 0
  private menuVisible = false
  private hidden = document.hidden
  private started = false
  private disposed = false
  private pausedY = 0

  constructor(private callbacks: StoryCallbacks) { this.emit() }

  private emit() {
    document.documentElement.classList.toggle('is-story-playing', this.state.status === 'playing')
    document.documentElement.classList.toggle('is-story-paused', this.state.status === 'paused' && !this.state.exploring)
    this.callbacks.snapshot({ ...this.state })
    document.dispatchEvent(new Event('portfolio:playback'))
  }
  private rebase() {
    this.from = window.scrollY
    this.motionAnchor = this.motionProgress(this.beats[this.index])
  }
  private queue() {
    if (this.disposed || this.frame || this.hidden) return
    if (this.state.status === 'playing' || (this.state.status === 'waiting' && this.menuVisible)) this.frame = requestAnimationFrame(this.tick)
  }
  private halt() { cancelAnimationFrame(this.frame); this.frame = 0; this.last = 0 }
  setMenuVisible(visible: boolean) { this.menuVisible = visible; if (this.state.status === 'waiting' && !visible) this.halt(); else this.queue() }
  setHidden(hidden: boolean) { this.hidden = hidden; if (hidden) this.halt(); else this.queue() }
  resize() {
    // Re-measure the remaining passage after a resize/orientation or font change.
    if (this.state.status === 'waiting' && this.menuVisible) {
      const menu = document.getElementById('portfolio-menu')
      if (menu) window.scrollTo({ top: menuPosition(menu), behavior: 'instant' })
      this.idle = 0; this.idleY = window.scrollY
    }
    if (this.ready >= 2 && this.index < this.beats.length) this.rebase()
  }
  pause = (exploring = false) => {
    if (this.state.status === 'complete') {
      if (exploring) { this.state = { ...this.state, exploring: true, focus: undefined }; this.emit() }
      return
    }
    if (this.state.status === 'paused') {
      if (exploring && !this.state.exploring) { this.state = { ...this.state, exploring: true, focus: undefined }; this.emit() }
      return
    }
    if (this.state.status !== 'playing' && this.state.status !== 'waiting') return
    this.halt()
    this.pausedY = window.scrollY
    window.scrollTo({ top: window.scrollY, behavior: 'instant' })
    this.state = { ...this.state, status: 'paused', exploring, focus: exploring ? undefined : this.state.focus }; this.emit()
  }
  play = () => {
    if (this.disposed || this.state.status === 'playing') return
    if (this.state.status === 'complete') return
    if (!this.started) {
      this.state = { ...this.state, status: 'waiting', exploring: false, focus: 'menu' }
      const menu = document.getElementById('portfolio-menu')
      if (menu) window.scrollTo({ top: menuPosition(menu), behavior: 'instant' })
      this.idleY = window.scrollY
      this.emit(); this.queue(); return
    }
    const beat = this.beats[this.index]
    if (this.state.exploring) {
      window.scrollTo({ top: this.pausedY, behavior: 'instant' })
      if (beat.kind === 'year') this.callbacks.year(beat.year!)
    }
    this.state = { ...this.state, status: 'playing', exploring: false, focus: this.focusFor(beat) }
    this.emit(); this.queue()
  }
  restart = (alreadyLanded = false) => {
    // Initial playback starts with About Me's hop; only an explicit replay needs to return here.
    this.halt(); this.started = true; this.index = alreadyLanded ? 1 : 0
    this.state = { ...initialStory, status: 'playing' }
    this.begin(); this.queue()
  }
  finish = () => {
    this.halt()
    this.state = { ...this.state, status: 'complete', beat: 'complete', peek: null, focus: undefined, exploring: true }
    this.emit()
  }
  dispose() {
    this.disposed = true; this.halt()
    document.documentElement.classList.remove('is-story-playing', 'is-story-paused')
    document.dispatchEvent(new Event('portfolio:playback'))
  }

  private focusFor(beat: StoryBeat): StorySnapshot['focus'] {
    if (beat.kind === 'peek') return 'menu'
    if (beat.kind === 'read' || beat.kind === 'year') return beat.chapter
    return undefined
  }

  private begin() {
    const beat = this.beats[this.index]
    this.elapsed = 0; this.ready = 0; this.duration = 0; this.remainingLead = 0; this.motionAnchor = 0
    this.state = { status: 'playing', chapter: beat.chapter, beat: beat.id, peek: beat.kind === 'peek' ? beat.chapter : null, year: beat.year, focus: this.focusFor(beat) }
    if (beat.kind === 'enter') this.callbacks.navigate(beat.chapter)
    if (beat.kind === 'year') this.callbacks.year(beat.year!)
    if (beat.kind === 'ending') this.callbacks.ending()
    this.emit()
  }
  private target(beat: StoryBeat) { return beat.target ? document.querySelector<HTMLElement>(beat.target) : null }
  private destination(beat: StoryBeat) {
    const target = this.target(beat)
    if (!target) return window.scrollY
    const rect = contentBounds(target)
    const viewport = storyViewport()
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (beat.kind === 'menu') return menuPosition(target)
    const start = window.scrollY + rect.top - viewport.top
    if (beat.kind === 'read') {
      let bottom = rect.bottom
      // Credits belong to the same short final scene, without another travel/hold.
      if (beat.chapter === 'contact') {
        const footer = document.querySelector<HTMLElement>('.site-footer')
        if (footer) bottom = Math.max(bottom, footer.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(footer).paddingBottom) || 0))
      }
      return clamp(Math.max(this.from, window.scrollY + bottom - viewport.bottom), max)
    }
    return clamp(start, max)
  }
  private readingPace(beat: StoryBeat) {
    const timing = experience.story
    if (beat.chapter === 'contact') return { lead: 600, tail: 2200 }
    if (beat.id === 'projects:introduction' && window.matchMedia('(max-width: 700px)').matches) return { lead: 3000, tail: timing.projectTailMs }
    return beat.chapter === 'projects' ? { lead: timing.projectLeadMs, tail: timing.projectTailMs } : { lead: timing.leadMs, tail: timing.tailMs }
  }
  private motionDuration(beat: StoryBeat) {
    const reading = beat.kind === 'read'
    return reading ? Math.max(1, this.duration - this.remainingLead - this.readingPace(beat).tail)
      : beat.kind === 'year' ? experience.story.yearMs : Math.max(1, this.duration)
  }
  private motionProgress(beat: StoryBeat) {
    return clamp((this.elapsed - (beat.kind === 'read' ? this.remainingLead : 0)) / this.motionDuration(beat), 1)
  }
  private measure(beat: StoryBeat) {
    this.from = window.scrollY
    const timing = experience.story
    if (beat.kind === 'ending') return timing.endingMs
    if (beat.kind === 'peek') return timing.peekMs
    if (beat.kind === 'year') return experience.journey.hopMs + (beat.target && Math.abs(this.destination(beat) - this.from) > 1 ? timing.yearMs : 0)
    const mobile = window.matchMedia('(max-width: 700px)').matches
    if (beat.kind !== 'read') {
      const distance = Math.abs(this.destination(beat) - this.from)
      const speed = mobile ? timing.mobileTravelPixelsPerSecond : timing.travelPixelsPerSecond
      return Math.max(mobile ? timing.mobileTravelMs : timing.travelMs, Math.min(timing.maxTravelMs, distance / speed * 1000))
    }
    if (beat.chapter === 'contact') return timing.contactReadMs
    const target = this.target(beat)
    const words = target?.innerText.trim().split(/\s+/).length ?? 0
    const distance = Math.abs(this.destination(beat) - this.from)
    const pace = this.readingPace(beat)
    if (beat.id === 'projects:introduction') return timing.projectIntroMs + (window.matchMedia('(max-width: 700px)').matches ? 3000 : 0)
    const speed = mobile ? timing.mobileReadPixelsPerSecond : timing.pixelsPerSecond
    const textMs = words / timing.wordsPerMinute * 60_000 - (beat.chapter === 'about' ? timing.aboutTrimMs : 0)
    return Math.max(timing.minimumReadMs, textMs, distance / speed * 1000 + pace.lead + pace.tail)
  }
  private tick = (now: number) => {
    this.frame = 0
    const delta = this.last ? now - this.last : 0
    this.last = now
    if (this.state.status === 'waiting') {
      // Start the three-second hold after the landing camera has actually settled.
      if (Math.abs(window.scrollY - this.idleY) > .5) { this.idleY = window.scrollY; this.idle = 0 }
      else this.idle += delta
      if (this.idle >= experience.story.idleMs) this.restart(true)
    } else if (this.state.status === 'playing') {
      const beat = this.beats[this.index]
      // Let React commit a new year before measuring its content.
      if (this.ready < 2) {
        this.ready++
        if (this.ready === 2) {
          this.duration = this.measure(beat)
          this.remainingLead = beat.kind === 'read' ? this.readingPace(beat).lead : 0
        }
      }
      else {
        this.elapsed += delta
        if (beat.target) window.scrollTo({ top: scrollFrame(this.from, this.destination(beat), this.motionProgress(beat),
          this.motionAnchor, beat.kind === 'read', experience.story.settlePixels,
          Math.min(.12, experience.story.readRampMs / this.motionDuration(beat))), behavior: 'instant' })
        if (this.elapsed >= this.duration) {
          this.index++
          if (this.index === this.beats.length) {
            this.halt(); this.state = { ...this.state, status: 'complete', beat: 'complete', peek: null }; this.emit()
            return
          }
          this.begin()
        }
      }
    }
    this.queue()
  }
}
