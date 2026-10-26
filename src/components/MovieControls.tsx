import { useState } from 'react'
import type { StorySnapshot } from '../story/StoryPlayer'

export function MovieControls({ story, onPause, onPlay }: {
  story: StorySnapshot; onPause: () => void; onPlay: () => void
}) {
  const [hintDismissed, setHintDismissed] = useState(false)
  if (story.status === 'off') return null
  const active = story.status === 'playing' || story.status === 'waiting'
  const label = active ? 'Pause the movie' : story.status === 'complete' ? 'Replay the movie' : 'Play the movie'
  const showHint = !hintDismissed && (story.status === 'waiting' || story.beat === 'about:peek') && active
  return <div className="movie-controls" data-story-status={story.status} data-story-beat={story.beat} data-story-chapter={story.chapter}>
    {showHint && <span className="movie-hint" role="status">Pause the movie</span>}
    <button className="movie-toggle" type="button" title={label} aria-label={label} aria-pressed={active}
      onClick={() => { setHintDismissed(true); if (active) onPause(); else onPlay() }}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {active ? <><path d="M8 5v14M16 5v14" /></> : story.status === 'complete' ? <><path d="M5 9a8 8 0 1 1 0 6M5 4v5h5" /></> : <path d="m8 5 11 7-11 7z" />}
      </svg>
    </button>
  </div>
}
