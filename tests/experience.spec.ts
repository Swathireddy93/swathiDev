import { test, expect, devices } from '@playwright/test'

const sound = '.sound-controls'

test.beforeEach(async ({ page }) => {
  // Model a browser that refuses audible autoplay until a real user gesture.
  // Chromium's policy flag alone can allow initially-zero-volume HTML5 playback.
  await page.addInitScript(() => {
    let permitted = false
    document.addEventListener('click', event => { if (event.isTrusted) permitted = true }, true)
    document.addEventListener('keydown', event => {
      if (event.isTrusted && ['Enter', ' '].includes(event.key)) permitted = true
    }, true)
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes('portfolio-background.mp3') && !permitted) {
        return Promise.reject(new DOMException('A user gesture is required.', 'NotAllowedError'))
      }
      return play.call(this)
    }
  })
})

async function skipToPortfolio(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
}

test('the supplied music supports byte-range streaming', async ({ request }) => {
  const response = await request.get('/audio/portfolio-background.mp3', { headers: { Range: 'bytes=0-1023' } })
  expect(response.status()).toBe(206)
  expect(response.headers()['content-type']).toContain('audio/mpeg')
  expect(response.headers()['content-range']).toMatch(/^bytes 0-1023\/\d+$/)
  expect((await response.body()).length).toBe(1024)
})

test('loading tracks real assets, exposes sound immediately, and can be skipped', async ({ page }) => {
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/assets/temporary/bay.png', async route => { await held; await route.continue() })
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('loading-screen')).toBeVisible()
    const progress = page.getByRole('progressbar')
    expect(Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(100)
    await expect(page.locator('.sound-toggle')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Play intro' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Skip intro' }).click()
    await expect(page.getByTestId('portfolio')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Explore portfolio' })).toBeVisible()
  } finally { release() }
})

test('loading is paced to 100% before the clean unlabeled introduction', async ({ page }) => {
  await page.goto('/')
  const progress = page.getByRole('progressbar')
  await expect(progress).toBeVisible()
  expect(Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(100)
  await expect(progress).toHaveAttribute('aria-valuenow', '100')
  await expect(page.getByTestId('loading-screen')).toBeVisible()
  await expect(page.locator('.app')).toHaveAttribute('data-phase', 'playing')
  await expect(page.locator('.wordmark')).toHaveText('SWATHI')
  await expect(page.locator('.wordmark span')).toHaveCount(0)
  await expect(page.locator('.scene-caption')).toHaveCount(0)
  await expect(page.getByText(/01 \/ THE OVERLOOK|02 \/ SAN FRANCISCO/)).toHaveCount(0)
})

test('the automatic character, close-up, POV flight and rooftop arrival form one journey', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Unmute sound' }).click()
  await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'playing')
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'peeking')
  await expect(page.locator('.pixi-world canvas')).toHaveCount(1)
  await page.screenshot({ path: info.outputPath('girl-peeking.png') })
  await expect(page.locator(sound)).toHaveAttribute('data-last-cue', 'jump')
  await expect(page.locator(sound)).toHaveAttribute('data-last-cue', 'land')
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'approaching')
  await page.waitForTimeout(2200)
  await page.screenshot({ path: info.outputPath('character-close-up.png') })
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'pov')
  await expect(page.getByTestId('city-flight')).toBeVisible()
  await expect(page.locator('.pixi-world')).toHaveCount(0)
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'downtown')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: info.outputPath('downtown-flight.png') })
  await expect(page.getByTestId('portfolio')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'landed')
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0)
  await expect(page.getByText('THE BAY AREA → DOWNTOWN')).toHaveCount(0)
  const bubbles = page.getByRole('navigation', { name: 'Explore portfolio' })
  for (const label of ['About Me', 'Experience', 'Projects', 'Experiments', 'Contact']) {
    await expect(bubbles.getByRole('link', { name: label, exact: true })).toBeVisible()
  }
  await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'playing')
  await expect(bubbles.getByRole('link', { name: 'Contact', exact: true })).toHaveCSS('opacity', '1')
  await expect(page.locator(sound)).toHaveAttribute('data-last-cue', 'bubble')
  await expect(bubbles).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: info.outputPath('rooftop-bubbles.png') })
  expect(errors).toEqual([])
})

test('blocked autoplay recovers on the first ordinary interaction without a sound gate', async ({ page }) => {
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/assets/temporary/bay.png', async route => { await held; await route.continue() })
  try {
    await page.goto('/')
    await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'muted')
    await expect(page.getByText('Sound couldn’t start.', { exact: false })).not.toBeVisible()
    await page.getByTestId('loading-screen').click({ position: { x: 40, y: 140 } })
    await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'playing')
  } finally { release() }
})

test('muting, skip and replay preserve the chosen sound state and clean up the old scene', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Unmute sound' }).click()
  await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'playing')
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
  await expect(page.locator('.pixi-world')).toHaveCount(0)
  await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'playing')
  await page.getByRole('button', { name: 'Mute sound' }).click()
  await page.getByRole('button', { name: 'Replay the introduction' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'peeking')
  await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'muted')
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await page.reload()
  await expect(page.getByTestId('intro')).toBeVisible()
})

test('year navigation changes dated projects and supports keyboard travel', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Swathi Shivashankar Reddy' })).toBeVisible()
  await expect(page.getByTestId('intro')).toHaveCount(0)
  await expect(page.getByRole('tab', { name: '2018', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('button', { name: 'Read case study: Mortgage Application Modernization' })).toBeVisible()
  await page.getByRole('tab', { name: '2018', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: '2019', exact: true })).toBeFocused()
  await expect(page.getByRole('tabpanel')).toContainText('Tools documented across the 2018–2024 chapter')
  await page.getByRole('tab', { name: '2024', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Read case study: Vision IoT', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Read case study: Magna Billing Operations Platform' })).toHaveCount(0)
  await page.getByRole('tab', { name: '2025', exact: true }).click()
  for (const title of ['VBG Automation', 'Contract Transparency Platform', 'Ecommerce Gateway Platform']) {
    await expect(page.getByRole('button', { name: `Read case study: ${title}`, exact: true })).toBeVisible()
  }
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: '2026', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toContainText('GitHub Copilot')
  await expect(page.getByRole('tabpanel')).toContainText('LEARNING & EXPLORATION')
  await page.screenshot({ path: info.outputPath('career-2026.png'), fullPage: true })
  await expect(page.getByRole('button', { name: 'Play timeline' })).toBeDisabled()
})

test('timeline playback hops forward and manual selection pauses it', async ({ page }) => {
  await skipToPortfolio(page)
  await page.getByRole('tab', { name: '2025', exact: true }).click()
  await page.getByRole('button', { name: 'Play timeline' }).click()
  await expect(page.getByRole('tab', { name: '2026', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('tab', { name: '2024', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Play timeline' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('tabpanel')).toHaveAttribute('data-year', '2024')
})

test('all six dated case studies, résumé and contact remain accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const cases: [string, string[]][] = [
    ['2018', ['Mortgage Application Modernization']],
    ['2024', ['Vision IoT']],
    ['2025', ['VBG Automation', 'Contract Transparency Platform', 'Ecommerce Gateway Platform']],
    ['2026', ['Magna Billing Operations Platform']],
  ]
  for (const [year, titles] of cases) {
    await page.getByRole('tab', { name: year, exact: true }).click()
    for (const title of titles) {
      const trigger = page.getByRole('button', { name: `Read case study: ${title}`, exact: true })
      await trigger.focus(); await page.keyboard.press('Enter')
      await expect(page.getByRole('dialog').getByRole('heading', { name: title })).toBeVisible()
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true)
      await page.keyboard.press('Escape')
      await expect(trigger).toBeFocused()
    }
  }
  const resume = await page.request.get('/swathi-reddy-resume.pdf')
  expect((await resume.body()).subarray(0, 4).toString()).toBe('%PDF')
  await expect(page.getByRole('link', { name: 'swathisreddy.work@gmail.com' })).toHaveAttribute('href', 'mailto:swathisreddy.work@gmail.com')
})

test('missing character art does not block the portfolio', async ({ page }) => {
  await page.route('**/character-neutral.png', route => route.fulfill({ status: 404, body: 'not found' }))
  await page.goto('/')
  await expect(page.getByText('Some scenery is unavailable.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
})

test('a browser without WebGL receives the static city portfolio', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.goto('/')
  await expect(page.getByTestId('portfolio')).toBeVisible()
  await expect(page.locator('.pixi-world')).toHaveCount(0)
  await expect(page.getByText('A quieter, static view.')).toBeVisible()
})

test('a failed music request can be retried without blocking navigation', async ({ page }) => {
  await page.route('**/audio/portfolio-background.mp3', route => route.fulfill({ status: 404, body: 'not found' }))
  await page.goto('/')
  await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'error')
  await page.unroute('**/audio/portfolio-background.mp3')
  await page.getByRole('button', { name: 'Unmute sound' }).click()
  await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'playing')
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
})

test.describe('touchscreen journey', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent })
  test('automatic character, speaker, bubble menu and timeline work with taps', async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/')
    await page.getByRole('button', { name: 'Unmute sound' }).tap()
    await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'playing')
    await expect(page.locator('.app')).toHaveAttribute('data-scene', 'peeking')
    await page.waitForTimeout(500)
    await page.screenshot({ path: info.outputPath('mobile-girl.png') })
    await page.getByRole('button', { name: 'Skip intro' }).tap()
    const bubbles = page.getByRole('navigation', { name: 'Explore portfolio' })
    await expect(bubbles.getByRole('link')).toHaveCount(5)
    await page.screenshot({ path: info.outputPath('mobile-bubbles.png') })
    await bubbles.getByRole('link', { name: 'Projects', exact: true }).tap()
    await page.getByRole('tab', { name: '2026', exact: true }).tap()
    await expect(page.getByRole('tabpanel')).toHaveAttribute('data-year', '2026')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Mute sound' }).tap()
    await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'muted')
    await page.getByRole('button', { name: 'Unmute sound' }).tap()
    await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'playing')
    await page.screenshot({ path: info.outputPath('mobile-timeline.png') })
    expect(errors).toEqual([])
  })

  test('muting during a slow automatic audio download remains muted on load', async ({ page }) => {
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    await page.route('**/audio/portfolio-background.mp3', async route => { await held; await route.continue() })
    try {
      await page.goto('/')
      await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'loading')
      await page.getByRole('button', { name: 'Mute sound' }).tap()
      const loaded = page.waitForResponse('**/audio/portfolio-background.mp3')
      release(); await loaded
      await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'muted')
      await page.getByRole('button', { name: 'Skip intro' }).tap()
      await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'muted')
    } finally { release() }
  })
})


test('Citi has six distinct story stops with a shared toolset', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const titles = new Set<string>()
  let tools = ''
  for (let year = 2018; year <= 2023; year++) {
    await page.getByRole('tab', { name: String(year), exact: true }).click()
    const chapter = page.locator('.chapter-story')
    titles.add(await chapter.locator('h3').innerText())
    await expect(chapter.locator('.story-step')).toContainText(`${String(year - 2017).padStart(2, '0')} / 06`)
    const currentTools = await chapter.locator('.tags').innerText()
    if (year === 2018) tools = currentTools
    else expect(currentTools).toBe(tools)
    await expect(page.locator('.citi-case-link')).toContainText('One project · six perspectives')
  }
  expect(titles.size).toBe(6)
  await expect(page.locator('.chapter-story')).toContainText('90% coverage achieved on one mortgage workflow')
})

test('the monochrome guide peeks behind the menu in sequence and follows navigation', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  const about = menu.locator('[data-menu-guide="about"]')
  await expect(about).toHaveClass(/is-peeking/)
  await page.screenshot({ path: info.outputPath('menu-character-peek.png') })
  await expect(about).not.toHaveClass(/is-peeking/)
  await expect(menu.locator('[data-menu-guide="experience"]')).toHaveClass(/is-peeking/)
  for (const [label, section] of [['About Me', 'about'], ['Experience', 'experience'], ['Projects', 'projects'], ['Experiments', 'experiments'], ['Contact', 'contact']]) {
    await menu.getByRole('link', { name: label, exact: true }).click()
    await expect(menu.locator('.is-peeking')).toHaveCount(0)
    const guide = page.locator(`[data-guide-section="${section}"]`)
    await expect(guide).toBeInViewport({ ratio: 1 })
    await guide.getByRole('link', { name: 'Back to menu' }).click()
    await expect(menu).toBeFocused()
    await expect(menu).toBeInViewport({ ratio: 1 })
  }
})

test('reduced motion keeps the returning guide still and all menu destinations accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await expect(menu.locator('[data-menu-guide="about"]')).toHaveClass(/is-peeking/)
  expect(await menu.locator('[data-menu-guide="about"] .menu-pose-neutral').evaluate(image => getComputedStyle(image).filter)).toBe('none')
  await menu.getByRole('link', { name: 'Contact', exact: true }).click()
  await page.locator('[data-guide-section="contact"]').getByRole('link', { name: 'Back to menu' }).click()
  await expect(menu).toBeFocused()
})


test('the menu character repeats all five destinations with a soft sound and respects mute', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await expect(menu).toBeInViewport({ ratio: 1 })
  const unmute = page.getByRole('button', { name: 'Unmute sound' })
  if (await unmute.isVisible()) await unmute.click()
  await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'playing')
  for (const id of ['about', 'experience', 'projects', 'experiments', 'contact', 'about']) {
    const peek = menu.locator(`[data-menu-guide="${id}"]`)
    await expect(peek).toHaveClass(/is-peeking/)
    await expect(peek.locator('.menu-peek-sprite')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
    await expect(page.locator(sound)).toHaveAttribute('data-last-cue', 'peek')
    if (id === 'contact') await page.screenshot({ path: info.outputPath('contact-peek.png') })
    await expect(peek).not.toHaveClass(/is-peeking/)
  }
  await page.getByRole('button', { name: 'Mute sound' }).click()
  await expect(menu.locator('[data-menu-guide="experience"]')).toHaveClass(/is-peeking/)
  await expect(page.locator(sound)).toHaveAttribute('data-audio-status', 'muted')
  await menu.getByRole('link', { name: 'About Me', exact: true }).click()
  await expect(page.locator('[data-guide-section="about"]')).toBeInViewport({ ratio: 1 })
  // Returning by ordinary scrolling must restart the guide too.
  await menu.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await expect(menu.locator('[data-menu-guide="about"]')).toHaveClass(/is-peeking/)

})

test('About Me includes the supplied story with emphasis and the résumé link', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const about = page.locator('#about .about-copy')
  await expect(about.locator('p')).toHaveCount(6)
  await expect(about).toContainText("I'm Swathi, a developer, a curious mind, and someone who loves turning ideas into things that actually exist.")
  await expect(about.locator('em')).toHaveText('"What if?"')
  await expect(about.locator('strong')).toHaveText('I believe the most interesting things happen when curiosity meets the ability to build.')
  await expect(about.getByRole('link', { name: 'The full story, on my résumé' })).toHaveAttribute('href', /swathi-reddy-resume.pdf$/)
})


test('Experiments pairs the character with a looping warm idea bulb that pauses and restarts', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.getByRole('link', { name: 'Experiments', exact: true }).click()
  const guide = page.locator('[data-guide-section="experiments"]')
  const character = guide.locator('.character-idea')
  const bulb = character.locator('.idea-bulb')
  await expect(character).toHaveAttribute('data-motion-active', 'true')
  await expect(guide.locator('.guide-actor')).toHaveCount(0)
  await expect(bulb).toHaveCSS('opacity', '1')
  await expect(character.locator('.figure-tada-arm')).toHaveCSS('rotate', '0deg')
  await page.screenshot({ path: info.outputPath('idea-bulb-lit.png') })
  // Returning to the dim state proves the full expression repeats.
  await expect(bulb).toHaveCSS('opacity', '0.3')
  await expect(character.locator('.figure-tada-arm')).toHaveCSS('rotate', '70deg')
  await page.locator('#contact-title').scrollIntoViewIfNeeded()
  await expect(character).toHaveAttribute('data-motion-active', 'false')
  await expect(bulb).toHaveCSS('animation-play-state', 'paused')
  await expect(character.locator('.figure-tada-arm')).toHaveCSS('animation-play-state', 'paused')
  const paused = await bulb.evaluate(element => Number(element.getAnimations()[0].currentTime))
  await page.waitForTimeout(350)
  const stillPaused = await bulb.evaluate(element => Number(element.getAnimations()[0].currentTime))
  expect(Math.abs(stillPaused - paused)).toBeLessThan(30)
  await menu.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await menu.getByRole('link', { name: 'Experiments', exact: true }).click()
  await expect(character).toHaveAttribute('data-motion-active', 'true')
  const restarted = await bulb.evaluate(element => Number(element.getAnimations()[0].currentTime))
  expect(restarted).toBeLessThan(1600)
  await page.setViewportSize({ width: 390, height: 844 })
  await guide.scrollIntoViewIfNeeded()
  await expect(character).toBeInViewport({ ratio: 1 })
  expect((await guide.boundingBox())!.height).toBeLessThan(240)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await page.screenshot({ path: info.outputPath('idea-bulb-mobile.png') })
})

test('the seated wave and expressions loop only in view and restart after a menu visit', async ({ page }) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.getByRole('link', { name: 'About Me', exact: true }).click()
  const rest = page.locator('.character-rest-scene')
  const blink = rest.locator('.character-face-blink')
  await expect(rest).toHaveAttribute('data-motion-active', 'true')
  await expect(blink).toHaveCSS('animation-iteration-count', 'infinite')
  await expect(rest.locator('.seated-wave')).toHaveCSS('animation-iteration-count', 'infinite')
  await expect(rest.locator('.pixel-figure-head')).toHaveCSS('transform', 'none')
  // Blinks last under 200 ms, so sample more often than the default assertion poll.
  await expect.poll(() => blink.evaluate(element => getComputedStyle(element).opacity), { intervals: [50], timeout: 6000 }).toBe('1')
  await expect(blink).toHaveCSS('opacity', '0')
  await page.locator('#contact-title').scrollIntoViewIfNeeded()
  await expect(rest).toHaveAttribute('data-motion-active', 'false')
  await expect(blink).toHaveCSS('animation-play-state', 'paused')
  await menu.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await menu.getByRole('link', { name: 'About Me', exact: true }).click()
  await expect(rest).toHaveAttribute('data-motion-active', 'true')
  const elapsed = await blink.evaluate(element => Number(element.getAnimations()[0].currentTime))
  expect(elapsed).toBeLessThan(1600)
})

test('reduced motion keeps the idea bulb lit without animating the character', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Explore portfolio' }).getByRole('link', { name: 'Experiments', exact: true }).click()
  const character = page.locator('.character-idea')
  await expect(character.locator('.idea-bulb')).toHaveCSS('opacity', '1')
  await expect(character.locator('.idea-bulb')).toHaveCSS('animation-name', 'none')
  await expect(character.locator('.pixel-figure-head')).toHaveCSS('transform', 'none')
})

test('About Me has an upright seated wave and teams flex in place at four-second intervals', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await expect(menu).toBeInViewport({ ratio: 1 })
  await menu.getByRole('link', { name: 'About Me', exact: true }).click()
  const rest = page.locator('[data-guide-section="about"]')
  await expect(rest.locator('.character-rest-scene')).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: info.outputPath('resting-at-table.png') })
  const teams = page.locator('[data-guide-section="career-summary"]')
  await teams.scrollIntoViewIfNeeded()
  const character = teams.locator('.posing-character')
  const before = await character.boundingBox()
  await expect(character).toHaveAttribute('data-character-pose', 'flex')
  await expect(character.locator('.rig-flex-arm').first()).toHaveCSS('opacity', '1')
  await page.screenshot({ path: info.outputPath('teams-flex.png') })
  await expect(character).toHaveAttribute('data-character-pose', 'neutral')
  await expect(character).toHaveAttribute('data-pose-count', '2', { timeout: 6000 })
  const after = await character.boundingBox()
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(1)
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(1)
  await page.setViewportSize({ width: 390, height: 844 })
  await rest.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await page.screenshot({ path: info.outputPath('resting-at-table-mobile.png') })
})

test('reduced motion leaves the Experience and team characters neutral', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const section of ['experience', 'career-summary']) {
    const character = page.locator(`[data-guide-section="${section}"] .posing-character`)
    await character.scrollIntoViewIfNeeded()
    await page.waitForTimeout(4200)
    await expect(character).toHaveAttribute('data-character-pose', 'neutral')
    await expect(character).toHaveAttribute('data-pose-count', '0')
  }
})

test('Experience repeats a planted dab and restarts when opened from the menu', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.getByRole('link', { name: 'Experience', exact: true }).click()
  const guide = page.locator('[data-guide-section="experience"]')
  const character = guide.locator('.posing-character')
  await expect(guide).toBeInViewport({ ratio: 1 })
  // Measure within the guide, independent of the menu's smooth page scroll.
  const plantedPosition = () => character.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    const guideBounds = element.closest('.section-character-guide')!.getBoundingClientRect()
    return { x: bounds.x - guideBounds.x, y: bounds.y - guideBounds.y }
  })
  const before = await plantedPosition()
  await expect(character).toHaveAttribute('data-character-pose', 'dab')
  await expect(character.locator('.rig-dab-arm').first()).toHaveCSS('opacity', '1')
  await expect(character.locator('.rig-head')).not.toHaveCSS('transform', 'none')
  const during = await plantedPosition()
  expect(during.x).toBe(before.x)
  expect(during.y).toBe(before.y)
  await page.screenshot({ path: info.outputPath('experience-dab-desktop.png') })
  await expect(character).toHaveAttribute('data-character-pose', 'neutral')
  await expect(character).toHaveAttribute('data-pose-count', '2', { timeout: 6000 })
  await guide.getByRole('link', { name: 'Back to menu' }).click()
  await menu.getByRole('link', { name: 'Experience', exact: true }).click()
  await expect(character).toHaveAttribute('data-pose-count', '0')
  await page.setViewportSize({ width: 390, height: 844 })
  await guide.scrollIntoViewIfNeeded()
  await expect(character).toHaveAttribute('data-character-pose', 'dab')
  await page.screenshot({ path: info.outputPath('experience-dab-mobile.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await page.locator('#contact-title').scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  const count = await character.getAttribute('data-pose-count')
  await page.waitForTimeout(4200)
  await expect(character).toHaveAttribute('data-pose-count', count!)
})


test('contact puts a smaller character right of a two-line invitation with working GitHub links', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const profile = 'https://github.com/Swathireddy93/'
  await expect(page.locator('.personal-project-jada-bit .project-repository a')).toHaveAttribute('href', profile)
  await expect(page.locator('#github-projects a')).toHaveAttribute('href', profile)
  await expect(page.locator('#contact').getByRole('link', { name: 'GitHub', exact: false })).toHaveAttribute('href', profile)
  await page.locator('#contact-title').scrollIntoViewIfNeeded()
  const verifyPortrait = async () => {
    const portrait = page.locator('.thinking-figure')
    await expect(portrait.locator('.character-glasses')).toBeVisible()
    expect((await portrait.boundingBox())!.width).toBe(72)
    const heading = page.locator('#contact-title')
    await expect(heading.locator('span')).toHaveCount(2)
    const lines = await heading.locator('span').evaluateAll(elements => elements.map(element => {
      const range = document.createRange(); range.selectNodeContents(element)
      return { lines: range.getClientRects().length, width: range.getBoundingClientRect().width, available: element.clientWidth }
    }))
    for (const line of lines) { expect(line.lines).toBe(1); expect(line.width).toBeLessThanOrEqual(line.available) }
    const titleBox = await heading.boundingBox(), track = await page.locator('.thinking-character').boundingBox()
    expect(track!.x).toBeGreaterThanOrEqual(titleBox!.x + titleBox!.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  }
  await verifyPortrait()
  await page.screenshot({ path: info.outputPath('contact-thinking.png') })
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.locator('#contact-title').scrollIntoViewIfNeeded()
    await verifyPortrait()
    await page.screenshot({ path: info.outputPath(`contact-thinking-${width}.png`) })
  }
  expect(errors).toEqual([])
})


test('contact performs Bees Knees with planted feet, pauses offscreen and restarts from the menu', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.getByRole('link', { name: 'Contact', exact: true }).click()
  const track = page.locator('.thinking-character')
  const knee = track.locator('.bees-knee-left')
  const arm = track.locator('.bees-arm-left')
  const feet = track.locator('.bees-foot')
  await expect(track).toHaveAttribute('data-motion-active', 'true')
  const initialKnee = await knee.getAttribute('d'), initialArm = await arm.getAttribute('d')
  const originalFeet = await feet.getAttribute('d')
  await page.waitForTimeout(350)
  expect(await knee.getAttribute('d')).not.toBe(initialKnee)
  expect(await arm.getAttribute('d')).not.toBe(initialArm)
  await expect(feet).toHaveAttribute('d', originalFeet!)
  await page.screenshot({ path: info.outputPath('contact-bees-knees.png') })
  await expect(track.locator('.question-one')).toHaveCSS('opacity', '1')
  await page.locator('#about-title').scrollIntoViewIfNeeded()
  await expect(track).toHaveAttribute('data-motion-active', 'false')
  const paused = await knee.getAttribute('d')
  await page.waitForTimeout(350)
  await expect(knee).toHaveAttribute('d', paused!)
  const oldInstance = await track.elementHandle()
  await menu.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await menu.getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(track).toHaveAttribute('data-motion-active', 'true')
  expect(await oldInstance!.evaluate(element => element.isConnected)).toBe(false)
})

test('mobile content shares reading margins and the opening name and role are centered', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const width of [320, 390, 700]) {
    await page.setViewportSize({ width, height: 844 })
    await page.locator('#hero-title').scrollIntoViewIfNeeded()
    for (const selector of ['#hero-title', '.hero-role']) {
      const center = await page.locator(selector).evaluate(element => {
        const range = document.createRange(); range.selectNodeContents(element)
        const box = range.getBoundingClientRect(); return box.x + box.width / 2
      })
      expect(Math.abs(center - width / 2)).toBeLessThan(2)
    }
    for (const id of ['experience', 'about', 'career-summary', 'experiments', 'contact']) {
      const section = page.locator(`#${id}`)
      await section.scrollIntoViewIfNeeded()
      const bounds = (await section.boundingBox())!
      expect(bounds.x).toBe(22)
      expect(Math.round(bounds.x + bounds.width)).toBe(width - 22)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.screenshot({ path: info.outputPath(`portfolio-mobile-${width}.png`), fullPage: true })
  }
})
