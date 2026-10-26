import { useState, useSyncExternalStore } from 'react'
import type { AudioManager } from '../audio/AudioManager'

export function SoundControls({ audio }: { audio: AudioManager }) {
  const state = useSyncExternalStore(audio.subscribe, audio.snapshot)
  const [hintDismissed, setHintDismissed] = useState(false)
  const soundOn = !state.muted && state.status !== 'error'
  const label = soundOn ? 'Mute sound' : 'Unmute sound'
  return (
    <div className={`sound-controls ${soundOn ? 'sound-is-on' : 'sound-is-off'}`} data-audio-status={state.status} data-last-cue={state.lastCue}>
      {state.muted && !hintDismissed && state.status !== 'error' && <button type="button" className="sound-hint" onClick={() => { setHintDismissed(true); audio.enable() }}>Unmute to play music</button>}
      <button className="sound-toggle" type="button" onClick={() => { setHintDismissed(true); if (soundOn) audio.mute(); else audio.enable() }}
        aria-label={label} title={label} aria-pressed={soundOn} aria-busy={state.status === 'loading'}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" />
          {soundOn && <><path d="M17 8a6 6 0 0 1 0 8" /><path d="M20 5a10 10 0 0 1 0 14" /></>}
          {!soundOn && <path d="m17 9 5 6m0-6-5 6" />}
        </svg>
      </button>
      {state.message && <p className="audio-message" role="status">{state.message}</p>}
    </div>
  )
}
