import { useSyncExternalStore } from 'react'
import type { AudioManager } from '../audio/AudioManager'

export function SoundControls({ audio }: { audio: AudioManager }) {
  const state = useSyncExternalStore(audio.subscribe, audio.snapshot)
  return (
    <div className="sound-controls" data-audio-status={state.status}>
      <button className="sound-toggle" type="button" onClick={state.muted ? audio.enable : audio.mute}
        aria-label={state.muted ? 'Turn sound on' : 'Mute sound'} aria-pressed={!state.muted}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" />
          {state.muted ? <path d="m17 9 5 6m0-6-5 6" /> : <><path d="M17 8a6 6 0 0 1 0 8" /><path d="M20 5a10 10 0 0 1 0 14" /></>}
        </svg>
        <span>{state.muted ? 'Sound off' : state.status === 'loading' ? 'Starting sound' : 'Sound on'}</span>
      </button>
      <label className="volume-control"><span className="sr-only">Sound volume</span>
        <input aria-label="Sound volume" type="range" min="0" max="1" step="0.05" value={state.volume} onChange={(event) => audio.setVolume(Number(event.target.value))} />
      </label>
      {state.message && <p className="audio-message" role="status">{state.message}</p>}
    </div>
  )
}
