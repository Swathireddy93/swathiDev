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
