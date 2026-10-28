import { test, expect } from '@playwright/test'
import type { AudioManager } from '../src/audio/AudioManager'

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

test('blink and farewell rise above continuous music, with safe restoration and mute', async ({ page }) => {
  await page.clock.install()
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes('portfolio-background-loop')) Reflect.set(window, 'mixMusic', this)
      return play.call(this)
    }
    Reflect.set(window, 'byeStarts', 0)
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && Math.abs(this.buffer.duration - .808417) < .001) Reflect.set(window, 'byeStarts', Number(Reflect.get(window, 'byeStarts')) + 1)
      return Reflect.apply(start, this, args)
    }
    // The local file must work even when browser TTS is absent.
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined })
  })
  await page.route('**/audio-mix-check', route => route.fulfill({ contentType: 'text/html', body: '<button>Enable sound</button>' }))
  await page.goto('/audio-mix-check')
  await page.evaluate(async () => {
    const source = '/src/audio/AudioManager.ts'
    const { AudioManager } = await import(source)
    const manager = new AudioManager()
    Reflect.set(window, 'mixManager', manager)
    manager.prepare()
    document.querySelector('button')!.onclick = () => manager.enable()
  })
  await page.getByRole('button', { name: 'Enable sound' }).click()
  await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).snapshot().status)).toBe('playing')
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 850)
  const volume = () => page.evaluate(() => (Reflect.get(window, 'mixMusic') as HTMLAudioElement).volume)
  expect(await volume()).toBeCloseTo(.35, 2)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).cue('blink'))
  await page.clock.runFor(120)
  expect(await volume()).toBeLessThan(.1)
  await page.clock.runFor(1000)
  expect(await volume()).toBeCloseTo(.35, 2)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).sayBye())
  await page.clock.runFor(120)
  expect(await volume()).toBeLessThan(.05)
  expect(await page.evaluate(() => Reflect.get(window, 'byeStarts'))).toBe(1)
  expect(await page.evaluate(() => (Reflect.get(window, 'mixMusic') as HTMLAudioElement).paused)).toBe(false)
  await page.clock.runFor(1700)
  expect(await volume()).toBeCloseTo(.35, 2)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).sayBye())
  await page.clock.runFor(120)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).stopBye())
  await page.clock.runFor(600)
  expect(await volume()).toBeCloseTo(.35, 2)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).sayBye())
  await page.clock.runFor(120)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).mute())
  await page.clock.runFor(4000)
  expect(await page.evaluate(() => (Reflect.get(window, 'mixMusic') as HTMLAudioElement).muted)).toBe(true)
  const mutedStarts = await page.evaluate(() => Reflect.get(window, 'byeStarts'))
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).sayBye())
  await page.clock.runFor(1000)
  expect(await page.evaluate(() => Reflect.get(window, 'byeStarts'))).toBe(mutedStarts)
  // Ending the movie stops the native loop but leaves the local Bye effect usable.
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).enable())
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).finishMusic())
  expect(await page.evaluate(() => (Reflect.get(window, 'mixMusic') as HTMLAudioElement).paused)).toBe(true)
  const beforeFarewell = await page.evaluate(() => Reflect.get(window, 'byeStarts'))
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).sayBye())
  await page.clock.runFor(200)
  expect(await page.evaluate(() => Reflect.get(window, 'byeStarts'))).toBe(Number(beforeFarewell) + 1)
  await page.clock.runFor(5000)
  await page.evaluate(() => { const manager = Reflect.get(window, 'mixManager') as AudioManager; manager.mute(); manager.enable() })
  expect(await page.evaluate(() => (Reflect.get(window, 'mixMusic') as HTMLAudioElement).paused)).toBe(true)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).restartMusic())
  await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'mixMusic') as HTMLAudioElement).paused)).toBe(false)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).dispose())
})
