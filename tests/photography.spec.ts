import { test, expect, type Page } from '@playwright/test'

type FlashElement = HTMLElement & { testFlashEvents: string[] }

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let starts = 0
    Object.defineProperty(window, 'testShutterStarts', { get: () => starts })
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && Math.abs(this.buffer.duration - .18) < .001) starts++
      return Reflect.apply(start, this, args)
    }
  })
})

async function openPortfolio(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.app')).toBeVisible()
  const skip = page.getByRole('button', { name: 'Skip intro', exact: true })
  if (await skip.isVisible()) await skip.click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
  const pause = page.getByRole('button', { name: 'Pause the movie', exact: true })
  if (await pause.isVisible()) await pause.click()
  const unmute = page.getByRole('button', { name: 'Unmute sound', exact: true })
  if (await unmute.isVisible()) await unmute.click()
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', 'playing')
  await page.locator('#contact').scrollIntoViewIfNeeded()
}

async function watchFlash(page: Page) {
  await page.locator('.photography-photo').evaluate(element => {
    const photo = element as FlashElement
    photo.testFlashEvents = []
    new MutationObserver(() => photo.testFlashEvents.push(photo.getAttribute('data-flash-active') ?? '')).observe(photo, { attributes: true, attributeFilter: ['data-flash-active'] })
  })
}
const flashes = (page: Page) => page.locator('.photography-photo').evaluate(element => (element as FlashElement).testFlashEvents.filter(value => value === 'true').length)
const shutters = (page: Page) => page.evaluate(() => Number(Reflect.get(window, 'testShutterStarts')))

test('mobile photo arrival settles before flashing and re-entry cannot retrigger the shutter rapidly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 })
  await openPortfolio(page)
  await watchFlash(page)
  const photo = page.locator('.photography-photo')
  await photo.evaluate(element => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 200, behavior: 'instant' }))
  await page.waitForTimeout(200)
  expect(await flashes(page)).toBe(0)
  await expect.poll(() => flashes(page)).toBe(1)
  const before = await shutters(page)
  for (let step = 0; step < 3; step++) {
    await page.locator('#contact').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
    await page.waitForTimeout(80)
    await photo.evaluate(element => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 200, behavior: 'instant' }))
    await page.waitForTimeout(80)
  }
  expect(await flashes(page)).toBe(1)
  expect(await shutters(page)).toBe(before)
  await expect.poll(() => flashes(page), { timeout: 4000 }).toBe(2)
})

test('the diamond lens flash and audible shutter repeat every three seconds, respecting mute and visibility', async ({ page }) => {
  await openPortfolio(page)
  await watchFlash(page)
  const before = await shutters(page)
  const photo = page.locator('.photography-photo')
  await photo.scrollIntoViewIfNeeded()
  await expect.poll(() => flashes(page)).toBe(1)
  await expect.poll(() => shutters(page)).toBe(before + 1)
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-last-cue', 'shutter')
  await expect(photo).toHaveAttribute('data-flash-active', 'false')
  await page.waitForTimeout(1400)
  expect(await flashes(page)).toBe(1)
  await expect.poll(() => flashes(page), { timeout: 4000 }).toBe(2)
  await expect.poll(() => shutters(page)).toBe(before + 2)
  const diamond = await photo.locator('.photography-flash').evaluate(element => getComputedStyle(element, '::before').clipPath)
  expect(diamond).toBe('polygon(50% 0px, 100% 50%, 50% 100%, 0px 50%)')
  await expect(photo).toHaveCSS('overflow', 'hidden')
  await expect(photo).toHaveCSS('border-radius', '50%')
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click()
  await expect.poll(() => flashes(page), { timeout: 4000 }).toBe(3)
  expect(await shutters(page)).toBe(before + 2)
  // Enabling audio while the photo stays visible makes the next pulse audible.
  await page.getByRole('button', { name: 'Unmute sound', exact: true }).click()
  await expect.poll(() => flashes(page), { timeout: 4000 }).toBe(4)
  await expect.poll(() => shutters(page)).toBe(before + 3)
  await page.locator('#contact').scrollIntoViewIfNeeded()
  await page.waitForTimeout(3300)
  expect(await flashes(page)).toBe(4)
  expect(await shutters(page)).toBe(before + 3)
  const wav = await page.request.get('/audio/camera-shutter.wav')
  expect(wav.status()).toBe(200)
  expect((await wav.body()).subarray(0, 4).toString()).toBe('RIFF')
})

test('reduced motion keeps the photography image still without a shutter cue', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPortfolio(page)
  await watchFlash(page)
  const before = await shutters(page)
  const photo = page.locator('.photography-photo')
  await photo.scrollIntoViewIfNeeded()
  await expect(photo.locator('img')).toBeVisible()
  await expect(photo.locator('.photography-flash')).toHaveCSS('display', 'none')
  await page.waitForTimeout(500)
  expect(await flashes(page)).toBe(0)
  expect(await shutters(page)).toBe(before)
})

test('an unavailable photo retains its fallback without a flash or click', async ({ page }) => {
  await page.route('**/portfolioPicture.jpeg', route => route.fulfill({ status: 404, body: 'unavailable' }))
  await openPortfolio(page)
  await watchFlash(page)
  const before = await shutters(page)
  const photo = page.locator('.photography-photo')
  await photo.scrollIntoViewIfNeeded()
  await expect(photo.getByRole('img', { name: 'Photography image unavailable' })).toBeVisible()
  await page.waitForTimeout(500)
  expect(await flashes(page)).toBe(0)
  expect(await shutters(page)).toBe(before)
})
