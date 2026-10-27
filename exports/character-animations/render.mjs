// Export-only renderer. Imports the real React character; no website files change.
/* global console, document, Image, process */
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const out = import.meta.dirname
const frames = process.env.CHARACTER_FRAMES_DIR || '/tmp/swathi-character-export'
const fps = 25, duration = 2.4, logicalSize = 128
const css = await readFile(join(root, 'src/theme/journey.css'), 'utf8')
const start = css.indexOf('@keyframes farewell-wave {')
if (start < 0) throw new Error('The existing waving animation was not found')
let depth = 0, end = css.indexOf('{', start)
for (let i = end; i < css.length; i++) {
  if (css[i] === '{') depth++
  if (css[i] === '}' && --depth === 0) { end = i + 1; break }
}
const waveRule = css.slice(start, end)
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' })
let browser
try {
  const { PixelFigure } = await server.ssrLoadModule('/src/components/PixelFigure.tsx')
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true })
  const page = await browser.newPage({ viewport: { width: logicalSize, height: logicalSize }, deviceScaleFactor: 1 })
  await mkdir(join(out, 'source'), { recursive: true })
  for (const [name, waving] of [['blinking', false], ['waving-hi', true]]) {
    const directory = join(frames, name)
    await mkdir(directory, { recursive: true })
    let svg = renderToStaticMarkup(React.createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg', width: logicalSize, height: logicalSize,
      viewBox: '0 0 128 128', shapeRendering: 'crispEdges',
    }, React.createElement('g', { transform: 'translate(40 24)' }, React.createElement(PixelFigure, { waving }))))
    for (const pose of ['neutral', 'blink']) {
      const png = await readFile(join(root, `public/assets/temporary/character-${pose}.png`))
      svg = svg.replaceAll(`/assets/temporary/character-${pose}.png`, `data:image/png;base64,${png.toString('base64')}`)
    }
    if (svg.includes('href="/')) throw new Error('An image was not embedded')
    await writeFile(join(out, 'source', `character-${name}.svg`), svg)
    await page.setContent(`<style>html,body{margin:0;width:128px;height:128px;overflow:hidden;background:transparent}svg{display:block;image-rendering:pixelated}.character-face-blink{opacity:0}.farewell-wave{animation:farewell-wave 1.2s ease-in-out infinite}${waveRule}</style>${svg}`)
    await page.evaluate(async () => {
      await Promise.all([...document.querySelectorAll('image')].map(element => new Promise((resolve, reject) => {
        const img = new Image(); img.onload = resolve; img.onerror = reject; img.src = element.getAttribute('href')
      })))
      document.getAnimations().forEach(animation => animation.pause())
    })
    for (let frame = 0; frame < fps * duration; frame++) {
      const t = frame / fps
      const blink = (t >= .8 && t < .92) || (t >= 1.08 && t < 1.2)
      await page.evaluate(({ t, blink }) => {
        document.querySelector('.character-face-neutral').style.opacity = blink ? '0' : '1'
        document.querySelector('.character-face-blink').style.opacity = blink ? '1' : '0'
        document.getAnimations().forEach(animation => { animation.currentTime = t * 1000 })
      }, { t, blink })
      await page.screenshot({ path: join(directory, `${String(frame).padStart(3, '0')}.png`), omitBackground: true })
    }
    console.log(`${name}: ${fps * duration} transparent ${logicalSize}px source frames`)
  }
  const sources = {}
  for (const path of ['src/components/PixelFigure.tsx', 'src/theme/journey.css', 'public/assets/temporary/character-neutral.png', 'public/assets/temporary/character-blink.png']) {
    sources[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex')
  }
  await writeFile(join(out, 'source', 'capture.json'), JSON.stringify({ fps, duration, sourceCanvas: logicalSize, exportCanvas: 512, nearestNeighborScale: 4, blinkWindows: [[.8,.92],[1.08,1.2]], waveKeyframes: waveRule, sources }, null, 2) + '\n')
} finally {
  await browser?.close()
  await server.close()
}
