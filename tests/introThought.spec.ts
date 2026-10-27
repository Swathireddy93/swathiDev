import { test, expect, type Page } from '@playwright/test'

const message = "Oh, hey! You made it. 👋\nWanna see what I've been building since 2018?\nSit back, it's hands-free. I'll show you around!"
const cloud = '.intro-thought-cloud'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const counts = { type: 0, swoosh: 0 }
    Reflect.set(window, 'testThoughtAudio', counts)
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && Math.abs(this.buffer.duration - .075) < .001) counts.type++
      if (this.buffer && Math.abs(this.buffer.duration - .5) < .001) counts.swoosh++
      return Reflect.apply(start, this, args)
    }
  })
})
const audioCounts = (page: Page) => page.evaluate(() => Reflect.get(window, 'testThoughtAudio') as { type: number; swoosh: number })

async function reachState(page: Page, state: string) {
  await expect(page.locator(cloud)).toHaveAttribute('data-state', state, { timeout: 15_000 })
}

async function openIntroduction(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', /playing|muted/)
  const unmute = page.getByRole('button', { name: 'Unmute sound', exact: true })
  if (await unmute.isVisible()) await unmute.click()
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'peeking')
}

for (const width of [320, 1440]) test(`the second peek types three thought lines before the swoosh and original journey at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 320 ? 740 : 900 })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await openIntroduction(page)
  await expect(page.locator(cloud)).toHaveAttribute('data-state', 'hidden')
  await reachState(page, 'typing')
  await page.waitForTimeout(500)
  const partial = await page.locator(`${cloud} .thought-copy > span`).textContent()
  expect(partial!.length).toBeGreaterThan(0)
  expect(partial!.length).toBeLessThan(message.length)
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'thought')
  const held = (await page.locator(cloud).boundingBox())!
  const floatHeights: number[] = []
  for (let frame = 0; frame < 5; frame++) {
    floatHeights.push((await page.locator('.thought-float').boundingBox())!.y)
    await page.waitForTimeout(200)
  }
  expect(Math.max(...floatHeights) - Math.min(...floatHeights)).toBeGreaterThan(.3)
  expect(Math.max(...floatHeights) - Math.min(...floatHeights)).toBeLessThanOrEqual(8)
  const after = (await page.locator(cloud).boundingBox())!
  expect(Math.abs(after.x - held.x)).toBeLessThan(.5)
  expect(Math.abs(after.y - held.y)).toBeLessThan(.5)
  expect((await audioCounts(page)).type).toBeGreaterThan(5)
  await reachState(page, 'reading')
  await expect(page.locator(`${cloud} .thought-copy > span`)).toHaveText(message)
  const rows = await page.locator(`${cloud} .thought-copy > span`).evaluate(element => new Set(Array.from(element.getClientRects(), rect => Math.round(rect.top))).size)
  expect(rows).toBe(3)
  const textBounds = (await page.locator(`${cloud} .thought-copy > span`).boundingBox())!
  expect(textBounds.x).toBeGreaterThanOrEqual(after.x)
  expect(textBounds.x + textBounds.width).toBeLessThanOrEqual(after.x + after.width)
  expect(after.width).toBeLessThanOrEqual(312)
  await expect(page.locator('.thought-silhouette path[fill]')).toHaveAttribute('fill', /url\(#/)
  expect(after.x).toBeGreaterThanOrEqual(16)
  expect(after.x + after.width).toBeLessThanOrEqual(width - 16)
  expect(after.y).toBeGreaterThanOrEqual(100)
  await page.screenshot({ path: info.outputPath(`thought-cloud-${width}.png`) })
  const before = await audioCounts(page)
  await reachState(page, 'fading')
  await expect.poll(async () => (await audioCounts(page)).swoosh).toBe(before.swoosh + 1)
  await expect(page.locator(cloud)).toHaveAttribute('data-state', 'hidden')
  await expect(page.locator(cloud)).toHaveCSS('visibility', 'hidden')
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'approaching')
  await expect(page.locator('.app')).toHaveAttribute('data-scene', 'pov')
  await expect(page.getByTestId('city-flight')).toBeVisible()
  expect(errors).toEqual([])
})

test('mute silences the thought sounds and skipping cancels the unfinished intro', async ({ page }) => {
  await openIntroduction(page)
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click()
  const before = await audioCounts(page)
  await reachState(page, 'typing')
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click()
  await expect(page.getByTestId('portfolio')).toBeVisible()
  await page.waitForTimeout(500)
  expect(await audioCounts(page)).toEqual(before)
  await expect(page.locator(cloud)).toHaveCount(0)
  await page.getByRole('button', { name: /Replay the introduction/ }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-phase', 'playing')
  await expect(page.locator(cloud)).toHaveAttribute('data-state', 'hidden')
  await expect(page.locator(`${cloud} .thought-copy > span`)).toBeEmpty()
  await reachState(page, 'typing')
  await page.waitForTimeout(500)
  expect((await page.locator(`${cloud} .thought-copy > span`).textContent())!.length).toBeLessThan(message.length)
  await reachState(page, 'fading')
  expect(await audioCounts(page)).toEqual(before)
})
