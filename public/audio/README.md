# Portfolio audio

`portfolio-background.mp3` is the full user-supplied music track, replacing the
temporary ambient loop. Its duration is approximately 4 minutes 2 seconds. The
9.7 MB upload was converted locally to a 128 kbps stereo MP3 (about 3.9 MB), with
embedded cover art and source metadata removed. The original upload was not
modified. Howler streams this track using HTML5 Audio rather than decoding the
whole song into a Web Audio buffer; it loops and follows the speaker toggle.

`temporary-jump.wav` and `temporary-land.wav` are original synthesized effects,
reproducible with `scripts/generate_placeholders.py`. The jump is a short rising
pitch; the 180 ms landing is a soft low thump. They are mixed independently of the
music, with brief ducking so the cues can be heard. The old temporary ambient WAV
is retained but unused.

Music attempts playback as loading begins. Audible autoplay depends on browser
policy; expected blocking leaves the speaker muted until the first click/key or
an explicit unmute. A deliberate mute prevents automatic retries. Playback and
resources are cleaned up on unmount. The supplied track streams through HTML5
Audio; preloaded short effects use Web Audio. Cue registration and recovery live
in `src/audio/AudioManager.ts`; timing and mix levels live in `src/config/experience.ts`.

`menu-bubble.wav` is an original synthesized 130 ms soft bubble pop. It plays at gently rising pitches with the five navigation entrances, respects mute, and is omitted for reduced motion.

`glass-reveal.wav` is an original synthesized four-note pixel shimmer for the sage panel entrance. The menu cue is now a soft liquid pop, with gentle pitch variation per circle. Neither plays while muted or with reduced motion.

Background music starts at 0:45 and loops from that point to the end of the supplied track (4:02.364). Mute/unmute preserves playback position.

The returning menu character uses a quieter, lower-pitched variation of the original liquid pop on each peek. It does not duck the music and respects mute and reduced motion.

`thought-type.wav` (75ms) and `thought-swoosh.wav` (500ms) are original synthesized sounds for the opening character's thought cloud, reproducible with `python3 scripts/generate_thought_audio.py`. Each typewriter key blends a soft hammer strike, a damped wooden resonance and a quieter spring return. The master intro timeline synchronizes keys with non-space characters and plays one swoosh when the cloud fades. Both respect mute; skipping or disposing the intro stops them. No paid service or external recording is used.

`camera-shutter.wav` is an original 180ms, mono, 22.05kHz synthesized double-curtain click (about 8KB). Recreate it with `python3 scripts/generate_shutter.py`. It accompanies the circular photography image's diamond flash every three seconds while the image is visible, respects mute and reduced motion, and leaves the background music level unchanged. No external recording or paid service is used.

`character-blink.wav` is the 95ms soft blip from the existing character export's
`audio/character-blinking.wav` (the excerpt starting at 0.80s). The introductory
camera close-up reuses the original blink sprite twice, at 1.35s and 1.67s into
the zoom, with one blip per blink. Eye closure lasts 120ms. Timing and volume are
configured in `experience.timing` and `experience.audio`. Muting suppresses the
cue; pausing or skipping the introduction stops it. No new character art or
external recording was created.

The close-up blips now play at full cue volume with a brief music dip to 22% of
the usual background level. The browser's cheerful "Bye!" uses full speech volume
while music drops to 10% of its usual level. Speech completion, errors or cancel
restore the mix smoothly; a three-second fallback handles missing mobile speech
events. Mute continues to silence both. These levels and holds live in
`experience.audio`; the original audio files remain unchanged.
