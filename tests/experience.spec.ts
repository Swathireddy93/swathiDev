import { test, expect } from '@playwright/test'

test('loading reflects a real outstanding asset, and skip works before readiness', async ({ page }) => {
  let release!: () => void
  const held = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/assets/temporary/bay.png', async (route) => { await held; await route.continue() })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('loading-screen')).toBeVisible()
  const progress = page.getByRole('progressbar')
  await expect(progress).toBeVisible()
  expect(Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(100)
  await expect(page.getByRole('button', { name: 'Continue Muted' })).not.toBeVisible()
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
  release()
  await page.reload()
  await expect(page.getByTestId('portfolio')).toBeVisible()
  await expect(page.getByTestId('intro')).not.toBeVisible()
})

test('muted cinematic sequence renders peeking and jump frames, then disposes the canvas', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Continue Muted' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'peeking')
  await expect(page.locator('canvas')).toHaveCount(1)
  // Sample the end of the peek tween and the airborne pose for visual inspection.
  await page.waitForTimeout(1100)
  const peek = await page.screenshot({ path: info.outputPath('peeking.png') })
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'jumping')
  await page.waitForTimeout(260)
  const jump = await page.screenshot({ path: info.outputPath('jumping.png') })
  expect(Buffer.compare(peek, jump)).not.toBe(0)
  await expect(page.getByTestId('portfolio')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', 'idle')
  expect(errors).toEqual([])
})

test('audio starts only from the sound gesture; skip stops it and replay creates a clean scene', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Start with Sound' })).toBeVisible()
  const before = await page.evaluate(() => performance.getEntriesByType('resource').filter((entry) => new URL(entry.name).pathname.startsWith('/audio/')).length)
  expect(before).toBe(0)
  await page.getByRole('button', { name: 'Start with Sound' }).click()
  // This state comes from Howler's actual play event, not the click handler.
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', 'playing')
  await page.getByRole('slider', { name: 'Sound volume' }).fill('0.2')
  await expect(page.getByRole('slider', { name: 'Sound volume' })).toHaveValue('0.2')
  await page.getByRole('button', { name: 'Mute sound' }).click()
  await expect(page.getByRole('button', { name: 'Turn sound on' })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Turn sound on' }).click()
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', 'playing')
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', 'idle')
  await page.getByRole('button', { name: 'Replay the introduction' }).click()
  await page.getByRole('button', { name: 'Continue Muted' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'peeking')
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('reduced motion shows semantic content immediately and case studies work with keyboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Good systems. A little perspective.' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.getByTestId('loading-screen')).not.toBeVisible()
  const read = page.getByRole('button', { name: 'Read case study: Magna Billing Operations Platform' })
  await read.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Magna Billing Operations Platform' })).toBeVisible()
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(read).toBeFocused()
})

test('mobile framing, menu and project dialogs fit a narrow viewport', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Continue Muted' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'peeking')
  await page.waitForTimeout(1100)
  await page.screenshot({ path: info.outputPath('mobile-peeking.png') })
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await page.getByRole('button', { name: 'Menu +' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'Projects' }).click()
  await expect(page.getByRole('button', { name: 'Menu +' })).toHaveAttribute('aria-expanded', 'false')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Read case study: Mortgage Application Modernization' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect((await page.getByRole('dialog').boundingBox())!.width).toBeLessThanOrEqual(390)
  await expect(page.getByRole('dialog')).toContainText('90% unit-test coverage achieved on a mortgage workflow')
  await page.getByRole('button', { name: 'Close case study' }).click()
  await page.screenshot({ path: info.outputPath('mobile-portfolio.png'), fullPage: true })
})

test('a missing character asset degrades the scene without blocking access to content', async ({ page }) => {
  await page.route('**/character-neutral.png', (route) => route.fulfill({ status: 404, body: 'not found' }))
  await page.goto('/')
  await expect(page.getByText('Some scenery is unavailable.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Continue Muted' }).click()
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
})

test('a browser without WebGL gets a static scenic portfolio', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.goto('/')
  await expect(page.getByTestId('portfolio')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.getByText('A quieter, static view.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Read case study: Ecommerce Gateway Platform' })).toBeVisible()
})

test('an audio failure is reported and never blocks the muted portfolio path', async ({ page }) => {
  await page.route('**/audio/temporary-mountain-ambient.wav', (route) => route.fulfill({ status: 404, body: 'not found' }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Start with Sound' }).click()
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', 'error')
  await expect(page.getByText('Sound couldn’t start.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
})

test('résumé and contact destinations are real and all three case studies are readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'swathisreddy.work@gmail.com' })).toHaveAttribute('href', 'mailto:swathisreddy.work@gmail.com')
  await expect(page.locator('#contact a').filter({ hasText: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/swathishivashankar1993')
  const resume = await page.request.get('/swathi-reddy-resume.pdf')
  expect(resume.status()).toBe(200)
  expect((await resume.body()).subarray(0, 4).toString()).toBe('%PDF')
  for (const title of ['Magna Billing Operations Platform', 'Ecommerce Gateway Platform', 'Mortgage Application Modernization']) {
    await page.getByRole('button', { name: `Read case study: ${title}` }).click()
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Documented outcomes' })).toBeVisible()
    await page.getByRole('button', { name: 'Close case study' }).click()
  }
})
