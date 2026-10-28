import { Application, extend, useApplication } from '@pixi/react'
import { Container, Sprite } from 'pixi.js'
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { LoadedAssets } from '../assets/loadAssets'
import { sceneLayers } from '../assets/manifest'
import type { AudioManager } from '../audio/AudioManager'
import { SceneController } from '../animation/SceneController'
import { positionCamera, positionThoughtCloud, type CameraState } from '../animation/camera'
import { experience } from '../config/experience'
import { IntroThoughtCloud } from '../components/IntroThoughtCloud'

extend({ Container, Sprite })

interface Props {
  assets: LoadedAssets
  playing: boolean
  audio: AudioManager
  onComplete: () => void
  onFade: () => void
  onStage: (stage: string) => void
  onFailure: () => void
  onRendered: () => void
}

interface ThoughtRefs { cloud: RefObject<HTMLDivElement | null>; text: RefObject<HTMLSpanElement | null> }

function World({ assets, playing, audio, onComplete, onFade, onStage, onFailure, onRendered, cloud, text }: Props & ThoughtRefs) {
  const { app } = useApplication()
  const root = useRef<Container>(null)
  const character = useRef<Container>(null)
  const portrait = useRef<Sprite>(null)
  const cloudWrap = useRef<Sprite>(null)
  const layers = useRef<Record<string, Sprite | null>>({})
  const camera = useRef<CameraState>({ x: experience.camera.startX, y: 0, zoom: experience.camera.startZoom })

  const draw = useCallback(() => {
    if (!root.current || !app.renderer) return false
    positionCamera(root.current, camera.current, app.screen.width, app.screen.height)
    for (const layer of sceneLayers) {
      const sprite = layers.current[layer.id]
      if (sprite) {
        sprite.x = camera.current.x * (1 - layer.depth) * 0.8 + (layer.id === 'clouds' ? camera.current.cloudDrift ?? 0 : 0)
        if (layer.id === 'clouds' && cloudWrap.current) cloudWrap.current.x = sprite.x - experience.world.width
      }
    }
    if (cloud.current && character.current) {
      positionThoughtCloud(cloud.current, root.current, character.current, app.screen.width)
    }
    app.render()
    return true
  }, [app, cloud])

  useLayoutEffect(() => {
    const renderer = app.renderer
    const canvas = app.canvas
    if (!renderer) return
    if (draw()) onRendered()
    renderer.on('resize', draw)
    const lost = (event: Event) => { event.preventDefault(); onFailure() }
    canvas.addEventListener('webglcontextlost', lost)
    return () => {
      renderer.off('resize', draw)
      canvas.removeEventListener('webglcontextlost', lost)
    }
  }, [app, draw, onFailure, onRendered])

  useEffect(() => {
    if (!playing || !character.current || !portrait.current || !cloud.current || !text.current) return
    const controller = new SceneController({
      camera: camera.current,
      character: character.current,
      portrait: portrait.current,
      poses: assets.textures,
      thought: { element: cloud.current, text: text.current },
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
  }, [assets, playing, audio, draw, onComplete, onFade, onStage, cloud, text])

  return (
    <pixiContainer ref={root} eventMode="none">
      {sceneLayers.filter((layer) => layer.id !== 'ridge').map((layer) => (
        <Fragment key={layer.id}><pixiSprite texture={assets.textures[layer.id]}
          ref={(sprite) => { layers.current[layer.id] = sprite }}
          width={experience.world.width} height={experience.world.height} />
          {layer.id === 'clouds' && <pixiSprite ref={cloudWrap} texture={assets.textures.clouds}
            x={-experience.world.width} width={experience.world.width} height={experience.world.height} />}
        </Fragment>
      ))}
      <pixiContainer ref={character} x={experience.character.x} y={experience.character.hiddenY} scale={experience.character.scale} alpha={0}>
        <pixiSprite ref={portrait} texture={assets.textures.neutral} anchor={{ x: 0.5, y: 1 }} />
      </pixiContainer>
      <pixiSprite texture={assets.textures.ridge} width={experience.world.width} height={experience.world.height}
        ref={(sprite) => { layers.current.ridge = sprite }} />
    </pixiContainer>
  )
}

export default function MountainWorld(props: Props) {
  const { onRendered: notifyRendered } = props
  const parent = useRef<HTMLDivElement>(null)
  const cloud = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLSpanElement>(null)
  const [ready, setReady] = useState(false)
  const onInit = useCallback(() => setReady(true), [])
  const onRendered = useCallback(() => {
    parent.current?.setAttribute('data-render-ready', 'true')
    notifyRendered()
  }, [notifyRendered])
  // Pixel art needs a small backing buffer, not a retina-size framebuffer.
  const resolution = Math.min(1, Math.sqrt((960 * 540) / (window.innerWidth * window.innerHeight)))
  return (
    <div className="pixi-world" ref={parent} aria-hidden="true" data-render-ready="false">
      <Application resizeTo={parent} autoStart={false} antialias={false} roundPixels onInit={onInit}
        resolution={resolution} autoDensity preference="webgl" backgroundColor={0x172522}>
        {ready ? <World {...props} onRendered={onRendered} cloud={cloud} text={text} /> : null}
      </Application>
      <IntroThoughtCloud cloud={cloud} text={text} />
    </div>
  )
}
