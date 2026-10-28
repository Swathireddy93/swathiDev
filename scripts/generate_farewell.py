"""Create the original cartoon-style farewell using cached, local Kokoro voice models.

Optional authoring tools only: kokoro-onnx, numpy, soundfile and FFmpeg/rubberband.
No model downloads, paid APIs or application dependencies are introduced.
"""
import argparse
from pathlib import Path
import subprocess
import tempfile

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--models', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('public/audio/character-bye.wav'))
    args = parser.parse_args()
    model = Kokoro(str(args.models / 'kokoro-v1.0.onnx'), str(args.models / 'voices-v1.0.bin'))
    # A cheerful spoken word, a 3.4-semitone lift and a light eight-bit texture
    # produce a pixel-game voice while keeping the actual word intelligible.
    samples, rate = model.create('Bye!', voice='af_heart', speed=1.0, lang='en-us')
    with tempfile.TemporaryDirectory(prefix='portfolio-farewell-') as temporary:
        source, shaped = Path(temporary) / 'bye.wav', Path(temporary) / 'shaped.wav'
        sf.write(source, samples, rate)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-af',
                        'rubberband=tempo=0.95:pitch=1.22,highpass=f=140,lowpass=f=5800,acrusher=bits=8:mix=0.28,vibrato=f=6:d=0.015,afade=t=in:d=0.012',
                        '-ar', '24000', '-ac', '1', str(shaped)], check=True)
        audio, rate = sf.read(shaped)
    audio = audio * (.85 / max(float(np.max(np.abs(audio))), 1e-6))
    # Short tails avoid clicks and preserve the first wave as the sync point.
    fade = min(len(audio), round(rate * .025))
    audio[-fade:] *= np.linspace(1, 0, fade)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.output, audio, rate, subtype='PCM_16')
    print(f'{args.output}: {len(audio) / rate:.3f}s, mono {rate}Hz; Heart voice, +3.4 semitones, light eight-bit texture')


if __name__ == '__main__':
    main()
