# SWATHI — a little perspective

A working first milestone of Swathi Shivashankar Reddy’s pixel-art portfolio:
real asset loading → layered mountain panorama → a front-facing character peeking
over a ridge, blinking and jumping → a usable HTML portfolio. Optional original
ambient audio begins only after a visitor chooses sound.

**This is a prototype, not the completed cinematic journey.** The POV transition,
flight between city buildings, rooftop landing, final artwork and final soundtrack
are deliberately reserved for later milestones. The distant skyline is scenery;
there is no city-flight implementation yet.

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

The deployment publishes the current first-milestone prototype with explicitly
temporary artwork/audio. Final visuals and the city flight remain future work.

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
  App.tsx                    loading / choice / playing / portfolio state
  config/experience.ts       world dimensions, camera, character, timings, session key
  assets/manifest.ts         replaceable layer URLs, identities and parallax depths
  assets/loadAssets.ts       cached critical loading, progress, timeouts, fallbacks
  hooks/                     asset lifecycle and reduced-motion preference
  scenes/MountainWorld.tsx   Pixi React scene graph and renderer lifecycle
  animation/camera.ts        responsive camera and portrait focus
  animation/SceneController.ts  GSAP timeline, stages, poses and cue events
  audio/AudioManager.ts      cue registry, gesture unlock, playback and cleanup
  components/               loading, sound, navigation, portfolio and case studies
  content/portfolio.ts      résumé-backed projects, profile and contact links
  theme/                    five-color tokens, fonts, responsive UI and focus states
public/
  assets/temporary/          eight separate layers, three character poses, poster
  assets/production/         reserved for later approved artwork
  audio/                    original temporary ambient loop and jump cue
  fonts/                    locally hosted Pixelify Sans / Inter subsets + OFL licenses
  swathi-reddy-resume.pdf    original supplied résumé
scripts/generate_placeholders.py  optional, deterministic art and audio source
tests/experience.spec.ts     functional Chromium coverage
```

The portfolio is independent of the Pixi scene and remains usable when the intro
is skipped, disabled or unavailable. Content is HTML, never text painted into a
canvas. The scene controller receives explicit bindings and completion/cue hooks;
it does not know about project content or routing.

### Loading and playback

- Progress counts completed critical textures and font loads, including settled
  failures; it does not pretend to measure bytes or insert a minimum delay.
- Fonts and scene textures are local. Cached loading is reused on replay. Audio is
  deferred until a sound interaction rather than blocking critical scene readiness.
- A missing texture becomes an empty layer and a nonblocking notice. Loading has
  a 12-second per-asset timeout. A failed loader or absent/lost WebGL falls back to
  the static scenic portfolio; project content remains available.
- With assets ready, visitors choose **Start with Sound** or **Continue Muted**.
  The sound action creates/resumes Howler’s AudioContext directly inside the user
  gesture. Playback errors are reported without blocking the muted route.
- The configured intro is 10.5 seconds: slow camera glide, a head-first peek,
  blink, playful jump, settle and fade into the portfolio. Timings are centralized.
- **Skip intro** is available from the black loading screen. Completing or
  skipping records a session flag. Reloading shows the portfolio; Replay resets
  the scene with cached assets. Replay starts muted until sound is chosen again.
- Reduced motion bypasses the animation, including when the preference changes
  while playing. The camera intentionally frames the character on narrow screens.
- The GSAP timeline is killed and the renderer unmounted on interruption. Audio
  is stopped on skip/completion/replay and unloaded when the application unmounts.

### Art, audio and performance tradeoffs

The current original procedural art and synthesized audio are **temporary**.
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
Font licenses are included beside the local font files. Audio has no commercial
samples and requires no paid service; see `public/audio/README.md` for provenance.

## Portfolio content and accessibility

Three case studies come directly from the supplied résumé. HCLTech is the employer
and Verizon the client for Magna Billing and Ecommerce Gateway; TCS is the employer
and Citigroup the client for mortgage modernization. The 90% test-coverage metric
applies to **one mortgage workflow**, not the entire platform. No employer source
code, public demo URLs, immigration information or street address is invented or
published. The email, LinkedIn and résumé link use supplied factual content.

Navigation uses ordinary anchors. Controls support keyboard input, visible focus,
mute and volume. Native modal dialogs support Escape, contain keyboard focus and
restore focus to the opening project action. Audio is optional and off by default.

## Verification and next milestones

The browser suite checks critical readiness/skip, the full muted sequence and
distinct rendered peek/jump frames, sound playback after a user gesture, volume,
mute, interruption and replay, session behavior, reduced motion, mobile layout,
keyboard case studies, résumé/contact destinations, and missing-art/audio/WebGL
fallbacks. `npm run build` includes the strict type check. No assertion or existing
check was disabled to make this workflow pass.

Next, review the placeholder sequence and choose the final pixel scale, character
design and landscape detail. Then implement the shoulder/POV transition (removing
the character from view), controlled flight across the Bay and between buildings,
rooftop arrival and additional licensed audio cues. Those are future milestones,
not hidden behind a claim that the full journey is complete. Nothing is deployed
publicly by the setup or build commands.
