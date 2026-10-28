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
    // Exercise the browser-speech lifecycle without depending on installed OS voices.
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => [], cancel: () => {},
      speak: (voice: SpeechSynthesisUtterance) => {
        Reflect.set(window, 'mixVoice', voice)
        voice.dispatchEvent(new Event('start'))
      },
    } })
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
  for (const event of ['end', 'error', 'missing']) {
    await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).sayBye())
    await page.clock.runFor(120)
    expect(await page.evaluate(() => (Reflect.get(window, 'mixVoice') as SpeechSynthesisUtterance).volume)).toBe(1)
    expect(await volume()).toBeLessThan(.05)
    expect(await page.evaluate(() => (Reflect.get(window, 'mixMusic') as HTMLAudioElement).paused)).toBe(false)
    if (event !== 'missing') await page.evaluate(event => (Reflect.get(window, 'mixVoice') as SpeechSynthesisUtterance).dispatchEvent(new Event(event)), event)
    await page.clock.runFor(event === 'missing' ? 3600 : 600)
    expect(await volume()).toBeCloseTo(.35, 2)
  }
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).sayBye())
  await page.clock.runFor(120)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).mute())
  await page.clock.runFor(4000)
  expect(await page.evaluate(() => (Reflect.get(window, 'mixMusic') as HTMLAudioElement).muted)).toBe(true)
  await page.evaluate(() => (Reflect.get(window, 'mixManager') as AudioManager).dispose())
})
