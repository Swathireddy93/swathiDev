"""Encode the captured, unchanged portfolio character for messaging apps."""
import json
import math
from pathlib import Path
import re
import struct
import subprocess
import wave

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[1]
FRAMES = Path('/tmp/swathi-character-export')
FPS, DURATION = 25, 2.4
CREAM = (232, 223, 203, 255)

# Snap rotated edge pixels to the real source palette, rather than adding blur.
colors = set()
for pose in ['neutral', 'blink']:
    source = np.array(Image.open(ROOT / f'public/assets/temporary/character-{pose}.png').convert('RGBA'))
    colors.update(map(tuple, source[source[:, :, 3] == 255][:, :3]))
for value in re.findall(r'#[0-9a-fA-F]{6}', (ROOT / 'src/components/PixelFigure.tsx').read_text()):
    colors.add(tuple(int(value[i:i + 2], 16) for i in [1, 3, 5]))
colors = sorted(colors)
assert len(colors) < 255
palette = Image.new('P', (1, 1))
palette.putpalette([0, 0, 0] + [int(channel) for color in colors for channel in color] + [0] * (768 - 3 - 3 * len(colors)))

def wav_file(path, samples, rate=48000):
    with wave.open(str(path), 'wb') as target:
        target.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
        target.writeframes(b''.join(struct.pack('<h', max(-32767, min(32767, round(sample * 32767)))) for sample in samples))

def blink_sound(t):
    value = 0
    for start, frequency in [(.80, 900), (1.08, 1080)]:
        local = t - start
        if 0 <= local < .095:
            envelope = math.sin(math.pi * local / .095) ** 2 * math.exp(-local * 20)
            phase = 2 * math.pi * (frequency * local - 1500 * local ** 2)
            value += .14 * envelope * (math.sin(phase) + .18 * math.sin(2 * phase))
    return value

wav_file(OUT / 'audio/character-blinking.wav', [blink_sound(i / 48000) for i in range(round(DURATION * 48000))])

# Keep a little quiet lead-in, placing "Hi!" on the first high point of the wave.
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(OUT / 'audio/hi-female.wav'),
    '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.015,adelay=240:all=1,apad',
    '-t', str(DURATION), '-ar', '48000', str(OUT / 'audio/character-waving-hi.wav')], check=True)

for kind in ['blinking', 'waving-hi']:
    frames = []
    indexed = []
    directory = FRAMES / f'{kind}-final'
    directory.mkdir(exist_ok=True)
    for index, file in enumerate(sorted((FRAMES / kind).glob('*.png'))):
        source = Image.open(file).convert('RGBA')
        array = np.array(source)
        unique, inverse = np.unique(array[:, :, :3].reshape(-1, 3), axis=0, return_inverse=True)
        difference = unique.astype(np.int32)[:, None, :] - np.array(colors, dtype=np.int32)[None, :, :]
        nearest = np.argmin(np.sum(difference ** 2, axis=2), axis=1)
        pixels = (nearest[inverse] + 1).reshape(array.shape[:2]).astype(np.uint8)
        pixels[array[:, :, 3] < 128] = 0
        frame = Image.fromarray(pixels)
        frame.putpalette(palette.getpalette())
        frame = frame.resize((512, 512), Image.Resampling.NEAREST)
        indexed.append(frame)
        crisp = frame.convert('RGBA')
        crisp.putalpha(source.getchannel('A').point(lambda alpha: 255 if alpha >= 128 else 0).resize((512, 512), Image.Resampling.NEAREST))
        crisp.save(directory / f'{index:03}.png')
        frames.append(crisp)
    assert len(frames) == FPS * DURATION
    indexed[0].save(OUT / f'character-{kind}.gif', save_all=True, append_images=indexed[1:],
        duration=40, loop=0, transparency=0, disposal=2, optimize=False)
    frames[0].save(OUT / f'character-{kind}.webp', save_all=True, append_images=frames[1:],
        duration=40, loop=0, lossless=True, quality=100, method=6)
    frames[0 if kind == 'blinking' else 8].save(OUT / f'character-{kind}-poster.png')
    # H.264 does not preserve transparency; use the portfolio's own soft cream.
    for index, rgba in enumerate(frames):
        background = Image.new('RGBA', (512, 512), CREAM)
        background.alpha_composite(rgba)
        background.convert('RGB').save(directory / f'mp4-{index:03}.png')
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-framerate', str(FPS), '-i', str(directory / 'mp4-%03d.png'),
        '-i', str(OUT / f'audio/character-{kind}.wav'), '-t', str(DURATION),
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'baseline', '-level', '3.0',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', '-movflags', '+faststart',
        str(OUT / f'character-{kind}.mp4')], check=True)
    print(json.dumps({'animation': kind, 'frames': len(frames), 'gifBytes': (OUT / f'character-{kind}.gif').stat().st_size,
        'mp4Bytes': (OUT / f'character-{kind}.mp4').stat().st_size, 'webpBytes': (OUT / f'character-{kind}.webp').stat().st_size}))
