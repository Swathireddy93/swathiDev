import { Assets, Texture } from 'pixi.js'
import { experience } from '../config/experience'
import { characterAssets, sceneLayers, type AssetId } from './manifest'

export interface LoadedAssets {
  textures: Record<AssetId, Texture>
  failures: string[]
}

let cached: Promise<LoadedAssets> | undefined
let progress = 0
const listeners = new Set<(value: number) => void>()

async function timeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Asset loading timed out')), experience.assetsTimeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

export function loadAssets(onProgress: (value: number) => void): Promise<LoadedAssets> {
  listeners.add(onProgress)
  onProgress(progress)
  if (!cached) {
    cached = (async () => {
      const manifest = [...sceneLayers, ...characterAssets]
      const failures: string[] = []
      const textures = {} as Record<AssetId, Texture>
      let settled = 0
      const count = manifest.length + 2
      const advance = () => {
        progress = Math.round((++settled / count) * 100)
        listeners.forEach((listener) => listener(progress))
      }
      await Promise.all([
        ...manifest.map(async (asset) => {
          try {
            const texture = await timeout(Assets.load<Texture>(asset.url))
            texture.source.scaleMode = 'nearest'
            textures[asset.id] = texture
          } catch {
            textures[asset.id] = Texture.EMPTY
            failures.push(asset.id)
          } finally {
            advance()
          }
        }),
        ...['16px Pixelify', '16px Inter'].map(async (font) => {
          try { await timeout(document.fonts.load(font)) }
          catch { failures.push(font) }
          finally { advance() }
        }),
      ])
      return { textures, failures }
    })()
  }
  return cached.finally(() => listeners.delete(onProgress))
}
