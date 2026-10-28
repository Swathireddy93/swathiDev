import { test, expect } from '@playwright/test'

test('the opening has no spoken Hi or misplaced Bye', async ({ page }) => {
  const greetingRequests: string[] = []
  page.on('request', request => { if (request.url().includes('character-greeting.wav')) greetingRequests.push(request.url()) })
  await page.addInitScript(() => {
    const starts: number[] = []
    Reflect.set(window, 'introVoiceStarts', starts)
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && (Math.abs(this.buffer.duration - .808417) < .001 || Math.abs(this.buffer.duration - .939667) < .001)) starts.push(this.buffer.duration)
      return Reflect.apply(start, this, args)
    }
  })
  await page.goto('/')
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', /playing|muted/)
  const unmute = page.getByRole('button', { name: 'Unmute sound', exact: true })
  if (await unmute.isVisible()) await unmute.click()
  await expect(page.locator('.intro-thought-cloud')).toHaveAttribute('data-state', 'reading', { timeout: 25_000 })
  expect(await page.evaluate(() => Reflect.get(window, 'introVoiceStarts'))).toEqual([])
  expect(greetingRequests).toEqual([])
  await expect(page.locator('.thought-copy')).toContainText('Oh, hey! You made it.')
})
