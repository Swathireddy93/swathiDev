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
