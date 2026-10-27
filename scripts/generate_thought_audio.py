"""Original warm typewriter key and soft airy thought-cloud swoosh."""
import math
from pathlib import Path
import random
import struct
import wave

RATE = 22050
ROOT = Path(__file__).resolve().parents[1] / 'public/audio'


def write(name, samples, peak):
    scale = peak * 32767 / max(abs(value) for value in samples)
    with wave.open(str(ROOT / name), 'wb') as audio:
        audio.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        audio.writeframes(b''.join(struct.pack('<h', round(value * scale)) for value in samples))
    print(f'{name}: {(ROOT / name).stat().st_size} bytes')


key_rng = random.Random(2026)
taps = []
key_low = 0
for index in range(round(RATE * .075)):
    t = index / RATE
    noise = key_rng.uniform(-1, 1)
    # A rounded hammer strike with damped wooden body, rather than a high beep.
    key_low += (noise - key_low) * .32
    envelope = (1 - math.exp(-t * 1800)) * math.exp(-t * 125)
    body = .18 * math.sin(2 * math.pi * 220 * t) + .1 * math.sin(2 * math.pi * 520 * t)
    strike = (.75 * key_low + body) * envelope
    # The quieter spring return gives each key its mechanical two-part click.
    release = 0
    if t >= .023:
        age = t - .023
        release = (.2 * key_low + .05 * math.sin(2 * math.pi * 680 * age)) * (1 - math.exp(-age * 2000)) * math.exp(-age * 150)
    taps.append(strike + release)
write('thought-type.wav', taps, .34)

# Preserve the existing swoosh's seeded noise sequence byte for byte.
rng = random.Random(2018)
for _ in range(round(RATE * .028)):
    rng.uniform(-1, 1)
air = []
low = 0
for index in range(round(RATE * .5)):
    t = index / RATE
    noise = rng.uniform(-1, 1)
    low += (noise - low) * (.08 + .22 * t / .5)
    envelope = math.sin(math.pi * t / .5) ** 1.6
    air.append(low * envelope)
write('thought-swoosh.wav', air, .48)
