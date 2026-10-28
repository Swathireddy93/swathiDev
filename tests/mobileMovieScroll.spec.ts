import { test, expect, type Page } from '@playwright/test'

test.use({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } })
const controls = '.movie-controls'

async function openMovie(page: Page) {
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click()
  await page.evaluate(() => document.fonts.ready)
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 1000)
  await page.locator('.hero-introduction').evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)))
  await expect(page.locator('#portfolio-menu')).toBeInViewport({ ratio: .7 })
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
}

async function reach(page: Page, checkpoint: string) {
  for (let step = 0; step < 60; step++) {
    if (await page.locator(controls).getAttribute('data-story-beat') === checkpoint) return
    await page.clock.runFor(64)
    await page.clock.fastForward(600_000)
    await page.clock.runFor(64)
  }
  throw new Error(`Movie did not reach ${checkpoint}`)
}

for (const width of [320, 390]) test(`mobile travel takes its time, settles by a few pixels and lands below the header at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 320 ? 740 : 844 })
  await openMovie(page)
  await reach(page, 'about:enter')
  await page.clock.runFor(64)
  const start = await page.evaluate(() => scrollY)
  const target = await page.locator('#about').evaluate(el => scrollY + el.getBoundingClientRect().top +
    parseFloat(getComputedStyle(el).paddingTop) - document.querySelector('.site-header')!.getBoundingClientRect().bottom - 32)
  const frames: number[] = [start]
  for (let frame = 0; frame < 28; frame++) {
    await page.clock.runFor(100)
    frames.push(await page.evaluate(() => scrollY))
    if (frame === 13) await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'about:enter')
  }
  expect(frames[10]).toBeGreaterThan(start + 20)
  expect(frames[10]).toBeLessThan(target)
  expect(Math.max(...frames) - target).toBeGreaterThan(1)
  expect(Math.max(...frames) - target).toBeLessThanOrEqual(7)
  expect(Math.abs(frames.at(-1)! - target)).toBeLessThanOrEqual(1)
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'about:read')
  await expect(page.locator('#about .section-character-guide')).toBeInViewport({ ratio: 1 })
  await expect(page.locator('#experience')).toHaveCSS('visibility', 'hidden')
  await page.screenshot({ path: info.outputPath(`mobile-soft-landing-${width}.png`) })
})

test('a long mobile return resumes from its paused frame and tolerates toolbar resizing', async ({ page }, info) => {
  await openMovie(page)
  await reach(page, 'experiments:menu')
  await page.clock.runFor(64)
  const start = await page.evaluate(() => scrollY)
  await page.clock.runFor(1500)
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'experiments:menu')
  const paused = await page.evaluate(() => scrollY)
  expect(paused).toBeLessThan(start - 100)
  await page.getByRole('button', { name: 'Pause the movie', exact: true }).click()
  await page.clock.fastForward(60_000)
  expect(await page.evaluate(() => scrollY)).toBe(paused)
  await page.getByRole('button', { name: 'Play the movie', exact: true }).click()
  await page.clock.runFor(32)
  expect(Math.abs(await page.evaluate(() => scrollY) - paused)).toBeLessThan(100)
  for (const height of [860, 844, 872, 844]) {
    await page.setViewportSize({ width: 390, height })
    await page.clock.runFor(80)
  }
  const moving = await page.evaluate(() => scrollY)
  for (let frame = 0; frame < 15; frame++) {
    await page.evaluate(() => window.visualViewport?.dispatchEvent(new Event('resize')))
    await page.clock.runFor(40)
  }
  expect(await page.evaluate(() => scrollY)).toBeLessThan(moving - 20)
  await page.clock.runFor(6500)
  await expect(page.locator(controls)).not.toHaveAttribute('data-story-beat', 'experiments:menu')
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'playing')
  await page.screenshot({ path: info.outputPath('mobile-resumed-travel.png') })
})
