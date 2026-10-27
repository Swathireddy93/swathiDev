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
  // These checks exercise manual exploration; automatic playback has its own suite.
  await page.getByRole('button', { name: 'Pause the movie', exact: true }).click()
  await page.locator('#portfolio-menu').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
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
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'approaching', { timeout: 20_000 })
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
  for (const label of ['About Me', 'Experience', 'Projects', 'Beyond Work', 'Contact']) {
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
  for (const [label, section] of [['About Me', 'about'], ['Experience', 'experience'], ['Projects', 'projects'], ['Beyond Work', 'experiments'], ['Contact', 'contact']]) {
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
  await expect(about.locator('p')).toHaveCount(7)
  await expect(about.locator('p').first()).toHaveText("Hey, I'm Swathi!")
  await expect(page.locator('[data-guide-section="about"] p')).toHaveText('Let me share a little about how I work.')
  await expect(about).toContainText("But my curiosity doesn't really clock out after work.")
  await expect(about.locator('em')).toHaveText('"Wait, what if I tried this?"')
  await expect(about.locator('strong')).toHaveText("So, this little corner of the internet is a mix of what I've learned, what I've built and everything I'm still curious about.")
  await expect(about.getByRole('link', { name: 'The full story, on my résumé' })).toHaveAttribute('href', /swathi-reddy-resume.pdf$/)
})


test('the seated workshop lights a bulb, pauses offscreen and restarts on menu entry', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.getByRole('link', { name: 'Beyond Work', exact: true }).click()
  const guide = page.locator('[data-guide-section="experiments"]')
  const character = guide.locator('.idea-workshop')
  const bulb = character.locator('.idea-lightbulb')
  await expect(guide.locator('p')).toHaveText('These are ideas I brought to life beyond my enterprise work!')
  await expect(character).toHaveAttribute('data-motion-active', 'true')
  await expect(bulb).toHaveCSS('opacity', '1')
  await expect(character.locator('.idea-web-build, .idea-wearable-build')).toHaveCount(0)
  await expect(character.locator('.maker-seated-legs')).toBeVisible()
  await expect(character.locator('.laptop-back')).toBeVisible()
  await page.screenshot({ path: info.outputPath('ideas-built-at-desk.png') })
  await expect(bulb).toHaveCSS('opacity', '0')
  await page.locator('#contact-title').scrollIntoViewIfNeeded()
  await expect(character).toHaveAttribute('data-motion-active', 'false')
  await expect(bulb).toHaveCSS('animation-play-state', 'paused')
  await expect(character.locator('.maker-character .typing-hand-left')).toHaveCSS('animation-play-state', 'paused')
  const paused = await bulb.evaluate(element => Number(element.getAnimations()[0].currentTime))
  await page.waitForTimeout(350)
  const stillPaused = await bulb.evaluate(element => Number(element.getAnimations()[0].currentTime))
  expect(Math.abs(stillPaused - paused)).toBeLessThan(30)
  await menu.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await menu.getByRole('link', { name: 'Beyond Work', exact: true }).click()
  await expect(character).toHaveAttribute('data-motion-active', 'true')
  const restarted = await bulb.evaluate(element => Number(element.getAnimations()[0].currentTime))
  expect(restarted).toBeLessThan(1600)
  await page.setViewportSize({ width: 390, height: 844 })
  await guide.scrollIntoViewIfNeeded()
  await expect(character).toBeInViewport({ ratio: 1 })
  expect((await guide.boundingBox())!.height).toBeLessThan(240)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await page.screenshot({ path: info.outputPath('idea-workshop-mobile.png') })
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

test('reduced motion shows the lit idea bulb and still coffee steam', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Explore portfolio' }).getByRole('link', { name: 'Beyond Work', exact: true }).click()
  const workshop = page.locator('.idea-workshop')
  for (const selector of ['.idea-lightbulb']) {
    await expect(workshop.locator(selector)).toHaveCSS('opacity', '1')
    await expect(workshop.locator(selector)).toHaveCSS('animation-name', 'none')
  }
  await expect(workshop.locator('.pixel-figure-head')).toHaveCSS('transform', 'none')
  await page.locator('[data-guide-section="about"]').scrollIntoViewIfNeeded()
  await expect(page.locator('.steam-one')).toHaveCSS('animation-name', 'none')
  await expect(page.locator('.steam-one')).toHaveCSS('opacity', '0.4')
})

test('About Me has an upright seated wave and teams flex in place at four-second intervals', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await expect(menu).toBeInViewport({ ratio: 1 })
  await menu.getByRole('link', { name: 'About Me', exact: true }).click()
  const rest = page.locator('[data-guide-section="about"]')
  await expect(rest.locator('.character-rest-scene')).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: info.outputPath('resting-at-table.png') })
  const teams = page.locator('[data-guide-section="experience"]')
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
  for (const section of ['projects', 'experience']) {
    const character = page.locator(`[data-guide-section="${section}"] .posing-character`)
    await character.scrollIntoViewIfNeeded()
    await page.waitForTimeout(4200)
    await expect(character).toHaveAttribute('data-character-pose', 'neutral')
    await expect(character).toHaveAttribute('data-pose-count', '0')
  }
})

test('the Projects timeline repeats a planted dab and restarts when opened from the menu', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.getByRole('link', { name: 'Projects', exact: true }).click()
  const guide = page.locator('[data-guide-section="projects"]')
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
  const armSizes = await character.locator('.rig-dab-arm').evaluateAll(elements => elements.map(element => {
    const bounds = (element as SVGGElement).getBBox(); return { width: bounds.width, height: bounds.height }
  }))
  for (const arm of armSizes) { expect(arm.width).toBeLessThanOrEqual(24); expect(arm.height).toBeLessThanOrEqual(26) }
  const during = await plantedPosition()
  expect(during.x).toBe(before.x)
  expect(during.y).toBe(before.y)
  await page.screenshot({ path: info.outputPath('experience-dab-desktop.png') })
  await expect(character).toHaveAttribute('data-character-pose', 'neutral')
  await expect(character).toHaveAttribute('data-pose-count', '2', { timeout: 6000 })
  await guide.getByRole('link', { name: 'Back to menu' }).click()
  await menu.getByRole('link', { name: 'Projects', exact: true }).click()
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


test('contact keeps its two-line invitation and all GitHub entries are non-interactive placeholders', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /GitHub/ })).toHaveCount(0)
  await expect(page.locator('.github-placeholder')).toHaveCount(3)
  for (const section of ['.personal-project-jada-bit .project-repository', '#github-projects', '#contact']) {
    const placeholder = page.locator(`${section} .github-placeholder`)
    await expect(placeholder).toHaveText(/GitHub link coming soon/)
    await expect(placeholder).not.toHaveAttribute('href')
    await expect(placeholder).not.toHaveAttribute('tabindex')
  }
  await page.locator('#contact-title').scrollIntoViewIfNeeded()
  const verifyPortrait = async () => {
    const portrait = page.locator('.thinking-figure')
    await expect(portrait.locator('.character-glasses')).toBeVisible()
    expect((await portrait.boundingBox())!.width).toBe(60)
    await expect(page.locator('.question-one')).toHaveCSS('animation-name', 'none')
    await expect(page.locator('.question-one')).toHaveCSS('opacity', '1')
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


test('contact walks out and back, pauses to think and restarts from the menu', async ({ page }, info) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.getByRole('link', { name: 'Contact', exact: true }).click()
  const track = page.locator('.thinking-character')
  const traveler = track.locator('.thinking-traveler')
  const position = () => traveler.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).e)
  await expect(track).toHaveAttribute('data-motion-active', 'true')
  await expect(track).toHaveAttribute('data-walk-state', 'thinking')
  const farEnd = await position()
  expect(farEnd).toBeGreaterThan(30)
  await expect(track.locator('.question-one')).toHaveCSS('opacity', '1')
  await page.screenshot({ path: info.outputPath('contact-thinking-at-end.png') })
  await expect(track).toHaveAttribute('data-walk-direction', 'left')
  await expect.poll(position).toBeLessThan(farEnd - 20)
  await expect(track).toHaveAttribute('data-walk-state', 'thinking')
  expect(await position()).toBeLessThan(2)
  await page.locator('#about-title').scrollIntoViewIfNeeded()
  await expect(track).toHaveAttribute('data-motion-active', 'false')
  const paused = await position()
  await page.waitForTimeout(350)
  expect(Math.abs(await position() - paused)).toBeLessThan(.1)
  const oldInstance = await track.elementHandle()
  await menu.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await menu.getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(track).toHaveAttribute('data-motion-active', 'true')
  expect(await oldInstance!.evaluate(element => element.isConnected)).toBe(false)
  await expect(track).toHaveAttribute('data-walk-direction', 'right')
  expect(await position()).toBeLessThan(15)
  await page.setViewportSize({ width: 390, height: 844 })
  await track.scrollIntoViewIfNeeded()
  await expect(track).toHaveAttribute('data-walk-state', 'thinking')
  const actorBounds = (await traveler.boundingBox())!, trackBounds = (await track.boundingBox())!
  expect(actorBounds.x).toBeGreaterThanOrEqual(trackBounds.x - 1)
  expect(actorBounds.x + actorBounds.width).toBeLessThanOrEqual(trackBounds.x + trackBounds.width + 1)
  await page.screenshot({ path: info.outputPath('contact-thinking-mobile.png') })
})

test('mobile content shares reading margins and the opening name and role are centered', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const width of [320, 360, 390, 430, 700]) {
    await page.setViewportSize({ width, height: 844 })
    await page.locator('#hero-title').scrollIntoViewIfNeeded()
    for (const selector of ['#hero-title', '.hero-role']) {
      const center = await page.locator(selector).evaluate(element => {
        const range = document.createRange(); range.selectNodeContents(element)
        const box = range.getBoundingClientRect(); return box.x + box.width / 2
      })
      expect(Math.abs(center - width / 2)).toBeLessThan(2)
    }
    const descriptionLines = await page.locator('.hero-description').evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element); return range.getClientRects().length
    })
    expect(descriptionLines).toBe(2)
    await expect(page.locator('.hero-role')).toHaveCSS('font-family', /monospace/)
    for (const id of ['projects', 'about', 'experience', 'experiments', 'contact']) {
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


test('the compact sound icon has no visible container and still toggles audio', async ({ page }) => {
  await skipToPortfolio(page)
  const controls = page.locator('.sound-controls')
  await expect(controls).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(controls).toHaveCSS('border-top-width', '0px')
  await expect(controls).toHaveCSS('box-shadow', 'none')
  await expect(controls.locator('svg')).toHaveAttribute('width', '18')
  expect((await controls.locator('.sound-toggle').boundingBox())!.width).toBeGreaterThanOrEqual(44)
  const unmute = page.getByRole('button', { name: 'Unmute sound' })
  if (await unmute.isVisible()) await unmute.click()
  await expect(controls).toHaveAttribute('data-audio-status', 'playing')
  await page.getByRole('button', { name: 'Mute sound' }).click()
  await expect(controls).toHaveAttribute('data-audio-status', 'muted')
})

test('circle grips disappear while the jumping sprite raises its hands', async ({ page }, info) => {
  await skipToPortfolio(page)
  const peek = page.locator('[data-menu-guide="about"]')
  await expect(peek).toHaveClass(/is-peeking/)
  const slot = peek.locator('..')
  const frame = (time: number) => slot.evaluate((element, time) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      if ((animation as CSSAnimation).animationName?.startsWith('menu-')) { animation.pause(); animation.currentTime = time }
    }
  }, time)
  await frame(1250)
  await expect(peek.locator('.menu-pose-jump')).toHaveCSS('opacity', '1')
  await expect(slot.locator('.menu-grip')).toHaveCSS('opacity', '0')
  await page.screenshot({ path: info.outputPath('menu-hands-raised.png') })
  await frame(800)
  await expect(peek.locator('.menu-pose-neutral')).toHaveCSS('opacity', '1')
  await expect(slot.locator('.menu-grip')).toHaveCSS('opacity', '1')
})


test('project headings fit one line and every case-study action is white', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const note = 'AI foundations are an area of exploration. The existing AI agent in the Magna ecosystem is not presented as an agent I built.'
  for (const year of ['2018', '2024', '2025', '2026']) {
    await page.getByRole('tab', { name: year, exact: true }).click()
    for (const button of await page.locator('.case-study-trigger').all()) {
      await expect(button).toHaveCSS('background-color', 'rgb(241, 241, 239)')
      await expect(button).toHaveCSS('color', 'rgb(16, 17, 18)')
    }
  }
  await expect(page.getByText(note, { exact: true })).toHaveCount(0)
  await expect(page.locator('.project-window .window-bar')).toContainText(['magna.project', 'ecommerce.project', 'contract transparency project'])
  await expect(page.getByText('contract.project', { exact: false })).toHaveCount(0)
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    // Container-relative type settles during layout, after the viewport change.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const titles = await page.locator('.project-body h3').evaluateAll(elements => elements.map(element => {
      const text = document.createRange(); text.selectNodeContents(element)
      return { title: element.textContent, lines: text.getClientRects().length, textWidth: text.getBoundingClientRect().width, available: element.clientWidth }
    }))
    for (const title of titles) { expect(title.lines, title.title!).toBe(1); expect(title.textWidth, title.title!).toBeLessThanOrEqual(title.available) }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  }
  await page.locator('.project-window').last().scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('project-titles-mobile.png') })
})

test('coffee steam rises in a loop and pauses when About Me leaves view', async ({ page }, info) => {
  await skipToPortfolio(page)
  await page.getByRole('navigation', { name: 'Explore portfolio' }).getByRole('link', { name: 'About Me', exact: true }).click()
  const rest = page.locator('.character-rest-scene'), steam = rest.locator('.steam-one')
  await expect(rest).toHaveAttribute('data-motion-active', 'true')
  await expect(steam).toHaveCSS('animation-iteration-count', 'infinite')
  const before = await steam.evaluate(element => Number(element.getAnimations()[0].currentTime))
  await page.waitForTimeout(450)
  const after = await steam.evaluate(element => Number(element.getAnimations()[0].currentTime))
  expect(after - before).toBeGreaterThan(250)
  await page.screenshot({ path: info.outputPath('coffee-steam.png') })
  await page.locator('#contact-title').scrollIntoViewIfNeeded()
  await expect(steam).toHaveCSS('animation-play-state', 'paused')
})


test('the timeline starts on entry, advances every three seconds and pauses for review', async ({ page }) => {
  await skipToPortfolio(page)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page.getByRole('tab', { name: '2018', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('button', { name: 'Pause timeline' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Read case study: Mortgage Application Modernization' }).click()
  await page.waitForTimeout(3300)
  await expect(page.getByRole('tabpanel')).toHaveAttribute('data-year', '2018')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.locator('.year-scroll').scrollIntoViewIfNeeded()
  await expect(page.getByRole('tab', { name: '2019', exact: true })).toHaveAttribute('aria-selected', 'true', { timeout: 5000 })
  await page.locator('#about-title').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  const pausedYear = await page.getByRole('tabpanel').getAttribute('data-year')
  await page.waitForTimeout(3300)
  await expect(page.getByRole('tabpanel')).toHaveAttribute('data-year', pausedYear!)
  await menu.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await menu.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toHaveAttribute('data-year', '2018')
  await page.getByRole('tab', { name: '2024', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Play timeline' })).toHaveAttribute('aria-pressed', 'false')
})

test('a blocked music start has a short unmute hint that disappears after use', async ({ page }) => {
  await page.goto('/')
  const hint = page.getByRole('button', { name: 'Unmute to play music', exact: true })
  await expect(hint).toBeVisible()
  await hint.click()
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', 'playing')
  await expect(hint).toHaveCount(0)
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click()
  await expect(hint).toHaveCount(0)
})

test('Beyond Work includes the approved photography story and Instagram after Jada.bit', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Explore portfolio' }).getByRole('link', { name: 'Beyond Work', exact: true }).click()
  const photo = page.locator('.photography-section')
  await expect(photo.getByRole('heading', { name: 'Photography', exact: true })).toBeVisible()
  await expect(photo).toContainText('Growing up, I was often the kid with a camera in hand')
  await expect(photo).toContainText('features in local Dallas magazines')
  await expect(photo.getByRole('link', { name: /@ssr.pix/ })).toHaveAttribute('href', 'https://www.instagram.com/ssr.pix/')
  expect(await page.locator('.personal-project-jada-bit').evaluate(element => !!(element.compareDocumentPosition(document.querySelector('.photography-section')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await photo.scrollIntoViewIfNeeded()
    const image = photo.getByRole('img', { name: 'Black-and-white portrait of a photographer holding a camera', exact: true })
    await expect(image).toHaveAttribute('src', '/portfolioPicture.jpeg')
    await expect(image).toHaveAttribute('loading', 'lazy')
    await expect(image).toHaveAttribute('decoding', 'async')
    await expect(image).toHaveCSS('object-fit', 'cover')
    await expect.poll(() => image.evaluate(element => {
      const image = element as HTMLImageElement
      return image.complete && image.naturalWidth === 1600 && image.naturalHeight === 1587
    })).toBe(true)
    await image.evaluate(element => (element as HTMLImageElement).decode())
    await expect(page.locator('.photography-photo')).toHaveCSS('border-radius', '50%')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.screenshot({ path: info.outputPath(`photography-${width}.png`) })
  }
})

test('loading waits for painted scenery before a half-second TV tune-in', async ({ page }, info) => {
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/src/scenes/MountainWorld.tsx*', async route => { await held; await route.continue() })
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    await page.waitForTimeout(600)
    await expect(page.locator('.app')).toHaveAttribute('data-phase', 'loading')
    await expect(page.getByTestId('loading-screen')).toBeVisible()
    release()
    const reveal = page.getByTestId('tv-scene-reveal')
    await expect(reveal).toBeVisible()
    await expect(page.locator('.pixi-world')).toHaveAttribute('data-render-ready', 'true')
    await expect(reveal).toHaveCSS('animation-duration', '0.5s')
    await expect(reveal).toHaveCSS('pointer-events', 'none')
    await expect(reveal).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await page.screenshot({ path: info.outputPath('first-frame-tv-tune-in.png') })
    await expect(reveal).toHaveCount(0)
    await expect(page.locator('.app')).toHaveAttribute('data-phase', 'playing')
    await expect(page.locator('.pixi-world canvas')).toBeVisible()
  } finally { release() }
})

test('Builds in progress uses its readable development status without a terminal symbol', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const builds = page.locator('#github-projects')
  await expect(builds.getByRole('heading', { name: 'Builds in progress.' })).toBeVisible()
  await expect(builds.locator('.build-status')).toHaveText('IN DEVELOPMENT')
  await expect(builds).not.toContainText('>_')
})


test('Ritual opens its supplied website and Jada.bit starts with the electronics background', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const ritual = page.locator('.personal-project-ritual')
  await expect(ritual.getByRole('link', { name: 'Visit Ritual' })).toHaveAttribute('href', 'https://ssr-personal-cookbook.vercel.app/')
  await expect(ritual.getByRole('link', { name: 'Visit Ritual' })).toHaveAttribute('target', '_blank')
  const jada = page.locator('.personal-project-jada-bit')
  await expect(jada.locator('.personal-introduction')).toContainText('bachelor’s in Electronics and Communication Engineering')
  await expect(jada.locator('.personal-introduction')).toContainText('embedded systems, microcontrollers and hardware–software integration')
  await expect(jada).toContainText('Designed and built a programmable digital hair accessory')
  expect(await jada.locator('.personal-introduction').evaluate(element => element.nextElementSibling!.textContent!.startsWith('Designed and built'))).toBe(true)
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0)
})
