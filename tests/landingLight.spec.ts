import { test, expect } from '@playwright/test'

for (const width of [390, 1440]) test(`the rooftop light catches the lens and reveals a usable menu at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.locator('.app').evaluate(app => {
    const lens = document.querySelector('.landing-lens-flare')!
    new MutationObserver(() => {
      if (app.getAttribute('data-phase') === 'portfolio') {
        Reflect.set(window, 'landingLightHandoff', { opacity: Number(getComputedStyle(lens).opacity),
          sameElement: lens === document.querySelector('.landing-lens-flare') })
      }
    }).observe(app, { attributes: true, attributeFilter: ['data-phase'] })
  })
  await expect(page.getByTestId('city-flight')).toBeVisible({ timeout: 35_000 })
  const lens = page.locator('.landing-lens-flare')
  await expect.poll(() => lens.evaluate(el => Number(getComputedStyle(el).opacity)), { timeout: 15_000, intervals: [50] }).toBeGreaterThan(.15)
  await page.screenshot({ path: info.outputPath(`lens-catch-${width}.png`) })
  await expect(page.getByTestId('portfolio')).toBeVisible()
  const handoff = await page.evaluate(() => Reflect.get(window, 'landingLightHandoff') as { opacity: number; sameElement: boolean })
  expect(handoff.sameElement).toBe(true)
  expect(handoff.opacity).toBeGreaterThan(.5)
  await expect(lens).toHaveCSS('pointer-events', 'none')
  await expect(lens).toHaveCSS('visibility', 'hidden')
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await expect(menu).toBeInViewport({ ratio: .7 })
  await expect(menu.getByRole('link')).toHaveCount(5)
  await page.screenshot({ path: info.outputPath(`menu-revealed-${width}.png`) })
  await menu.getByRole('link', { name: 'About Me', exact: true }).click()
  await expect(page.locator('.movie-controls')).toHaveAttribute('data-story-status', 'paused')
  expect(errors).toEqual([])
})

test('skipping and reduced motion never trigger the arrival glow', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
  await expect(page.locator('.landing-lens-flare')).toHaveCSS('visibility', 'hidden')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await expect(page.getByTestId('portfolio')).toBeVisible()
  await expect(page.locator('.landing-lens-flare')).toHaveCSS('display', 'none')
  await expect(page.getByTestId('city-flight')).toHaveCount(0)
})
