import { test, expect } from '@playwright/test'
import config from '../playwright.config'

test.use({ launchOptions: { ...config.use?.launchOptions,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
} })

test('music actually plays while critical scene assets are still loading', async ({ page }) => {
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/assets/temporary/bay.png', async route => { await held; await route.continue() })
  try {
    await page.goto('/')
    await expect(page.getByTestId('loading-screen')).toBeVisible()
    await expect(page.locator('.sound-controls')).toHaveAttribute('data-audio-status', 'playing')
    await expect(page.getByRole('button', { name: 'Mute sound' })).toBeVisible()
  } finally { release() }
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-last-cue', 'jump')
  await expect(page.locator('.sound-controls')).toHaveAttribute('data-last-cue', 'land')
})
