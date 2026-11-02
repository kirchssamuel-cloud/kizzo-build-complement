"""Synthesised soundtrack for the reel: 120 BPM, A minor, every hit placed on the film's beat map.

Everything is generated from oscillators and filtered noise, so there is no licence attached to any sample.
Usage: python3 make_audio.py out.wav
"""
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 16.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)

dry = np.zeros((N, 2))
send = np.zeros((N, 2))  # reverb send


def place(sig, t0, gain=1.0, pan=0.0, rev=0.0):
    i0 = int(round(t0 * SR))
    if i0 >= N:
        return
    sig = sig[: N - max(i0, 0)]
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    seg = np.stack([sig * l, sig * r], axis=1) * gain
    dry[i0 : i0 + len(sig)] += seg
    if rev:
        send[i0 : i0 + len(sig)] += seg * rev


def tt(d):
    return np.arange(int(d * SR)) / SR


def filt(x, kind, f):
    sos = butter(2, f, btype=kind, fs=SR, output='sos')
    return sosfilt(sos, x)


def noise(d):
    return rng.standard_normal(int(d * SR))


# ---------- instruments ----------
def kick(gain=1.0):
    t = tt(0.45)
    f = 45 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.22)
    click = filt(noise(0.45), 'highpass', 3000) * np.exp(-t / 0.004) * 0.3
    return np.tanh((body + click) * 1.6) * gain


def clap():
    t = tt(0.35)
    n = filt(filt(noise(0.35), 'highpass', 900), 'lowpass', 5000)
    env = np.zeros_like(t)
    for k, o in enumerate([0, 0.011, 0.022]):
        env += (t >= o) * np.exp(-np.maximum(t - o, 0) / (0.012 if k < 2 else 0.11))
    return n * env * 0.5


def hat(open_=False):
    d = 0.25 if open_ else 0.06
    t = tt(d)
    return filt(noise(d), 'highpass', 7000) * np.exp(-t / (0.08 if open_ else 0.014)) * 0.35


def snare():
    t = tt(0.2)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    n = filt(noise(0.2), 'highpass', 1500) * np.exp(-t / 0.06)
    return (tone * 0.5 + n) * 0.45


def saw(f, t):
    return 2 * ((f * t) % 1) - 1


def bass(f, d):
    t = tt(d)
    s = saw(f, t) * 0.6 + np.sin(2 * np.pi * f * t)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.18)
    return filt(s, 'lowpass', 260) * env * 0.55


def pluck(freqs, d=0.45):
    t = tt(d)
    s = sum(saw(f * (1 + dt), t) for f in freqs for dt in (-0.004, 0.004))
    return filt(s, 'lowpass', 2400) * np.exp(-t / 0.12) * 0.07


def pad(freqs, d, cutoff):
    t = tt(d)
    s = sum(saw(f * (1 + dt), t) for f in freqs for dt in (-0.006, 0, 0.006))
    return filt(s, 'lowpass', cutoff) * 0.035


def whoosh(d, lo, hi, gain=0.5):
    t = tt(d)
    n = noise(d)
    bands = [filt(filt(n, 'highpass', f * 0.7), 'lowpass', f * 1.4) for f in np.geomspace(lo, hi, 6)]
    pos = t / d * (len(bands) - 1)
    out = np.zeros_like(t)
    for k, b in enumerate(bands):
        out += b * np.clip(1 - np.abs(pos - k), 0, 1)
    env = np.sin(np.pi * t / d) ** 2
    return out * env * gain


def riser(d):
    t = tt(d)
    f = 180 * (12 ** (t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15
    n = filt(noise(d), 'highpass', 1200) * 0.4
    return (tone + n) * (t / d) ** 2.2


def boom(d=1.6):
    t = tt(d)
    f = 34 + 70 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    crash = filt(noise(d), 'highpass', 400) * np.exp(-t / 0.45) * 0.35
    return np.tanh((sub * 1.4 + crash) * 1.3)


def bell(freqs, d=1.8, decay=0.6):
    t = tt(d)
    return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (decay * (440 / f) ** 0.3)) for f in freqs) * 0.08


def tick():
    t = tt(0.03)
    return np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.004) * 0.4


def bloop(f0, f1, d=0.18):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.06) * np.minimum(1, t / 0.003) * 0.35


def thock(f=95):
    t = tt(0.3)
    return np.sin(2 * np.pi * f * t * (1 + 0.4 * np.exp(-t / 0.02))) * np.exp(-t / 0.09) * 0.6


# ---------- arrangement (seconds, beat = 0.5 s) ----------
A = [110, 164.81, 220, 261.63, 329.63, 493.88]
F = [87.31, 130.81, 174.61, 220, 261.63, 392.0]
C = [130.81, 196.0, 261.63, 329.63, 392.0, 493.88]
G = [98.0, 146.83, 196.0, 246.94, 293.66, 440.0]
BARS = [A, F, C, G]
ROOTS = [55.0, 43.65, 65.41, 49.0]

# Intro: spark, swelling pad, dive
place(bell([1760, 2637, 3520, 5274], 2.0, 0.5), 0.04, 0.9, 0, 0.6)
place(filt(noise(0.5), 'highpass', 5000) * np.exp(-tt(0.5) / 0.06) * 0.3, 0.04, 1, 0, 0.5)
for k, cut in enumerate([500, 900, 1600, 2600]):
    place(pad(BARS[0], 1.05, cut) * np.minimum(1, tt(1.05) / 0.3), k * 0.5, 0.9 + k * 0.15, 0, 0.5)
place(kick(0.55), 0.5)
place(whoosh(0.7, 300, 6000, 0.55), 1.4, 1, 0, 0.3)
place(kick(1.0), 2.0)
place(boom(0.8) * 0.5, 2.0)

# Words: kick per beat, swish on every strip cut, snare roll + riser into the drop
for b in range(4, 8):
    place(kick(0.9), b * BEAT)
    place(whoosh(0.22, 1500, 9000, 0.35), b * BEAT - 0.04, 1, -0.4 if b % 2 else 0.4)
    place(tick(), b * BEAT + 0.05, 0.8)
for e in range(16):
    place(hat(), 2.0 + e * 0.125, 0.7 if e % 2 else 0.4, 0.3)
rolls = list(np.arange(3.0, 3.5, 0.125)) + list(np.arange(3.5, 3.92, 0.0625))
for k, r in enumerate(rolls):
    place(snare(), r, 0.35 + 0.6 * k / len(rolls), 0, 0.2)
place(riser(1.4), 2.52, 0.9, 0, 0.3)

# DROP + groove (4–10 s and 12–13.75 s), breakdown on the fluid section
place(boom(), 4.0, 1.1, 0, 0.5)
place(pad(A, 2.0, 3000) * np.exp(-tt(2.0) / 0.8), 4.0, 1.2, 0, 0.6)


def groove(t0, t1, with_kick=True):
    b = t0
    while b < t1 - 1e-6:
        k = int(round(b / BEAT))
        if with_kick:
            place(kick(1.0), b)
        if k % 2 == 1:
            place(clap(), b, 0.8, 0, 0.35)
        place(hat(True), b + 0.25, 0.22, 0.25)
        for s in range(4):
            if b + s * 0.125 < t1:
                place(hat(), b + s * 0.125, 0.15 + 0.15 * (s == 2), -0.25)
        bar = int(b // 2) % 4
        for e in range(2):
            ts = b + e * 0.25
            if ts < t1:
                f = ROOTS[bar] * (2 if (k * 2 + e) % 4 == 2 else 1)
                place(bass(f, 0.24), ts, 1.0)
        place(pluck(BARS[bar][2:], 0.4), b + 0.25, 1.0, 0.2 if k % 2 else -0.2, 0.5)
        b += BEAT


groove(4.0, 10.0)
groove(10.0, 11.0, with_kick=False)
groove(12.0, 13.75)

# Geometry morphs, 3D tilt, block beats
for tb in (5.0, 5.5):
    place(bloop(700, 1400, 0.12), tb, 0.6, 0, 0.3)
place(whoosh(0.8, 120, 1500, 0.6), 5.75, 1, 0, 0.3)
for tb in (6.0, 6.5, 7.0, 7.5):
    place(thock(90), tb, 0.9, 0, 0.2)

# Shatter → particles → ring
for _ in range(70):
    place(bell([rng.uniform(2200, 6500)], 0.4, 0.06) * 0.8, 8.0 + rng.uniform(0, 0.45) ** 1.6, rng.uniform(0.3, 0.9), rng.uniform(-0.9, 0.9), 0.4)
place(whoosh(1.2, 400, 8000, 0.5), 7.95, 1, 0, 0.4)
place(whoosh(1.0, 2000, 300, 0.4), 8.9, 1, 0, 0.4)
place(bell([880, 1318.5, 1760, 2637], 1.5, 0.5), 9.85, 0.8, 0, 0.7)

# Fluid breakdown: bloops as blobs form, roll back into the groove
for k, tb in enumerate([10.02, 10.08, 10.14, 10.2, 10.26, 10.32, 10.38]):
    place(bloop(380 + 60 * k, 900 + 80 * k, 0.16), tb, 0.5, -0.6 + 0.2 * k, 0.4)
place(pad(F, 2.0, 1400) * np.sin(np.pi * tt(2.0) / 2.0), 10.0, 1.3, 0, 0.7)
for k, r in enumerate(np.arange(11.0, 11.95, 0.0625)):
    place(snare(), r, 0.2 + 0.5 * k / 15, 0, 0.2)
for k, tb in enumerate([11.4, 11.55, 11.7, 11.82, 11.92]):
    place(bloop(900 - 80 * k, 260, 0.2), tb, 0.55, 0.3 - 0.15 * k, 0.4)
place(riser(0.9), 11.05, 0.7, 0, 0.3)

# Mask: open, two shockwaves, collapse into the dot
place(boom(1.2) * 0.7, 12.0, 1, 0, 0.5)
for tb in (13.0, 13.5):
    place(thock(60), tb, 1.0, 0, 0.3)
    place(whoosh(0.5, 300, 4000, 0.35), tb - 0.05, 1, 0, 0.3)
place(riser(0.4), 13.55, 0.6)

# Final hit and ring-out
place(boom(2.0), 14.0, 1.0, 0, 0.6)
place(pad(A, 2.0, 2200) * np.exp(-tt(2.0) / 1.0), 14.0, 1.6, 0, 0.8)
place(bell([1760, 2637, 3520], 1.4, 0.45), 14.62, 0.9, 0.2, 0.8)
for k in range(9):
    place(tick() * 0.5, 14.0 + k * 0.03, 0.6, -0.8 + 0.2 * k)

# ---------- reverb + master ----------
ir_t = tt(2.2)
ir = np.stack([rng.standard_normal(len(ir_t)), rng.standard_normal(len(ir_t))], 1) * np.exp(-ir_t / 0.55)[:, None]
ir[:, 0] = filt(ir[:, 0], 'lowpass', 6000)
ir[:, 1] = filt(ir[:, 1], 'lowpass', 6000)
ir /= np.sqrt((ir**2).sum(0))
wet = np.stack([fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], 1)
mix = dry + wet * 0.55
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
fade = np.ones(N)
fade[-int(0.35 * SR) :] = np.linspace(1, 0, int(0.35 * SR)) ** 2
mix *= fade[:, None] * 0.9
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print('ok', mix.shape)
