import { test, expect } from '@playwright/test'
import config from '../playwright.config'

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce',
  launchOptions: { ...config.use?.launchOptions,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  },
})

test('mobile music loops at the real media boundary even when JavaScript timers are paused', async ({ page }) => {
  // Install before the app captures performance.now for its initial volume fade.
  await page.clock.install()
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes('portfolio-background-loop')) {
        Reflect.set(window, 'testMusic', this)
        Reflect.set(window, 'testMusicPlayCalls', Number(Reflect.get(window, 'testMusicPlayCalls') ?? 0) + 1)
      }
      return play.call(this)
    }
  })
  await page.goto('/')
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', 'playing')
  await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'testMusic') as HTMLAudioElement).duration)).toBeGreaterThan(190)
  await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'testMusic') as HTMLAudioElement).volume)).toBeGreaterThan(.3)
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 50)
  const calls = await page.evaluate(() => Reflect.get(window, 'testMusicPlayCalls'))
  for (let repeat = 0; repeat < 2; repeat++) {
    await page.evaluate(() => {
      const music = Reflect.get(window, 'testMusic') as HTMLAudioElement
      music.currentTime = music.duration - .25
    })
    await expect.poll(() => page.evaluate(() => {
      const music = Reflect.get(window, 'testMusic') as HTMLAudioElement
      return music.currentTime > 0 && music.currentTime < 3 && !music.paused && !music.ended
    })).toBe(true)
  }
  expect(await page.evaluate(() => Reflect.get(window, 'testMusicPlayCalls'))).toBe(calls)
  expect(await page.evaluate(() => (Reflect.get(window, 'testMusic') as HTMLAudioElement).volume)).toBeGreaterThan(.3)
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click()
  expect(await page.evaluate(() => (Reflect.get(window, 'testMusic') as HTMLAudioElement).muted)).toBe(true)
  await page.getByRole('button', { name: 'Unmute sound', exact: true }).click()
  expect(await page.evaluate(() => (Reflect.get(window, 'testMusic') as HTMLAudioElement).muted)).toBe(false)
})
