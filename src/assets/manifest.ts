const base = `${import.meta.env.BASE_URL}assets/temporary/`

export const sceneLayers = [
  { id: 'sky', url: `${base}sky.png`, depth: 0.05 },
  { id: 'clouds', url: `${base}clouds.png`, depth: 0.15 },
  { id: 'distantRidges', url: `${base}distant-ridges.png`, depth: 0.25 },
  { id: 'bay', url: `${base}bay.png`, depth: 0.35 },
  { id: 'city', url: `${base}distant-city.png`, depth: 0.4 },
  { id: 'hills', url: `${base}wooded-hills.png`, depth: 0.65 },
  { id: 'trees', url: `${base}near-trees.png`, depth: 0.85 },
  { id: 'ridge', url: `${base}overlook-ridge.png`, depth: 1 },
] as const

export const characterAssets = [
  { id: 'neutral', url: `${base}character-neutral.png` },
  { id: 'blink', url: `${base}character-blink.png` },
  { id: 'jump', url: `${base}character-jump.png` },
] as const

export type AssetId = (typeof sceneLayers)[number]['id'] | (typeof characterAssets)[number]['id']
export const posterUrl = `${base}poster.png`
