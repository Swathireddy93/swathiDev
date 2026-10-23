import { Application, extend, useApplication } from '@pixi/react'
import { Container, Sprite } from 'pixi.js'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { LoadedAssets } from '../assets/loadAssets'
import { sceneLayers } from '../assets/manifest'
import type { AudioManager } from '../audio/AudioManager'
import { SceneController } from '../animation/SceneController'
import { positionCamera, type CameraState } from '../animation/camera'
import { experience } from '../config/experience'

extend({ Container, Sprite })

interface Props {
  assets: LoadedAssets
  playing: boolean
  audio: AudioManager
  onComplete: () => void
  onFade: () => void
  onStage: (stage: string) => void
  onFailure: () => void
}

function World({ assets, playing, audio, onComplete, onFade, onStage, onFailure }: Props) {
  const { app } = useApplication()
  const root = useRef<Container>(null)
  const character = useRef<Container>(null)
  const portrait = useRef<Sprite>(null)
  const layers = useRef<Record<string, Sprite | null>>({})
  const camera = useRef<CameraState>({ x: experience.camera.startX, y: 0, zoom: experience.camera.startZoom })

  const draw = useCallback(() => {
    if (!root.current || !app.renderer) return
    positionCamera(root.current, camera.current, app.screen.width, app.screen.height)
    for (const layer of sceneLayers) {
      const sprite = layers.current[layer.id]
      if (sprite) sprite.x = camera.current.x * (1 - layer.depth) * 0.8
    }
    app.render()
  }, [app])

  useLayoutEffect(() => {
    const renderer = app.renderer
    const canvas = app.canvas
    if (!renderer) return
    draw()
    renderer.on('resize', draw)
    const lost = (event: Event) => { event.preventDefault(); onFailure() }
    canvas.addEventListener('webglcontextlost', lost)
    return () => {
      renderer.off('resize', draw)
      canvas.removeEventListener('webglcontextlost', lost)
    }
  }, [app, draw, onFailure])

  useEffect(() => {
    if (!playing || !character.current || !portrait.current) return
    const controller = new SceneController({
      camera: camera.current,
      character: character.current,
      portrait: portrait.current,
      poses: assets.textures,
      audio, onComplete, onFade, onStage, onFrame: draw,
    })
    controller.play()
    const visibility = () => {
      if (document.hidden) controller.pause()
      else controller.resume()
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      controller.dispose()
    }
  }, [assets, playing, audio, draw, onComplete, onFade, onStage])

  return (
    <pixiContainer ref={root} eventMode="none">
      {sceneLayers.filter((layer) => layer.id !== 'ridge').map((layer) => (
        <pixiSprite key={layer.id} texture={assets.textures[layer.id]}
          ref={(sprite) => { layers.current[layer.id] = sprite }}
          width={experience.world.width} height={experience.world.height} />
      ))}
      <pixiContainer ref={character} x={experience.character.x} y={experience.character.hiddenY} scale={experience.character.scale}>
        <pixiSprite ref={portrait} texture={assets.textures.neutral} anchor={{ x: 0.5, y: 1 }} />
      </pixiContainer>
      <pixiSprite texture={assets.textures.ridge} width={experience.world.width} height={experience.world.height}
        ref={(sprite) => { layers.current.ridge = sprite }} />
    </pixiContainer>
  )
}

export default function MountainWorld(props: Props) {
  const parent = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const onInit = useCallback(() => setReady(true), [])
  // Pixel art needs a small backing buffer, not a retina-size framebuffer.
  const resolution = Math.min(1, Math.sqrt((960 * 540) / (window.innerWidth * window.innerHeight)))
  return (
    <div className="pixi-world" ref={parent} aria-hidden="true">
      <Application resizeTo={parent} autoStart={false} antialias={false} roundPixels onInit={onInit}
        resolution={resolution} autoDensity preference="webgl" backgroundColor={0x172522}>
        {ready ? <World {...props} /> : null}
      </Application>
    </div>
  )
}
