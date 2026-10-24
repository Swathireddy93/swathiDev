# SWATHI — an interactive career journey

Swathi Shivashankar Reddy's React/TypeScript pixel-art portfolio:
asset loading with a four-second minimum reveal and a brief visible 100% hold → front-facing character peeking, blinking and jumping →
camera close-up → first-person Bay/city flight → rooftop portfolio with bubble
navigation → a selectable career journey from 2018 to 2026.

The sequence is a functioning **prototype with temporary/procedural artwork**.
The mountain uses layered Pixi sprites; the city uses a deterministic pixel canvas
and perspective projection. It is a 2.5D treatment, not a geographically exact
model of San Francisco. Final character likeness, production art and physical-device
performance remain open for review. No Three.js or new rendering dependency was added.

## Run locally

Use Node 24 (see `.nvmrc`; this instance was verified with Node 24.19.0 and npm
11.9.0). Vite also supports compatible Node versions starting at 22.12.

```sh
npm ci
npm run dev
```

Open the address printed by Vite in your local terminal. No API keys, backend,
database, authentication service, remote fonts or paid APIs are required.

## Public hosting

`.github/workflows/pages.yml` builds and deploys this static application to GitHub
Pages on pushes to `main`. It uses official GitHub actions pinned to verified
release commits, Node 24, the saved npm lockfile, lint and the production type
check/build. The published path comes from GitHub's Pages configuration.

For initial activation, the repository's **Settings → Pages → Build and deployment
→ Source** must be **GitHub Actions**. Once Pages is enabled, the workflow's
`github-pages` environment reports the actual deployed website URL. A prepared
workflow or successful local build does not establish that the public site is live.
Check the deployed site and résumé download before placing its URL on a résumé.

GitHub Pages serves the app independently of this cloud development environment;
publishing the cloud environment snapshot is not website hosting. No Vite dev server
must stay running for the public site. Pages hosting availability for private
repositories depends on the GitHub account plan; this setup does not change the
repository's visibility.

Assets, audio and the résumé use Vite's configured base URL, so the same source
works at a domain root or under a repository subpath. To validate the project-page
deployment shape locally:

```sh
npm run build -- --base=/swathiDev/
npm run preview
```

The deployment publishes the current interactive prototype. Landscape/character art
and short effects remain temporary; background music was supplied by the user.

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
npm run test:e2e
```

The browser tests use `/usr/bin/chromium` when present. On another machine, install
the Playwright browser with `npx playwright install chromium`, or set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing Chromium executable. Browser
installation is optional for running the application. Stop dev/preview with
Ctrl+C. Both commands bind to all interfaces for compatibility with cloud runners;
use `--host 127.0.0.1` if local-only binding is preferred.

Each cloud task already has an isolated environment. Use the existing checkout;
do not create a Git worktree unless explicitly requested.

## Stack research and decisions

Versions and peer/engine constraints were checked against npm registry metadata
on **2026-10-22**, then installed with exact versions and a saved lockfile.
The integration is validated by TypeScript and Chromium tests, including actual
Pixi drawing and Howler playback events.

| Technology | Selected version | Responsibility / compatibility |
| --- | --- | --- |
| React / React DOM | 19.3.1 | Semantic portfolio, controls and application state |
| TypeScript | 6.0.3 | Strict typing; current typescript-eslint 8.72.0 supports TypeScript `<6.1`, so the latest TypeScript 7 was intentionally not selected |
| Vite | 8.3.5 | Local dev and production build; requires Node `^20.19.0` or `>=22.12.0` |
| @vitejs/plugin-react | 6.1.2 | Vite 8 React integration; optional compiler peers are not required |
| PixiJS | 8.22.0 | Sprite rendering, cached textures, WebGL and responsive scene |
| @pixi/react | 8.0.5 | Declarative Pixi layer tree; declares React `>=19.0.0` and PixiJS `^8.2.6` peers |
| GSAP | 3.15.0 | One reusable timeline for camera, character poses and cue events |
| Howler.js | 2.2.4 | Gesture-started ambient audio, jump cue, mute, volume, fades and disposal |

**Why 2.5D:** separate layers and coordinated transforms provide the opening
panorama and character reveal with a small texture budget. A true 3D camera,
terrain meshes and Three.js would add complexity without improving this milestone.
Later, evaluate the between-building flight with perspective-scaled sprites and
occlusion first; adopt Three.js only if the approved spatial path actually needs it.

**Sources consulted:**

- [Pixi React official README](https://github.com/pixijs/pixi-react#readme): `extend`, prefixed JSX elements, `Application`, `resizeTo`, and context hooks.
- [PixiJS Application source](https://github.com/pixijs/pixijs/blob/dev/src/app/Application.ts) and installed release declarations: async renderer initialization, application rendering, options and cleanup.
- [GSAP official README](https://github.com/greensock/GSAP#readme) and installed release types: timeline sequencing, callbacks, easing, pause/resume and kill.
- [Howler official README](https://github.com/goldfire/howler.js#readme): user-gesture audio unlocking, `play`, playback errors, `fade`, `mute`, `volume`, `stop` and `unload`.
- [Vite official README](https://github.com/vitejs/vite/tree/main/packages/vite#readme) and npm engines/peer metadata.
- [React package](https://www.npmjs.com/package/react), [Pixi React package](https://www.npmjs.com/package/@pixi/react), [Vite package](https://www.npmjs.com/package/vite), and the corresponding installed package metadata.

The PixiJS and GSAP documentation websites returned proxy HTTP 403 in this cloud
environment. Official upstream READMEs/source and installed package types were
used instead. In particular, upstream Pixi React docs describe `destroyOptions`,
but the installed 8.0.5 release does not expose that prop, so it is not used.
The Pixi scene is mounted only after the actual `onInit` callback, avoiding a race
between React rendering and asynchronous renderer initialization.

## Architecture

```text
src/
  App.tsx                    loading / automatic character / flight / portfolio state
  config/experience.ts       world dimensions, camera, character, timings, session key
  assets/manifest.ts         replaceable layer URLs, identities and parallax depths
  assets/loadAssets.ts       cached critical loading, progress, timeouts, fallbacks
  hooks/                     asset lifecycle and reduced-motion preference
  scenes/MountainWorld.tsx   Pixi React scene graph and renderer lifecycle
  scenes/CityFlight.tsx      interruptible flight and static rooftop backdrop
  scenes/cityRenderer.ts     pixel city, perspective projection and deterministic buildings
  animation/camera.ts        responsive camera and portrait focus
  animation/SceneController.ts  GSAP timeline, stages, poses and cue events
  audio/AudioManager.ts      cue registry, gesture unlock, playback and cleanup
  components/               loading, sound, navigation, portfolio and case studies
  content/portfolio.ts      six résumé-backed case studies, profile and links
  content/career.ts         dated chapters, technologies and source limitations
  components/CareerJourney.tsx  accessible year rail and cinematic chapter changes
  theme/                    five-color tokens, fonts, responsive UI and focus states
public/
  assets/temporary/          eight separate layers, three character poses, poster
  assets/production/         reserved for later approved artwork
  audio/                    user-supplied music and original temporary jump cue
  fonts/                    locally hosted Pixelify Sans / Inter subsets + OFL licenses
  swathi-reddy-resume.pdf    original supplied résumé
scripts/generate_placeholders.py  optional, deterministic art and audio source
tests/experience.spec.ts     functional Chromium coverage
```

The portfolio is independent of the Pixi scene and remains usable when the intro
is skipped, disabled or unavailable. Content is HTML, never text painted into a
canvas. The scene controller receives explicit bindings and completion/cue hooks;
it does not know about project content or routing.

### Loading, camera and audio

- Progress reflects actual critical textures and font loads; there is no fake delay.
- Loading automatically enters the character sequence. There is no welcome card,
  Play Intro gate, or sound-choice screen. A normal refresh starts the journey
  again; Skip intro is always available, including during loading and flight.
- The character faces the camera, peeks, jumps, lands, ducks and reappears. Jump
  and landing effects play over the supplied MP3, with brief music ducking. The
  camera approaches her face; she disappears at the POV transition and is absent
  from the city flight. Motion and audio-mix settings are centralized in
  `src/config/experience.ts`.
- The flight lifts over Bay water, approaches a bridge and skyline, moves through
  perspective-projected buildings and settles onto a roof. The total intro is
  approximately 22 seconds after assets are ready, and can be interrupted anytime.
- Uploaded music attempts playback during loading. HTML5 streaming avoids decoding
  the full four-minute track into a Web Audio buffer. Browsers can still prohibit
  audible playback before interaction. Expected autoplay rejection stays quiet;
  the first click/Enter/Space retries, or the visitor can use the speaker icon.
  Autoplay is attempted, not guaranteed or bypassed. Real file/load errors remain
  visible and retryable.
- The speaker is available during loading too. It is a single 48px icon toggle,
  without a volume slider or cancel/X icon. Explicit mute cancels automatic retry.
  Music continues into the portfolio and across replay; resources and timers are
  released on unmount. Short jump/landing effects are preloaded and use Web Audio.
- Reduced motion and absent WebGL open the semantic portfolio immediately with a
  static city backdrop. Missing scene assets show a nonblocking notice. Critical
  loads have a timeout; animation timelines pause when the page is hidden and are
  disposed on interruption.

### Time-based projects and experience

The five bubble destinations are About Me, Experience, Projects, Experiments and
Contact. Experience and Projects lead to the same career journey. The 2018–2026
rail supports mouse/touch, Arrow keys, Home/End, previous/next, and an optional
Play Timeline action. GSAP transitions the chapter and hops the selected marker;
reduced motion keeps selection functional with those animations disabled.

- **2018–2023:** the documented TCS/Citigroup tenure (Oct 2018–Mar 2024). Individual
  annual project/tool dates are not provided. Those selections clearly share the
  full tenure; Angular 13 is not assigned to 2018 or 2019.
- **2024:** Vision IoT (Mar 2024–Jan 2025), HCLTech/Verizon.
- **2025:** Vision IoT's final month, VBG Automation (Jan–Sep), Ecommerce Gateway
  and the concurrent Contract Transparency project (Sep 2025–Jan 2026).
- **2026:** Magna Billing (Jan onward), and the two projects ending in January.
  GitHub Copilot with Claude/GPT is documented development practice. LLMs, retrieval
  pipelines and vector databases are labeled learning/exploration. The existing
  Magna ecosystem AI agent is not presented as an agent built by Swathi.

All six case studies remain available within their years. Update career chapter
content without modifying the camera or rendering code.

### Art, audio and performance tradeoffs

The current original procedural art and synthesized jump effect are **temporary**.
They demonstrate the asset pipeline and motion, not final visual approval or a
portrait likeness. They use the supplied five-color direction with controlled
shade ramps, explicit pixel clusters and dithering. They are not pixelated photos.

Layers share a 960×540 coordinate system; sprites use bottom-center anchors.
Replace URLs in the manifest or add approved assets under `production/` without
rewriting timeline logic. Keep scene dimensions/anchors, or update config with the
new art. The static poster is a fallback only; the running scene uses eight
independent textures. Character artwork has neutral, blink and raised-arm poses.

Pixels are sampled nearest-neighbor, with renderer antialiasing off. The backing
buffer is capped near 960×540 pixels on initial mount, and never uses excess
retina resolution; native mobile viewports can use resolution 1. GSAP renders only
while the intro moves, and no Pixi renderer remains in the portfolio. The target
is 60 FPS on capable hardware, not a measured guarantee across devices. The cloud
browser uses software WebGL; real-device Safari/iOS/Android profiling remains open.

To regenerate optional placeholders using local Python tooling:

```sh
python scripts/generate_placeholders.py
```

This optional script needs Pillow and NumPy. Generated assets are checked in, so
Python and those packages are not needed for `npm ci`, development or building.
Font licenses are included beside the local font files. The background track was
supplied by the user, and playback requires no paid audio service; see
`public/audio/README.md` for provenance and encoding details.

## Portfolio content and accessibility

Six case studies come directly from the supplied résumé. HCLTech is the employer
and Verizon the client for Magna Billing and Ecommerce Gateway; TCS is the employer
and Citigroup the client for mortgage modernization. The 90% test-coverage metric
applies to **one mortgage workflow**, not the entire platform. No employer source
code, public demo URLs, immigration information or street address is invented or
published. The email, LinkedIn and résumé link use supplied factual content.

Navigation uses ordinary anchors. Controls support keyboard input, visible focus,
and an icon-only mute toggle. Native modal dialogs support Escape, contain keyboard focus and
restore focus to the opening project action. Audio is optional; expected browser
autoplay blocking falls back to a muted speaker until interaction.

## Verification and next milestones

`npm run build` includes the strict type check. `npm run lint` checks all source.
The browser suite exercises automatic character/camera/flight/landing, actual
jump and landing play events, music during loading, blocked-autoplay recovery,
muting, replay, timeline selection/keyboard/playback, six case-study dialogs,
mobile layout/touch, reduced motion, résumé download and missing-art/audio/WebGL.

The autoplay-permitted test checks actual playback without any click. The restricted
browser tests simulate a `NotAllowedError` until a trusted click/key event, because
Chromium's autoplay flag and automation activation do not reliably reproduce every
mobile policy. Touchscreen Chromium uses an iPhone user agent; physical iOS Safari
and Android verification remain necessary. Tests preserve the browser's TLS checks.

Next visual review: refine character art, camera framing, city detail and timings.
No build or test command commits, pushes or deploys anything. Protected Vercel
Preview deployments are the current review workflow; production stays gated on
an explicit publish instruction. The existing Pages workflow still deploys on
pushes to main, so do not push main as a preview mechanism.


### Guided portfolio chapters

The character returns in her original colors behind each menu destination: an initial 1.8-second
pause, a 2.5-second peek and a 1-second gap. Cycling pauses when the menu is offscreen,
the tab is hidden. It resumes when the visitor returns to the menu. Reduced motion shows a still character.
Each portfolio section has a character introduction and a keyboard-accessible return
to the menu. These are written guide cues; no synthesized narration is added.

The 2018–2023 stops are six narrative perspectives on the same Citi mortgage project,
not claims that specific releases occurred in those years. The tools remain shared
across the documented tenure. Timeline playback allows 6.5 seconds per stop.

Music still attempts audible playback at entry from 0:45; browser autoplay policies
can require the first interaction. The speaker highlights its current state without
adding an entry gate.

Public portfolio: https://ssr-tech-portfolio.vercel.app/ (Vercel project `ssr-tech-portfolio`). Production is public; preview deployments require Vercel authentication.


The guide now retains the opening character’s original colors. The portfolio’s
neutral palette uses its own colors instead of a grayscale filter on the entire
page. Menu peeks reuse the neutral, blink and jump sprites with a small bounce
and hands on the circle edge. The Experiments guide pairs her with an original pixel-art bulb. The upright standing figure shares a consistent pixel body with the other poses. Her left hand lifts into an open-palm ta-da gesture in sync with the six-second warm yellow glow loop; it pauses offscreen and in hidden tabs. Reduced motion keeps the bulb steadily lit.

Jada.bit’s GitHub action links to the supplied profile. Set `repository.url` in `src/content/personalProjects.ts` to a project URL when its repository is ready to share. The GitHub Projects area reserves space for builds in progress without fictitious repositories or progress metrics.

About Me uses an original pixel-art table vignette with the opening character’s face and a seated, upright body with a repeating hand wave. The Experience character dabs and the team character flexes both arms in place every four seconds, holding each pose for 900 ms. Its timer pauses offscreen and in hidden tabs; reduced motion leaves a neutral pose.

The contact invitation has two lines on the left. A smaller glasses-wearing character performs the Bee’s Knees step on the right: her feet stay planted while her knees move inward and outward and her hands cross between the knees. A 2.4-second GSAP loop keeps the joints connected while occasional question marks retain the thoughtful expression. GitHub actions use the supplied profile URL; the Jada.bit action is labeled as a profile link until a project-specific repository URL is supplied.

Section animations now loop while visible and pause outside the viewport or a hidden tab. The Experiments idea expression repeats without travelling across the text. Seated and standing figures blink without tilting their heads. Menu navigation remounts the selected guide (and contact animation) so every menu visit starts its animation from the beginning. Reduced motion leaves still poses.

Mobile layout keeps the opening name and role centered, balances the readable introduction copy and uses consistent section margins. The contact character remains alongside the two-line invitation on small screens.

Spacing follows a shared hierarchy: 64px main section padding, 32px chapter gaps, 24px group gaps and 16px detail gaps; mobile uses 48px, 24px, 20px and 16px. About Me uses the chapter gap between its banner and body instead of stacking a grid gap and banner margin.
