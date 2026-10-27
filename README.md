# SWATHI — an interactive career journey

Swathi Shivashankar Reddy's React/TypeScript pixel-art portfolio:
asset loading with a four-second minimum reveal and a brief visible 100% hold → first painted mountain frame → half-second analog-TV tune-in → front-facing character peeking, blinking and jumping →
camera close-up → first-person Bay/city flight → rooftop portfolio with bubble
navigation → a selectable career journey from 2018 to 2026.

## Development phases

- Phase 1 established the application skeleton and cinematic scene architecture.
- Phase 2 developed functionality, content, responsive design and the published portfolio.
- Phase 3 uses motion to support the story. The approved design baseline is released as **Milestone / Phase 3 Design Complete**.

### Milestone / Phase 3 Design Complete

Live portfolio: [ssreddy.com](https://ssreddy.com/). Release tag: `phase-3-design-complete`.

This milestone includes the cinematic introduction, hands-free movie loop, responsive section framing, chapter-by-chapter project scrolling, updated personal story, Ritual website link and Jada.bit engineering introduction. Audio controls reflect browser autoplay availability; public GitHub entries remain non-interactive placeholders. Future refinements build on this approved baseline.

### Phase 3: portfolio in motion

After the name, role and five circles settle into view, the movie holds for three seconds. The normal idle character loop yields to the movie: a single About Me hop leads straight into its content without re-centring the landing again. The sequence is **About Me → Experience → Projects → Beyond Work → Contact**. Later chapters return to the same landing frame, where the original colored character introduces the next destination. Experience targets the employers-and-clients section; Projects targets the career timeline. The existing `#career-summary` anchor remains available.

`src/story/storyboard.ts` builds the sequence from the existing career data. Projects first shows its introduction, then plays every year from 2018–2026. The camera frames the timeline once, then changes years every three seconds without vertical page movement, panel slides or bouncing year markers. The horizontal rail reveals the selected year immediately on mobile. Visitors can pause and scroll manually to explore the full content. Detailed project cards and case studies remain available for manual exploration. The Citi tenure caption stays outside the horizontal scroller and is omitted for later years, preventing clipped date fragments. After 2026 finishes, the movie returns to the menu and continues into Beyond Work. Detailed case studies remain available through the normal manual dialogs. Beyond Work includes Ritual, Jada.bit, photography and the GitHub workspace. After Contact, a black pixel-art goodbye card leads back through loading into another complete movie cycle.

`StoryPlayer` owns a single animation-frame clock. Reading holds and scroll speed adapt to word count, section height and the viewport. Window and visual-viewport resizes retain the remaining reading progress instead of restarting the initial hold, so mobile toolbar changes cannot stall the Jada.bit-to-photography passage. Native smooth scrolling yields to the movie’s single frame clock and is restored when it pauses or unmounts. It remeasures destinations as content changes, pauses its clock in background tabs and disposes all animation frames and event handlers on unmount. `usePortfolioStory` connects this controller to React and distinguishes visitor input from programmatic scrolling. The independent three-second timeline playback yields to the tour while it owns the project story.

Wheel, touch, pointer or navigation-key input pauses automatic movement immediately. Sound controls remain usable without stopping the movie. One 18px play/pause icon sits 12px above the speaker's tap target, with no visible panel or persistent status text. A short “Pause the movie” hint appears at the first menu arrival. The same icon resumes or replays the movie; manual exploration never restarts automatically. The timeline's own pause button also pauses the movie, and only one clock owns year advancement. Reduced-motion preferences and the static graphics fallback keep manual navigation and omit automatic playback. Music still follows browser autoplay restrictions.

Adjust the idle delay, travel time, reading pace and character hold in `experience.story`. The tests use Playwright's clock to verify the complete journey without speeding up the production experience. No new rendering library, backend or service is required.

Landing and section camera targets share `storyViewport()`: at least 32px below the sticky header on mobile and 24px on desktop, with additional space when the landing frame fits. The landing reserves space for the movie hint so it does not cover the last circle on compact phones. Native anchors and movie arrivals skip the section’s outer padding, so the first content block starts at the same protected top edge. Reading ends at the actual content boundary, excluding trailing section padding. Native anchor scrolling uses the same CSS tokens. Visual viewport bounds account for mobile browser chrome; an idle landing is reframed after an orientation/viewport change before its three-second hold restarts. Reading continues with the same protected top and bottom margins.

The sequence is a functioning **prototype with temporary/procedural artwork**.
After the character's jump, bend and second peek, the camera holds for a **Pixel-Glass Floating Dialogue** beside her: “Oh, hey! You made it. 👋 Welcome to my space on the internet. Sit back, it's hands-free. I'll show you around!” The existing `IntroThoughtCloud` component now renders a frosted sage glass surface with a translucent rim, subtle highlights, softly stepped corners and a small pixel pointer. Inter body text stays crisp over the filtered backdrop; an opaque fallback preserves contrast where backdrop blur is unavailable.

The existing GSAP controller materializes the bubble with a 10px upward float, 2.5% scale change and opacity fade. It reveals complete Unicode characters at about 46ms per character with the existing typewriter cue, floats by only 1.5px over 4.8 seconds, holds the completed message for 2.5 seconds and dissolves with the existing swoosh before the original close-up and flight. There are no separate animation timers or new dependencies. Positioning tracks the character and clamps to viewport margins; the height reserves three lines to prevent typing shifts and can grow for enlarged text. Skip/replay, hidden tabs and mute retain their existing behavior. Reduced motion skips the cinematic intro, and changing the preference during dialogue stops its timeline and cues. Screen readers receive the complete message once rather than each typed letter. Text and timing live in `experience.introThought`.

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
- The renderer initializes behind the loading screen. Loading leaves only after assets and the first painted scene are ready, then a 500ms analog-TV tune-in briefly overlays the visible scenery. Renderer startup is bounded by the asset timeout. Loading automatically enters the character sequence. There is no welcome card,
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
- The speaker is available during loading too. It is an 18px icon with a transparent 44px tap target,
  without a volume slider or cancel/X icon. Explicit mute cancels automatic retry.
  Music continues into the portfolio and across replay; resources and timers are
  released on unmount. Short jump/landing effects are preloaded and use Web Audio.
- Reduced motion and absent WebGL open the semantic portfolio immediately with a
  static city backdrop. Missing scene assets show a nonblocking notice. Critical
  loads have a timeout; animation timelines pause when the page is hidden and are
  disposed on interruption.

### Time-based projects and experience

The five bubble destinations are About Me, Experience, Projects, Beyond Work and
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
across the documented tenure. Timeline playback starts automatically when the year rail is in view, allowing three seconds per stop. Manual selection pauses playback. Hidden tabs, offscreen rails, case-study dialogs and reduced motion pause or disable automatic advancement. Menu entry starts the journey again from 2018.

Music still attempts audible playback at entry from 0:45; browser autoplay policies
can require the first interaction. The speaker highlights its current state without
adding an entry gate.

Public portfolio: https://ssreddy.com/ (existing Vercel project `ssr-tech-portfolio`). Production is public; preview deployments require Vercel authentication.

The canonical and Open Graph URLs in `index.html`, `public/sitemap.xml` and the sitemap reference in `public/robots.txt` use this production domain. Navigation and asset URLs remain relative so local development, protected previews and the existing GitHub Pages build continue to work. Domain assignment, DNS, TLS and permanent redirects belong in the Vercel project's **Settings → Domains**, rather than application routing or a hardcoded hosting configuration. No custom environment variables or authentication callback URLs are required by this static portfolio.


The guide now retains the opening character’s original colors. The portfolio’s
neutral palette uses its own colors instead of a grayscale filter on the entire
page. Menu peeks reuse the neutral, blink and jump sprites with a small bounce
and hands on the circle edge. The Beyond Work guide is a tiny maker’s workshop. The seated character has visible legs under the desk; the laptop screen faces her and its back faces the viewer. Orange pixels rise toward one warm glowing bulb in a six-second loop. Motion pauses offscreen and in hidden tabs; reduced motion keeps the bulb lit.

Jada.bit’s GitHub action links to the supplied profile. Set `repository.url` in `src/content/personalProjects.ts` to a project URL when its repository is ready to share. The GitHub Projects area reserves space for builds in progress without fictitious repositories or progress metrics.

About Me uses an original pixel-art table vignette with the opening character’s face and a seated, upright body with a repeating hand wave. Three staggered coffee-steam wisps rise from the mug; they pause offscreen and stay still for reduced motion. The Experience character dabs and the team character flexes both arms in place every four seconds, holding each pose for 900 ms. Its timer pauses offscreen and in hidden tabs; reduced motion leaves a neutral pose.

The contact invitation has two lines on the left. A smaller glasses-wearing character walks across the space on the right, pauses at each end with three staggered question marks, then turns and walks back. The 3.8-second walk and 1.6-second thinking pause are configurable in `experience.guide`. Resize measurements keep both endpoints inside the available space. The shared pixel figure keeps the head, body and limb proportions consistent. GitHub actions use the supplied profile URL; the Jada.bit action is labeled as a profile link until a project-specific repository URL is supplied.

Section animations now loop while visible and pause outside the viewport or a hidden tab. The Beyond Work idea expression repeats without travelling across the text. Seated and standing figures blink without tilting their heads. Menu navigation remounts the selected guide (and contact animation) so every menu visit starts its animation from the beginning. Reduced motion leaves still poses.

Mobile layout keeps the opening name and role centered, balances the readable introduction copy and uses consistent section margins. The contact character remains alongside the two-line invitation on small screens.

Spacing follows a shared hierarchy: 64px main section padding, 32px chapter gaps, 24px group gaps and 16px detail gaps; mobile uses 48px, 24px, 20px and 16px. About Me uses the chapter gap between its banner and body instead of stacking a grid gap and banner margin.

The speaker is an 18px icon with no visible container and a 44px transparent tap target. The role uses a distinct monospaced font; mobile introduction copy balances into two lines. Circle grips share the jump timing so they disappear during raised-arm frames. The dab uses shorter arm geometry consistent with the neutral figure.

Project cards use responsive, single-line headings and consistently white case-study entry buttons. Set `windowLabel` in the project data to override the default file-style card label; Contract Transparency uses its full project name.

Beyond Work includes the approved photography story and Instagram link after Jada.bit. `src/content/photography.ts` holds the content and image source; the original repository photo is `public/portfolioPicture.jpeg`, referenced through the Vite base URL. It keeps its natural proportions inside the circular crop, uses intrinsic dimensions, lazy loading and asynchronous decoding, and retains a fallback if loading fails.

A short “Unmute to play music” hint accompanies the speaker while initial playback is blocked. It disappears after enabling music and is dismissed on intentional speaker use.

The `>_` terminal decoration was removed from Builds in progress; the existing IN DEVELOPMENT label conveys its status without an unexplained symbol.

The opening waits for both loaded assets and a painted mountain frame before removing the loader. A 500 ms analog-TV tune-in adds faint monochrome static, scanlines and horizontal tracking over the visible landscape. It clears automatically, never intercepts input and is omitted for reduced motion. Adjust `experience.loading.tvRevealMs` to change its duration without changing the cinematic timeline.

The Contact guide has 24px padding on desktop and 20px on mobile, keeping its text and Back to menu link clear of both borders.

The brief movie hint runs vertically in the right-edge gutter, outside the text column. Photography uses a prominent 420ms diamond lens flash clipped to the circular photo, synchronized with the original local shutter cue every three seconds. It waits for the actual image to load and become at least 65% visible, and stops offscreen or in a hidden tab. Reduced motion disables the effect; mute silences only the audio. Timings and mix live in `experience.photography` and `experience.audio.shutterVolume`.

The unattended movie holds on Contact for 4.5 seconds after reading, then shows a black pixel-art THE END card with a waving character for five seconds. It returns through the paced 0–100% loader, mountain introduction and city flight into a fresh tour. The selected music segment restarts without changing mute. Pause freezes the ending clock and wave; Escape or Back to portfolio exits the ending without looping. Reduced-motion and graphics-fallback views remain manual. Timings live in `experience.story`.

Public GitHub entries in Jada.bit, Builds in progress and Contact currently show a non-interactive “GitHub link coming soon” placeholder. `profile.github` is intentionally `null`; setting a URL restores the existing data-driven links. The GitHub source repository and publishing workflow remain connected.

About Me’s automatic reading passage is five seconds shorter via `experience.story.aboutTrimMs`, while preserving the content and the minimum reading time. Timeline framing holds are configurable in `experience.story`; year intervals use `experience.journey.hopMs`. Ritual includes its live website link; Jada.bit opens with Swathi’s Electronics and Communication Engineering background and relevant embedded-system topics.

Spacing follows the section → chapter → group → detail hierarchy. Desktop values are 48/24/16/12px and mobile values are 32/20/16/12px. Adjacent sections each contribute half their shared outer gap, avoiding doubled padding. Photography and cards use the group/detail levels for outer and inner spacing. The `phase-3-design-complete` tag remains the published milestone baseline; these corrections are reviewed in a preview before another publication.
