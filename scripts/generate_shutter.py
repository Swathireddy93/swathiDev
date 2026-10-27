"""Generate the portfolio's original short, double-curtain camera shutter cue."""
import math
from pathlib import Path
import random
import struct
import wave

rate = 22050
rng = random.Random(2026)
samples = []
previous = 0.0
for index in range(int(rate * .18)):
    t = index / rate
    noise = rng.uniform(-1, 1)
    click = noise - .65 * previous
    previous = noise
    envelope = math.exp(-t * 150)
    if t >= .065:
        envelope += .7 * math.exp(-(t - .065) * 110)
    samples.append(click * envelope + .08 * math.sin(2 * math.pi * 1400 * t) * math.exp(-t * 45))
peak = max(abs(value) for value in samples)
output = Path(__file__).resolve().parents[1] / 'public/audio/camera-shutter.wav'
with wave.open(str(output), 'wb') as audio:
    audio.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    audio.writeframes(b''.join(struct.pack('<h', round(value / peak * .55 * 32767)) for value in samples))
print(f'{output.name}: {output.stat().st_size} bytes')
