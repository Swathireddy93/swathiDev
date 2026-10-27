"""Verify playback, transparency, timing and sound without changing the website."""
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent
FRAMES = Path('/tmp/swathi-character-export')
report = {'size': [512, 512], 'loopSeconds': 2.4, 'animations': {}}

for kind in ['blinking', 'waving-hi']:
    gif = Image.open(OUT / f'character-{kind}.gif')
    assert gif.size == (512, 512) and gif.info['loop'] == 0
    elapsed, distinct = 0, set()
    for index in range(gif.n_frames):
        gif.seek(index)
        frame = gif.convert('RGBA')
        array = np.array(frame)
        expected = np.array(Image.open(FRAMES / f'{kind}-final/{round(elapsed / 40):03}.png').convert('RGBA'))
        assert np.array_equal(array[:, :, 3], expected[:, :, 3]), f'{kind}: alpha/frame disposal mismatch at {elapsed}ms'
        opaque = array[:, :, 3] > 0
        assert np.array_equal(array[opaque], expected[opaque]), f'{kind}: changed pixel colors at {elapsed}ms'
        assert array[0, 0, 3] == 0 and array[256, 256, 3] == 255
        assert np.array_equal(array, np.repeat(np.repeat(array[::4, ::4], 4, axis=0), 4, axis=1)), 'Blurred pixel edges'
        distinct.add(hashlib.sha256(array.tobytes()).hexdigest())
        elapsed += gif.info['duration']
    assert elapsed == 2400 and len(distinct) > 1
    webp = Image.open(OUT / f'character-{kind}.webp')
    assert webp.size == (512, 512) and webp.n_frames > 1 and webp.info['loop'] == 0
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(OUT / f'character-{kind}.mp4'), '-f', 'null', '-'], check=True)
    metadata = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(OUT / f'character-{kind}.mp4')]))
    video = next(stream for stream in metadata['streams'] if stream['codec_type'] == 'video')
    audio = next(stream for stream in metadata['streams'] if stream['codec_type'] == 'audio')
    assert (video['width'], video['height']) == (512, 512) and video['codec_name'] == 'h264' and video['pix_fmt'] == 'yuv420p'
    assert int(video['nb_frames']) == 60 and abs(float(video['duration']) - 2.4) < .01 and audio['codec_name'] == 'aac'
    decoded = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(OUT / f'character-{kind}.mp4'), '-vn', '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'])
    samples = np.frombuffer(decoded, dtype=np.float32)
    peak = float(np.abs(samples).max())
    assert .01 < peak < 1
    audible = np.flatnonzero(np.abs(samples) > .005)
    onset = float(audible[0] / 48000)
    assert (.75 < onset < .9) if kind == 'blinking' else (.22 < onset < .4)
    report['animations'][kind] = {
        'gifFrames': gif.n_frames, 'distinctGifFrames': len(distinct), 'gifLoopMilliseconds': elapsed,
        'gifAlphaAndColorsMatchRenderedFrames': True, 'pixelGridPreserved': True,
        'transparentGifAndWebp': True, 'webpFrames': webp.n_frames,
        'mp4Video': {'codec': video['codec_name'], 'frames': int(video['nb_frames']), 'duration': float(video['duration'])},
        'mp4Audio': {'codec': audio['codec_name'], 'peak': round(peak, 4), 'firstSoundSeconds': round(onset, 3)},
        'bytes': {extension: (OUT / f'character-{kind}.{extension}').stat().st_size for extension in ['gif', 'mp4', 'webp']},
    }

capture = json.loads((OUT / 'source/capture.json').read_text())
for path, digest in capture['sources'].items():
    assert hashlib.sha256((OUT.parents[1] / path).read_bytes()).hexdigest() == digest, f'Original changed: {path}'
report['websiteCharacterSourcesUnchanged'] = True
(OUT / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
