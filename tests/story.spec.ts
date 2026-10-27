import { test, expect, type Page } from '@playwright/test'

const controls = '.movie-controls'

async function openStory(page: Page) {
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const now = await page.evaluate(() => Date.now())
  await page.clock.pauseAt(now + 1000)
  // Observe the real landing camera rather than forcing a different scroll position.
  await page.locator('.hero-introduction').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)))
  await expect(page.locator('#portfolio-menu')).toBeInViewport({ ratio: .7 })
  let previousY = Number.NaN, settled = 0
  await expect.poll(async () => {
    const y = await page.evaluate(() => scrollY)
    settled = Math.abs(y - previousY) < .5 ? settled + 1 : 0
    previousY = y
    return settled
  }, { intervals: [100], timeout: 5000 }).toBeGreaterThanOrEqual(3)
  await page.clock.runFor(200)
}

async function advanceBeat(page: Page) {
  // Skip reading time without changing the real production pace or introducing test flags.
  await page.clock.runFor(64)
  await page.clock.fastForward(600_000)
  await page.clock.runFor(64)
}

async function expectClearOfHeader(page: Page, selector: string) {
  const spacing = await page.locator(selector).evaluate(element => {
    const header = document.querySelector('.site-header')!.getBoundingClientRect()
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--story-top-gap'))
    return { top: element.getBoundingClientRect().top, headerBottom: header.bottom, gap }
  })
  expect(spacing.top - spacing.headerBottom).toBeGreaterThanOrEqual(spacing.gap - 1)
}

test('mobile Projects holds the dab introduction before moving to the timeline, with glass controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openStory(page)
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
  for (let step = 0; step < 30; step++) {
    if (await page.locator(controls).getAttribute('data-story-beat') === 'projects:introduction') break
    await advanceBeat(page)
  }
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'projects:introduction')
  await page.clock.runFor(100)
  const before = await page.evaluate(() => scrollY)
  await page.clock.runFor(2400)
  expect(await page.evaluate(() => scrollY)).toBe(before)
  expect(Number(await page.locator('[data-guide-section="projects"] .posing-character').getAttribute('data-pose-count'))).toBeGreaterThan(0)
  for (const selector of ['.sound-toggle', '.movie-toggle']) {
    await expect(page.locator(selector)).toHaveCSS('border-radius', '50%')
    await expect(page.locator(selector)).toHaveCSS('backdrop-filter', 'blur(12px)')
  }
  await page.clock.runFor(3000)
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(before + 10)
})

test('the Contact message and Back to menu link stay inside the padded banner', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const banner = page.locator('[data-guide-section="contact"]')
  for (const width of [320, 390, 700, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await banner.scrollIntoViewIfNeeded()
    const box = (await banner.boundingBox())!
    const padding = width <= 700 ? 20 : 24
    for (const child of [banner.locator('p'), banner.getByRole('link', { name: 'Back to menu' })]) {
      const bounds = (await child.boundingBox())!
      expect(bounds.y - box.y).toBeGreaterThanOrEqual(padding)
      expect(box.y + box.height - bounds.y - bounds.height).toBeGreaterThanOrEqual(padding)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    if (width === 390 || width === 1440) await page.screenshot({ path: info.outputPath(`contact-banner-${width}.png`) })
  }
})

for (const [width, height] of [[1440, 900], [390, 844], [320, 740]]) test(`timeline years change in place without vertical scrolling at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height })
  await openStory(page)
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
  for (let step = 0; step < 20; step++) {
    if (await page.locator(controls).getAttribute('data-story-beat') === 'projects:introduction') break
    await advanceBeat(page)
  }
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'projects:introduction')
  await expect(page.locator('#projects-title')).toBeInViewport()
  await advanceBeat(page)
  await page.clock.runFor(1800)
  const cameraY = await page.evaluate(() => scrollY)
  for (let year = 2018; year <= 2026; year++) {
    await expect(page.locator(controls)).toHaveAttribute('data-story-beat', `projects:${year}:year`)
    await expect(page.locator('#career-panel')).toHaveAttribute('data-year', String(year))
    await expect(page.getByRole('tab', { name: String(year), exact: true })).toBeInViewport({ ratio: 1 })
    await expect(page.locator('#career-panel')).toHaveCSS('transform', 'none')
    expect(Math.abs(await page.evaluate(() => scrollY) - cameraY)).toBeLessThanOrEqual(1)
    await page.clock.runFor(1000)
    expect(Math.abs(await page.evaluate(() => scrollY) - cameraY)).toBeLessThanOrEqual(1)
    if (year === 2024) await page.screenshot({ path: info.outputPath(`timeline-in-place-${width}.png`) })
    await advanceBeat(page)
  }
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'experiments:menu')
})

test('phone and desktop landings keep the name and menu clear of the header at every destination', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const [width, height] of [[320, 740], [360, 740], [390, 844], [430, 932], [1280, 720], [1440, 900]]) {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await expectClearOfHeader(page, '#hero-title')
    await expect(page.locator('.hero-role')).toBeInViewport({ ratio: 1 })
    const menu = page.locator('#portfolio-menu')
    for (const item of await menu.getByRole('link').all()) await expect(item).toBeInViewport({ ratio: 1 })
    await page.screenshot({ path: info.outputPath(`landing-padding-${width}.png`) })
    for (const [label, id] of [['About Me', 'about'], ['Experience', 'experience'], ['Projects', 'projects'], ['Beyond Work', 'experiments'], ['Contact', 'contact']]) {
      await menu.getByRole('link', { name: label, exact: true }).click()
      await expect(page.locator(`#${id} .section-character-guide`)).toBeInViewport()
      await expectClearOfHeader(page, `#${id} .section-character-guide`)
      await page.locator(`#${id} .guide-back`).click()
      await expectClearOfHeader(page, '#hero-title')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  }
})

test('Experience and Projects have distinct manual destinations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const menu = page.getByRole('navigation', { name: 'Explore portfolio' })
  await menu.getByRole('link', { name: 'Experience', exact: true }).click()
  await expect(page.locator('#experience-title')).toBeInViewport()
  await expect(page.locator('#experience')).toContainText('Client: Verizon')
  await expect(page.locator('#experience #career-panel')).toHaveCount(0)
  await page.locator('#experience .guide-back').click()
  await menu.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page.locator('#projects-title')).toBeInViewport()
  await expect(page.locator('#projects #career-panel')).toHaveCount(1)
  await expect(page.locator(controls)).toHaveCount(0)
})

test('an existing section link takes priority over automatic playback', async ({ page }) => {
  await page.goto('/#contact')
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click()
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'paused')
  await expect(page.locator('#contact-title')).toBeInViewport()
  await page.clock.install()
  await page.clock.fastForward(30_000)
  await expect(page.locator('#contact-title')).toBeInViewport()
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'paused')
})

for (const width of [1440, 390]) test(`the movie plays every chapter then waves goodbye and loops through loading at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await openStory(page)
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'waiting')
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'playing')
  const peeks: string[] = [], years = new Set<string>()
  for (let step = 0; step < 90; step++) {
    if (await page.getByTestId('movie-ending').count()) break
    const beat = await page.locator(controls).getAttribute('data-story-beat') ?? ''
    if (beat.endsWith(':peek')) {
      const chapter = beat.split(':')[0]
      peeks.push(chapter)
      await expect(page.locator(`[data-menu-guide="${chapter}"]`)).toHaveClass(/is-peeking/)
      await expect(page.locator('#portfolio-menu')).toBeInViewport({ ratio: .7 })
      await expectClearOfHeader(page, '#hero-title')
    }
    if (beat.endsWith(':read') && !beat.startsWith('projects:')) await expectClearOfHeader(page, `#${beat.split(':')[0]} .section-character-guide`)
    if (/projects:\d+:year/.test(beat)) {
      years.add((await page.locator('#career-panel').getAttribute('data-year'))!)
      await expect(page.getByRole('button', { name: 'Pause timeline', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('.chapter-story')).toContainText(/Citigroup|Verizon/)
    }
    await expect(page.getByRole('dialog')).not.toBeVisible()
    if (beat === 'experiments:read') await page.screenshot({ path: info.outputPath('beyond-work-story.png') })
    if (beat === 'contact:hold') {
      await page.clock.runFor(4400)
      await expect(page.getByTestId('movie-ending')).toHaveCount(0)
      await page.clock.runFor(200)
    } else await advanceBeat(page)
    if (beat === 'projects:2026:year') await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'experiments:menu')
  }
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'movie:ending')
  expect(peeks).toEqual(['about', 'experience', 'projects', 'experiments', 'contact'])
  expect([...years]).toEqual(['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'])
  const ending = page.getByTestId('movie-ending')
  await expect(ending).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  await expect(ending.getByRole('heading', { name: 'THE END' })).toBeVisible()
  await expect(ending.locator('.farewell-wave')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  expect(errors).toEqual([])
  await page.screenshot({ path: info.outputPath(`movie-ending-${width}.png`) })
  await page.getByRole('button', { name: 'Pause the movie', exact: true }).click()
  await expect(ending.locator('.farewell-wave')).toHaveCSS('animation-play-state', 'paused')
  await page.clock.fastForward(10_000)
  await expect(ending).toBeVisible()
  if (width === 390) {
    await page.keyboard.press('Escape')
    await expect(ending).toHaveCount(0)
    await expect(page.locator('.contact-email')).toBeInViewport()
    await page.clock.fastForward(60_000)
    await expect(page.locator('.app')).toHaveAttribute('data-phase', 'portfolio')
    await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'paused')
  } else {
    const muted = await page.locator('.sound-toggle').getAttribute('aria-label')
    await page.getByRole('button', { name: 'Play the movie', exact: true }).click()
    await page.clock.runFor(4400)
    await expect(ending).toBeVisible()
    await page.clock.runFor(700)
    await expect(page.locator('.app')).toHaveAttribute('data-phase', 'loading')
    await expect(page.getByTestId('loading-screen')).toBeVisible()
    await expect(page.locator('.sound-toggle')).toHaveAttribute('aria-label', muted!)
    await expect(ending).toHaveCount(0)
    await page.clock.runFor(5000)
    await expect(page.locator('.app')).toHaveAttribute('data-phase', 'playing')
    await page.getByRole('button', { name: 'Skip intro', exact: true }).click()
    await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'waiting')
  }
})

test('manual wheel, touch, keyboard and menu choices interrupt without a later scroll jump', async ({ page }) => {
  await openStory(page)
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
  await page.mouse.wheel(0, 100)
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'paused')
  await page.clock.runFor(64)
  const paused = await page.evaluate(() => scrollY)
  await page.clock.fastForward(120_000)
  expect(await page.evaluate(() => scrollY)).toBe(paused)
  for (const event of ['touchstart', 'keydown']) {
    await page.getByRole('button', { name: 'Play the movie', exact: true }).click()
    if (event === 'keydown') await page.keyboard.press('Escape')
    else await page.locator('main').dispatchEvent('touchstart')
    await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'paused')
  }
  await page.getByRole('button', { name: 'Play the movie', exact: true }).click()
  await page.locator('#portfolio-menu').getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'paused')
  await expect(page.locator('#contact-title')).toBeInViewport()
  await page.clock.fastForward(120_000)
  await expect(page.locator('#contact-title')).toBeInViewport()
})

test('mobile reading scrolls gradually, resizes safely and leaves sound controls usable', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openStory(page)
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
  for (let step = 0; step < 6; step++) {
    if (await page.locator(controls).getAttribute('data-story-beat') === 'about:read') break
    await advanceBeat(page)
  }
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'about:read')
  await page.clock.runFor(2000)
  const start = await page.evaluate(() => scrollY)
  await page.clock.runFor(5000)
  const end = await page.evaluate(() => scrollY)
  expect(end).toBeGreaterThan(start)
  expect(end - start).toBeLessThan(400)
  await page.locator('.sound-toggle').click()
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'playing')
  await page.setViewportSize({ width: 320, height: 740 })
  await page.clock.runFor(200)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  const movie = (await page.locator('.movie-toggle').boundingBox())!
  const speaker = (await page.locator('.sound-toggle').boundingBox())!
  expect(movie.x + movie.width / 2).toBe(speaker.x + speaker.width / 2)
  expect(speaker.y - (movie.y + movie.height)).toBeGreaterThanOrEqual(12)
  await page.screenshot({ path: info.outputPath('story-mobile-reading.png') })
  await page.getByRole('button', { name: 'Pause the movie', exact: true }).click()
  const stopped = await page.evaluate(() => scrollY)
  await page.clock.fastForward(120_000)
  expect(await page.evaluate(() => scrollY)).toBe(stopped)
})

test('the settled landing holds for three seconds, then one hop leads directly into About Me', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await openStory(page)
  const landingY = await page.evaluate(() => scrollY)
  await expect(page.getByText(/PORTFOLIO IN MOTION|Explore freely|Your story tour starts/)).toHaveCount(0)
  await expect(page.locator('.story-controls')).toHaveCount(0)
  await expect(page.locator('.movie-hint')).toHaveText('Pause the movie')
  await expect(page.locator('.movie-toggle svg')).toHaveAttribute('width', '18')
  await expect(page.locator('.movie-toggle')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await page.clock.runFor(2500)
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'waiting')
  await expect(page.locator('.menu-peek-window.is-peeking')).toHaveCount(0)
  await page.clock.runFor(650)
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'about:peek')
  await expect(page.locator('[data-menu-guide="about"]')).toHaveClass(/is-peeking/)
  expect(await page.evaluate(() => scrollY)).toBe(landingY)
  await advanceBeat(page)
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'about:enter')
  await advanceBeat(page)
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'about:read')
  await expect(page.locator('#about .section-character-guide')).toBeInViewport()
  await expect(page.locator('.movie-hint')).toHaveCount(0)
})

for (const width of [320, 360, 390, 1440]) test(`the vertical movie hint stays outside text and circles at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width <= 360 ? 740 : 900 })
  await openStory(page)
  await expectClearOfHeader(page, '#hero-title')
  const hint = (await page.locator('.movie-hint').boundingBox())!
  const intro = (await page.locator('.hero-introduction').boundingBox())!
  await expect(page.locator('.movie-hint')).toHaveCSS('writing-mode', 'vertical-rl')
  expect(hint.width).toBeLessThanOrEqual(18)
  expect(hint.height).toBeGreaterThan(70)
  expect(hint.x).toBeGreaterThanOrEqual(intro.x + intro.width)
  expect(hint.x + hint.width).toBeLessThanOrEqual(width)
  for (const link of await page.locator('#portfolio-menu').getByRole('link').all()) {
    await expect(link).toBeInViewport({ ratio: 1 })
    const circle = (await link.boundingBox())!
    const intersects = hint.x < circle.x + circle.width && hint.x + hint.width > circle.x && hint.y < circle.y + circle.height && hint.y + hint.height > circle.y
    expect(intersects).toBe(false)
  }
  await page.screenshot({ path: info.outputPath(`vertical-movie-hint-${width}.png`) })
})

test('movie and timeline pause together without a competing timeline timer', async ({ page }) => {
  await openStory(page)
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
  for (let step = 0; step < 20; step++) {
    if (await page.locator(controls).getAttribute('data-story-beat') === 'projects:2018:year') break
    await advanceBeat(page)
  }
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'projects:2018:year')
  await expect(page.getByRole('button', { name: 'Pause timeline', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Pause the movie', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Play timeline', exact: true })).toHaveAttribute('aria-pressed', 'false')
  const year = await page.locator('#career-panel').getAttribute('data-year')
  await page.clock.fastForward(30_000)
  await expect(page.locator('#career-panel')).toHaveAttribute('data-year', year!)
  await page.getByRole('button', { name: 'Play the movie', exact: true }).click()
  await page.clock.runFor(64)
  await advanceBeat(page)
  await expect(page.locator('#career-panel')).toHaveAttribute('data-year', '2019')
  await page.getByRole('button', { name: 'Pause timeline', exact: true }).click()
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'paused')
  await expect(page.getByRole('button', { name: 'Play timeline', exact: true })).toHaveAttribute('aria-pressed', 'false')
})

test('a background tab suspends the reading clock without skipping ahead on return', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openStory(page)
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
  for (let step = 0; step < 6; step++) {
    if (await page.locator(controls).getAttribute('data-story-beat') === 'about:read') break
    await advanceBeat(page)
  }
  await page.clock.runFor(4000)
  const position = await page.evaluate(() => scrollY)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.fastForward(120_000)
  expect(await page.evaluate(() => scrollY)).toBe(position)
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'about:read')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(1000)
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'about:read')
  const resumed = await page.evaluate(() => scrollY)
  expect(resumed).toBeGreaterThan(position)
  expect(resumed - position).toBeLessThan(100)
})

test('changing reduced-motion preferences stops playback and restores an accurate idle state', async ({ page }) => {
  await openStory(page)
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'playing')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator(controls)).toHaveCount(0)
  const position = await page.evaluate(() => scrollY)
  await page.clock.fastForward(120_000)
  expect(await page.evaluate(() => scrollY)).toBe(position)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'waiting')
  await page.locator('#portfolio-menu').getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'paused')
})

// Mobile browser toolbars resize the visual viewport while a page is scrolling.
test('mobile height changes do not stall the journey from Jada.bit into photography', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 740 })
  await openStory(page)
  await page.clock.fastForward(7000)
  await page.clock.runFor(64)
  for (let beat = 0; beat < 60; beat++) {
    if (await page.locator(controls).getAttribute('data-story-beat') === 'experiments:read') break
    await advanceBeat(page)
  }
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'experiments:read')
  const photoTop = () => page.locator('.photography-section').evaluate(element => element.getBoundingClientRect().top)
  for (let step = 0; step < 180 && await photoTop() > 670; step++) {
    await page.clock.fastForward(1000)
    await page.clock.runFor(32)
  }
  await expect(page.locator(controls)).toHaveAttribute('data-story-beat', 'experiments:read')
  const before = await photoTop()
  for (const height of [764, 740, 780, 740, 764, 740]) {
    await page.setViewportSize({ width: 390, height })
    await page.clock.runFor(600)
  }
  expect(await photoTop()).toBeLessThan(before - 20)
  await expect(page.locator(controls)).toHaveAttribute('data-story-status', 'playing')
  await page.screenshot({ path: info.outputPath('jada-to-photography-mobile.png') })
})


test('section and photography spacing stays compact and consistent across viewports', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
    const gaps = await page.locator('#portfolio > div > .section').evaluateAll(sections => sections.slice(1).map((next, index) => {
      const previous = sections[index]
      const end = previous.getBoundingClientRect().bottom - parseFloat(getComputedStyle(previous).paddingBottom)
      const start = next.getBoundingClientRect().top + parseFloat(getComputedStyle(next).paddingTop)
      return start - end
    }))
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(2)
    expect(Math.max(...gaps)).toBeLessThanOrEqual(width > 700 ? 50 : 34)
    if (width <= 700) {
      const transition = await page.locator('.photography-photo').evaluate(image => {
        const jada = document.querySelector('.personal-project-jada-bit')!
        return image.getBoundingClientRect().top - jada.getBoundingClientRect().bottom
      })
      expect(transition).toBeGreaterThanOrEqual(16)
      expect(transition).toBeLessThanOrEqual(36)
      await page.locator('.photography-section').scrollIntoViewIfNeeded()
      await page.locator('.photography-photo img').evaluate(image => (image as HTMLImageElement).decode())
      await page.screenshot({ path: info.outputPath(`compact-photography-${width}.png`) })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  }
})
