# Portfolio character animations

These exports reuse the existing `src/components/PixelFigure.tsx` React character,
the original neutral/blink PNGs and the existing `farewell-wave` CSS keyframes.
No character artwork, website source, dependencies or functionality was changed.
The character's original relaxed smile is preserved; no new face was drawn.

| Animation | Transparent GIF | MP4 with audio | Transparent animated WebP |
| --- | --- | --- | --- |
| Natural double blink | `character-blinking.gif` | `character-blinking.mp4` | `character-blinking.webp` |
| Friendly wave | `character-waving-hi.gif` | `character-waving-hi.mp4` | `character-waving-hi.webp` |

All files are **512 × 512**, **2.4 seconds** and **25 fps**. GIF/WebP files repeat
forever. MP4 files contain one complete loop; repetition depends on the messaging
app or player. GIFs cannot contain sound. The MP4s use the portfolio's soft cream
`#E8DFCB` background because widely compatible H.264 MP4 does not support alpha.

The blinking loop closes the existing eyes at 0.80–0.92s and 1.08–1.20s. Its MP4
has two original, quiet synthesized blips aligned with those blinks. No blink sound
asset existed in the portfolio. The wave uses the portfolio's original 1.2s hand
cycle twice, with a friendly female “Hi!” at 0.24s. No recorded “Hi!” asset existed;
the voice was generated locally with Kokoro-82M, voice `af_heart`, speed 1.1.
There was no paid voice API. Raw and synchronized audio are in `audio/`.

Rendering happens at 128 × 128, followed by an exact 4× nearest-neighbor upscale.
Rotated edge pixels use the original character palette and binary alpha to keep
pixel edges crisp. GIFs use an exact shared palette, transparent background and
clear-between-frame disposal to avoid hand trails. Lossless animated WebP backups
are included for apps that support them. Apps may convert or flatten GIFs when
sharing; send as a file/document when preserving the original format matters.

Open `preview.html` alongside these files to preview the loops and play both MP4s.
The two `*-poster.png` files are transparent still previews. `verification.json`
records dimensions, timing, transparency, frame comparisons and audio checks.

## Recreate

From the repository root with the existing Node dependencies, Chromium, FFmpeg,
Python, Pillow and NumPy available:

```sh
node exports/character-animations/render.mjs
python exports/character-animations/encode.py
python exports/character-animations/verify.py
```

`render.mjs` captures the real React component into `/tmp/swathi-character-export/`.
The embedded SVG sources and source hashes are saved under `source/`. The existing
`audio/hi-female.wav` can be reused without installing a voice engine. To regenerate
it, use the HyperFrames local Kokoro workflow with text `Hi!`, voice `af_heart` and
speed `1.1`. Voice models and isolated Python tools were kept outside the website.
