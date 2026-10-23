import { useSyncExternalStore } from 'react'
import type { AudioManager } from '../audio/AudioManager'

export function SoundControls({ audio }: { audio: AudioManager }) {
  const state = useSyncExternalStore(audio.subscribe, audio.snapshot)
  const soundOn = !state.muted && state.status !== 'error'
  const label = soundOn ? 'Mute sound' : 'Unmute sound'
  return (
    <div className="sound-controls" data-audio-status={state.status} data-last-cue={state.lastCue}>
      <button className="sound-toggle" type="button" onClick={soundOn ? audio.mute : audio.enable}
        aria-label={label} title={label} aria-pressed={soundOn} aria-busy={state.status === 'loading'}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" />
          {soundOn && <><path d="M17 8a6 6 0 0 1 0 8" /><path d="M20 5a10 10 0 0 1 0 14" /></>}
        </svg>
      </button>
      {state.message && <p className="audio-message" role="status">{state.message}</p>}
    </div>
  )
}
