import { test, expect, type Page } from '@playwright/test'

test.use({ isMobile: true, hasTouch: true })

async function expectVisibleControls(page: Page) {
  const geometry = await page.locator('.movie-toggle, .sound-toggle').evaluateAll(elements => {
    const v = window.visualViewport!
    return elements.map(element => {
      const r = element.getBoundingClientRect()
      return { left: r.left - v.offsetLeft, right: v.offsetLeft + v.width - r.right,
        top: r.top - v.offsetTop, bottom: v.offsetTop + v.height - r.bottom, width: r.width, height: r.height }
    })
  })
  expect(geometry).toHaveLength(2)
  for (const rect of geometry) {
    expect(Math.min(rect.left, rect.right, rect.top)).toBeGreaterThanOrEqual(0)
    expect(rect.bottom).toBeGreaterThanOrEqual(33)
    expect(rect.width).toBe(44); expect(rect.height).toBe(44)
  }
}

async function tapVisibleControl(page: Page, selector: string) {
  // Tap the visible CSS coordinates directly. Locator.tap's scroll-into-view step
  // can pan the emulated pinch viewport before its hit check, moving fixed UI.
  const point = await page.locator(selector).evaluate(element => {
    const r = element.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2
    return { x: x - (visualViewport?.offsetLeft ?? 0), y: y - (visualViewport?.offsetTop ?? 0),
      hit: element.contains(document.elementFromPoint(x, y)) }
  })
  expect(point.hit).toBe(true)
  await page.touchscreen.tap(point.x, point.y)
}

for (const width of [320, 390]) test(`mobile controls stay visible and tappable through zoom, safe areas and footer scrolling at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 320 ? 740 : 844 })
  await page.goto('/')
  await expect(page.locator('.sound-toggle')).toBeVisible()
  await expect(page.locator('.movie-toggle')).toHaveCount(0)
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click()
  await page.getByRole('button', { name: 'Pause the movie', exact: true }).click()
  await page.locator('main').dispatchEvent('touchstart')
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left: 0, right: 12, bottom: 34 } })
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1.3 })
  for (const section of ['.site-footer', '#contact', '#experiments', '.site-footer']) {
    await page.locator(section).evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'end' }))
    await page.waitForTimeout(100)
    await expectVisibleControls(page)
  }
  const overlaps = await page.locator('.site-footer').evaluate(footer => {
    const controls = [...document.querySelectorAll('.movie-toggle, .sound-toggle')].map(el => el.getBoundingClientRect())
    return [...footer.children].some(child => {
      const r = child.getBoundingClientRect()
      return controls.some(c => r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top)
    })
  })
  expect(overlaps).toBe(false)
  await page.screenshot({ path: info.outputPath(`viewport-controls-${width}.png`) })
  const before = await page.locator('.sound-toggle').getAttribute('aria-label')
  await tapVisibleControl(page, '.sound-toggle')
  await expect(page.locator('.sound-toggle')).not.toHaveAttribute('aria-label', before!)
  await tapVisibleControl(page, '.movie-toggle')
  await expect(page.locator('.movie-controls')).toHaveAttribute('data-story-status', /waiting|playing/)
  await tapVisibleControl(page, '.movie-toggle')
  await expect(page.locator('.movie-controls')).toHaveAttribute('data-story-status', 'paused')
})

test('reduced motion keeps the intended audio-only controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.movie-toggle')).toHaveCount(0)
  await expect(page.locator('.sound-toggle')).toBeVisible()
})
