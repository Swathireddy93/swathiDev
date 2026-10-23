export const experience = {
  world: { width: 960, height: 540 },
  camera: { startX: -5, endX: 24, startZoom: 1.02, endZoom: 1.075 },
  character: { x: 285, hiddenY: 540, peekY: 477, jumpY: 400, landY: 466, scale: 1.35 },
  timing: {
    duration: 10.5,
    reveal: 1.6,
    peekAt: 2.3,
    peekDuration: 1.15,
    blinkAt: 4.2,
    jumpAt: 5.4,
    jumpUp: 0.43,
    jumpDown: 0.58,
    landHold: 2.1,
    fadeOut: 0.7,
  },
  sessionKey: 'swathi.intro.seen.v1',
  assetsTimeoutMs: 12_000,
  artworkStatus: 'Temporary procedural pixel art; final art awaits visual review.',
} as const

export type IntroPhase = 'loading' | 'choice' | 'playing' | 'portfolio'
