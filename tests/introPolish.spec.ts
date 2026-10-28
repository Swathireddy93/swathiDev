import { test, expect } from '@playwright/test'

for (const width of [390, 1440]) test(`the close-up double blink has matching sound and survives a visibility pause at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.addInitScript(() => {
    const events: string[] = []
    Reflect.set(window, 'testCloseupBlinks', events)
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && Math.abs(this.buffer.duration - .095) < .001) {
        events.push(document.querySelector('.app')?.getAttribute('data-scene') ?? '')
        const count = events.length
        requestAnimationFrame(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: true })
          document.dispatchEvent(new Event('visibilitychange'))
          Reflect.set(window, 'testBlinkPaused', count)
        })
      }
      return Reflect.apply(start, this, args)
    }
  })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', /playing|muted/)
  const unmute = page.getByRole('button', { name: 'Unmute sound', exact: true })
  if (await unmute.isVisible()) await unmute.click()
  for (const count of [1, 2]) {
    await expect.poll(() => page.evaluate(() => Reflect.get(window, 'testBlinkPaused')), { timeout: 35_000 }).toBe(count)
    await expect(page.locator('.app')).toHaveAttribute('data-scene', 'approaching')
    await expect(page.locator('.sound-controls')).toHaveAttribute('data-last-cue', 'blink')
    await page.screenshot({ path: info.outputPath(`closeup-blink-${count}-${width}.png`) })
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false })
      document.dispatchEvent(new Event('visibilitychange'))
    })
  }
  await expect(page.getByTestId('city-flight')).toBeVisible()
  expect(await page.evaluate(() => Reflect.get(window, 'testCloseupBlinks'))).toEqual(['approaching', 'approaching'])
  expect(errors).toEqual([])
})

for (const width of [320, 390, 1440]) test(`menu labels are centered without numbers at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 320 ? 740 : 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.scrollIntoViewIfNeeded()
  await expect(menu.locator('.orbital-index')).toHaveCount(0)
  const labels = ['About Me', 'Experience', 'Projects', 'Beyond Work', 'Contact']
  for (const label of labels) {
    const link = menu.getByRole('link', { name: label, exact: true })
    await expect(link).toBeVisible()
    await expect(link).toHaveText(label)
    const bounds = await link.evaluate(element => {
      const circle = element.getBoundingClientRect()
      const text = element.querySelector('.orbital-label')!.getBoundingClientRect()
      const world = element.querySelector('.orbital-world')!.getBoundingClientRect()
      return { x: (text.left + text.right - circle.left - circle.right) / 2,
        y: (world.top + text.bottom - circle.top - circle.bottom) / 2,
        fits: text.left >= circle.left && text.right <= circle.right && text.bottom <= circle.bottom }
    })
    expect(Math.abs(bounds.x)).toBeLessThan(1)
    expect(Math.abs(bounds.y)).toBeLessThan(1)
    expect(bounds.fits).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath(`centered-menu-${width}.png`) })
  await menu.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page.getByRole('tab', { name: '2018', exact: true })).toBeVisible()
})
