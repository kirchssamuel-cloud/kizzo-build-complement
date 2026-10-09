#!/usr/bin/env python3
"""Kizzo brand film — sound design layer.
Synthesised from scratch (no samples, no voice, no music track) and locked to cues.json,
so it stays in sync with the picture. Subtle by design: a voice-over sits on top in post."""
import json, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
Q = json.load(open(os.path.join(HERE, 'cues.json')))
SR = 48000
DUR = Q['duration']
N = int(DUR * SR) + 1
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
SEND = np.zeros(N)  # reverb send (mono)

def place(sig, t, gain=1.0, pan=0.0, rev=0.25):
    i = int(round(t * SR))
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0          # events that start before the first frame
    if len(sig) == 0: return
    sig = sig[: N - i] * gain
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gl * 1.414 * .7071
    R[i:i + len(sig)] += sig * gr * 1.414 * .7071
    SEND[i:i + len(sig)] += sig * rev

def tt(d): return np.arange(int(d * SR)) / SR
def mx(*a):
    out = np.zeros(max(len(x) for x in a))
    for x in a: out[:len(x)] += x
    return out
def env(d, a=0.005, decay=None, hold=0.0):
    x = tt(d); e = np.minimum(1, x / max(a, 1e-4))
    if decay: e *= np.exp(-np.maximum(0, x - a - hold) / decay)
    fade = np.minimum(1, (d - x) / 0.01); return e * fade
def sine(f, d, ph=0):
    x = tt(d); f = np.broadcast_to(f, x.shape) if np.ndim(f) else f
    if np.ndim(f): return np.sin(2 * np.pi * np.cumsum(f) / SR + ph)
    return np.sin(2 * np.pi * f * x + ph)
def onepole_lp(x, fc):
    fc = np.broadcast_to(np.asarray(fc, float), x.shape); y = np.empty_like(x); s = 0.0
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    for i in range(len(x)): s += a[i] * (x[i] - s); y[i] = s
    return y
def svf_bp(x, fc, q=2.0):
    fc = np.broadcast_to(np.asarray(fc, float), x.shape); y = np.empty_like(x); lp = bp = 0.0
    f = 2 * np.sin(np.pi * np.minimum(fc, SR / 6) / SR); qq = 1 / q
    for i in range(len(x)):
        hp = x[i] - lp - qq * bp; bp += f[i] * hp; lp += f[i] * bp; y[i] = bp
    return y
def noise(d): return rng.standard_normal(int(d * SR))
def bell(f, d, decay=0.9, partials=((1, 1), (2.0, .4), (3.01, .22), (4.2, .12), (5.43, .06))):
    out = np.zeros(int(d * SR))
    for k, (m, a) in enumerate(partials): out += a * sine(f * m, d) * env(d, .002, decay / (1 + k * .7))
    return out
def thump(f0=70, f1=38, d=.6, decay=.18):
    x = tt(d); f = f1 + (f0 - f1) * np.exp(-x / .05)
    return sine(f, d) * env(d, .002, decay)
def click(d=.012, fc=3000):
    n = noise(d) * env(d, .0005, .002); return svf_bp(n, fc, 1.2) * 3
def whoosh(d, f0, f1, q=1.6, curve=1.0):
    x = tt(d) / d; fc = f0 * (f1 / f0) ** (x ** curve)
    e = np.sin(np.pi * np.minimum(1, x)) ** 1.5
    return svf_bp(noise(d), fc, q) * e * .7
def pad(freqs, d, a=.5, rel=.8):
    out = np.zeros(int(d * SR)); x = tt(d)
    for k, f in enumerate(freqs):
        det = sum(sine(f * (1 + c * .0025), d, k + c) for c in (-1, 0, 1)) / 3
        out += det * (.6 + .4 * sine(.3 + k * .07, d))
    e = np.minimum(1, x / a) * np.minimum(1, np.maximum(0, d - x) / rel)
    return onepole_lp(out, 2200) * e / len(freqs)

a1, a2, a3, a4, a5 = Q['a1'], Q['a2'], Q['a3'], Q['a4'], Q['a5']
NOTE = lambda n: 440 * 2 ** ((n - 69) / 12)

# ---------------- ACT 1 ----------------
place(mx(thump(95, 36, 1.2, .4) * 1.3, click(.03, 4200) * 1.6, click(.04, 1600)), 0.0, .95, 0, .25)   # the hook lands on frame 1
place(whoosh(.35, 9000, 1200, 1.2, .5), 0.0, .35, 0, .3)
place(thump(110, 34, 1.0, .35), a1['burst'], .9)                             # birth of the world
place(whoosh(.8, 6000, 400, 1.2, .6), a1['burst'], .35, 0, .4)
rd = a1['freeze'] - a1['burst']                                              # riser, cut dead at zero
x = tt(rd) / rd
ris = svf_bp(noise(rd), 300 * (25 ** (x ** 1.6)), 3.0) * (x ** 1.8) * 1.2
ris += sine(180 * (6 ** (x ** 1.4)), rd) * (x ** 2.2) * .18
place(ris * np.minimum(1, (rd - tt(rd)) / .004), a1['burst'], .5, 0, .15)
for k, n in enumerate(['n2', 'n1']):                                         # 0:02 · 0:01 (0:03 sits on the hook hit)
    place(mx(click(.02, 2400 + k * 500), thump(160, 80, .25, .06) * .6), a1[n], .55, (k - 1) * .3)
place(click(.02, 3600) * 1.2, a1['n0'], .6)
f = a1['freeze']                                                             # ZERO: freeze + lock
place(thump(90, 30, 1.8, .55) * 1.4, f, 1.0, 0, .2)
place(mx(click(.03, 5200) * 1.5, click(.03, 1500)), f, .9)
place(bell(820, 2.2, 1.4, ((1, 1), (2.76, .5), (5.4, .25), (8.93, .12))), f, .26, 0, .7)
for i in range(70):                                                          # shatter into light
    ti = a1['shatter'] + (rng.random() ** 1.6) * .95
    place(bell(2500 + rng.random() * 5000, .25, .06) * (1 - (ti - a1['shatter'])), ti, .05, rng.uniform(-.9, .9), .6)
place(whoosh(1.0, 2000, 600, 1.0), a1['shatter'], .18, 0, .5)
for k, s in enumerate(['strain1', 'strain2']):                               # wanting more
    place(mx(thump(75, 50, .5, .12), whoosh(.3, 400, 1200, 2.0) * .3), a1[s] + .14, .5, .35 if k == 0 else -.4)
    place(bell(330 * (1 + k * .06), 1.0, .35, ((1, 1), (2.0, .3), (2.9, .15))), a1[s] + .16, .12, .3 if k == 0 else -.3, .4)
place(whoosh(.18, 9000, 900, 1.4), a1['slice'] - .02, .5, .6, .2)            # the slice
place(thump(90, 55, .4, .1) * .5, a1['every'], .4)
for w in range(3): place(mx(thump(80, 42, .5, .14), click(.02, 1800) * .5), a1['battle'] + w * .1, .7, (w - 1) * .3)
td = a1['snap'] - a1['tension']; x = tt(td) / td                             # tension rises
ten = sum(sine(110 * h * (1 + x * .03), td) / h for h in range(1, 7)) * (x ** 2) * (1 + .5 * sine(6 + x * 14, td))
place(onepole_lp(ten, 900 + 2500 * x) * .25, a1['tension'], .55, 0, .2)
place(svf_bp(noise(td), 2500 + 3000 * x, 4) * (x ** 3) * .5, a1['tension'], .3)
place(mx(click(.04, 6000) * 2, click(.04, 2000), thump(120, 50, .5, .12)), a1['snap'], .8)   # snap
place(whoosh(.32, 5000, 300, 1.0, .8), a1['snap'], .6, -.4, .2)

# ---------------- ACT 2 ----------------
FA = a2['start'] - .2
def flowF(t):
    Lh = a2['stop'] - FA; x = min(max(t, FA), a2['stop']) - FA
    return .5 * x + 5.6 * Lh * (x / Lh) ** 3.4 / 3.4
def stutterT(t):
    if t < a2['peak']: return t
    tt_ = min(t, a2['stop'] - 1e-4); k = tt_ - a2['peak']; n = int(k // .11)
    return a2['peak'] + n * .05 + (k - n * .11)
ld = a2['stop'] - a2['start']; x = tt(ld) / ld                                 # the loop drone
drone = sum(sine(55 * h * (1 + x * .5), ld) / h for h in (1, 2, 3, 4)) * (.25 + .75 * x ** 1.5)
drone = onepole_lp(drone, 300 + 2600 * x ** 2)
tl = a2['start'] + tt(ld)
gate = np.ones(len(tl)); st = tl >= a2['peak']
gate[st] = (((tl[st] - a2['peak']) % .11) < .075).astype(float) * .9 + .1  # the stutter
place(drone * gate * np.minimum(1, (ld - tt(ld)) / .003), a2['start'], .32, 0, .15)
prev = None
for t in np.arange(a2['start'], a2['stop'], 1 / 400):                          # pulses = pace of the loop
    v = int(flowF(stutterT(t)) * 1.6 * 6 / (2 * np.pi))
    if prev is not None and v != prev:
        place(mx(click(.015, 1800) * .8, thump(140, 90, .12, .03) * .4), t, .32 * (.5 + .5 * (t - a2['start']) / ld), np.sin(v * 1.7) * .5, .1)
    prev = v
for i in range(16):                                                           # notifications
    ti = a2['start'] + .3 + (i / 16) ** .7 * (a2['stop'] - a2['start'] - .5)
    b = bell(1320, .18, .05, ((1, 1), (2, .2))) ; b2 = bell(1760, .2, .06, ((1, 1), (2, .2)))
    sig = mx(b, np.concatenate([np.zeros(int(.07 * SR)), b2]))
    place(sig, ti, .07, rng.uniform(-.8, .8), .3)
for i in range(10): place(click(.01, 4000 + i * 300) * 1.4, a2['peak'] + .02 + i * .055, .25, rng.uniform(-.6, .6))   # glitch
# STOP — the hard cut is the silence itself. Then the embrace:
place(whoosh(.7, 300, 1400, 1.2), a2['arc'] - .05, .3, -.3, .5)
place(pad([NOTE(57), NOTE(61), NOTE(64), NOTE(71)], 2.4, .45, 1.0), a2['arc'], .5, 0, .6)

# ---------------- ACT 3 ----------------
# the feed gathers into a page; the tablet wakes; the phone comes in
place(whoosh(.9, 2600, 600, 1.1, .8), a3['sheet'], .26, -.2, .4)
place(svf_bp(noise(.18), 3200, .8) * env(.18, .002, .05), a3['sheet'] + .75, .22, -.3, .3)          # paper lands
rd = .5; x = tt(rd) / rd
place(sine(520 * 1.5 ** x, rd) * np.sin(np.pi * x) * .5, a3['sheet'] + .2, .12, .6, .6)          # the tablet wakes
place(whoosh(.6, 400, 1800, 1.4), a3['phone'] - .45, .3, -.7, .3)                                  # the phone slides in
place(mx(click(.012, 2400) * .8, thump(220, 140, .08, .02) * .3), a3['tap'], .3, -.3, .2)        # tap: "create a quiz from a photo"
for dt in (-.13, 0): place(sine(2100, .05) * env(.05, .002, .02), a3['lock'] + dt, .16, -.3, .2)   # focus beeps
sd = a3['shot'] - a3['scan']; x = tt(sd) / sd                                                       # the scan sweep
place(svf_bp(noise(sd), 800 * 4 ** x, 3) * np.sin(np.pi * x) * .9 + sine(180, sd) * np.sin(np.pi * x) * .15, a3['scan'], .28, -.3, .3)
place(mx(click(.03, 5200) * 1.4, click(.05, 1400), svf_bp(noise(.12), 2500, .7) * env(.12, .002, .04)), a3['shot'], .45, -.3, .3)  # shutter
pd = a3['send'] - a3['detected']; x = tt(pd) / pd                                                   # Kizzo reads the lesson
place(sine(330 * 2 ** (x * 1.2), pd) * np.sin(np.pi * x) * .25 + svf_bp(noise(pd), 1500 + 2500 * x, 5) * .4, a3['detected'], .18, -.3, .4)
for i, f in enumerate((.3, .68, .99)):                                                               # checklist ticks
    place(bell(NOTE(81 + i * 4), .6, .25, ((1, 1), (2, .25))), a3['detected'] + .05 + f * (pd - .07), .1, -.3, .5)
for k in range(3):                                                                                 # three questions fly across
    t0 = a3['send'] + k * .12
    place(whoosh(.7, 900, 4200, 2.2, 1.3) * .8, t0, .26, -.4 + k * .1, .3)
    place(mx(thump(320, 160, .15, .04) * .5, bell(NOTE(88 + k * 3), .5, .25, ((1, 1), (2, .3)))), t0 + .78, .16, .6, .5)
place(whoosh(.95, 200, 2600, 1.2, 1.5), a3['dive'], .4, 0, .4)                                     # the dive into the screen
rd = .9; place(sine(48, rd) * np.sin(np.pi * tt(rd) / rd) ** 2, a3['dive'], .35, 0, .1)
place(thump(90, 45, .5, .14) * .6, a3['diveEnd'], .5, 0, .3)
rd = .6; x = tt(rd) / rd
place(sine(420 * 2 ** x, rd) * np.sin(np.pi * x) * .4, a3['ring'], .14, .6, .6)                   # the ring draws (on the tablet)
for k, (tq, n) in enumerate(zip(a3['q'], [76, 80, 83])):                     # three answers: E5, G#5, B5
    place(whoosh(.28, 600, 3500, 2.5, 1.5) * .6, tq - .28, .3, (k - 1) * .5, .3)
    place(bell(NOTE(n), 1.8, .9), tq, .26, (0, .45, -.45)[k], .55)
    place(thump(100, 60, .3, .07) * .4, tq, .4)
c = a3['close']                                                              # the circle closes
place(pad([NOTE(n) for n in (57, 64, 69, 73, 76)], 3.0, .02, 1.6) * 1.3, c, .55, 0, .7)
for n in (69, 73, 76, 81): place(bell(NOTE(n), 2.4, 1.2), c + (n - 69) * .004, .1, 0, .7)
place(thump(70, 36, 1.2, .35), c, .7)
cd = .9; x = tt(cd) / cd
place(whoosh(cd, 1200, 4000, 2.0) * 1.2, c, .25, 0, .4)

# ---------------- ACT 4 ----------------
place(whoosh(.55, 400, 2500, 1.6, 1.2), a4['combine'], .3, 0, .3)
place(mx(click(.03, 2400) * 1.4, click(.02, 6000), thump(110, 60, .35, .08)), a4['lock'], .7, 0, .3)
place(thump(60, 28, 1.6, .5), a4['expand'], .8, 0, .3)
place(whoosh(.9, 3000, 300, 1.0), a4['expand'], .25, 0, .5)
prev = 0
for t in np.arange(a4['tick0'], a4['tick1'] + .01, 1 / 400):                  # fifteen minutes, tick by tick
    p = min(max((t - a4['tick0']) / (a4['tick1'] - a4['tick0']), 0), 1)
    v = int(15 * (-(np.cos(np.pi * p) - 1) / 2) + 1e-6)
    if v > prev:
        place(mx(click(.012, 3200 + v * 60) * .9, bell(NOTE(81), .12, .03, ((1, 1),)) * .2), t, .35, -.3 + v / 15 * .6, .2)
        prev = v
e = a4['earned']                                                             # +15
place(thump(80, 32, 1.6, .5) * 1.2, e, .9, 0, .3)
for n in (69, 73, 76, 80, 83): place(bell(NOTE(n), 2.6, 1.4), e + (n - 69) * .003, .09, 0, .7)
place(pad([NOTE(n) for n in (45, 57, 64, 69, 71)], 4.2, .05, 2.0), e, .45, 0, .6)
place(pad([NOTE(n) for n in (50, 62, 66, 69, 74)], 3.6, .9, 1.4), a4['harmony'] + .2, .3, 0, .6)    # harmony

# ---------------- ACT 5 ----------------
place(whoosh(.9, 600, 2400, 1.4), a5['tagline'] - .1, .14, 0, .5)
place(whoosh(1.0, 300, 2000, 1.2, 1.3), a5['converge'], .22, 0, .4)
place(whoosh(.62, 900, 3200, 1.8), a5['body'], .2, -.3, .4)
for i in range(12): place(bell(4000 + i * 260, .3, .1, ((1, 1),)), a5['word'] + i * .045, .035, -.6 + i * .1, .7)
res = a5['word'] + .55                                                       # the mark resolves
place(pad([NOTE(n) for n in (45, 52, 57, 61, 64, 69)], 3.6, .03, 2.0) * 1.2, res, .55, 0, .7)
for n in (57, 64, 69, 73): place(bell(NOTE(n), 3.2, 1.6), res + (n - 57) * .004, .11, 0, .7)
place(thump(65, 34, 1.4, .45), res, .6, 0, .3)
place(mx(click(.02, 1800) * 1.2, bell(NOTE(84), .4, .12) * .4), a5['cta'] + .05, .3, 0, .4)
for i in range(9): place(bell(5200 + i * 380, .35, .1, ((1, 1),)), a5['glint'] + .1 + i * .06, .03, -.7 + i * .17, .8)

# ---------------- master ----------------
ir_d = 1.8; ir = rng.standard_normal(int(ir_d * SR)) * np.exp(-tt(ir_d) / .45)
ir = onepole_lp(ir, 4500); ir /= np.sqrt((ir ** 2).sum())
nfft = 1 << int(np.ceil(np.log2(N + len(ir))))
wet = np.fft.irfft(np.fft.rfft(SEND, nfft) * np.fft.rfft(ir, nfft), nfft)[:N] * .55
dl = int(.013 * SR)
L += wet; R[dl:] += wet[:-dl]
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
fade = np.ones(N); fl = int(.6 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2
mix *= fade[:, None]
mix *= 10 ** (-3 / 20) / np.abs(mix).max()
def write(name, sig):
    out = os.path.join(HERE, 'build', name); os.makedirs(os.path.dirname(out), exist_ok=True)
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((sig * 32767).astype('<i2').tobytes())
    print('wrote', out)
write('kizzo-sfx-stem.wav', mix)                      # clean stem for a mixing engineer
# master: the bed dips 4 dB under each voice-over line, so a voice dropped on top sits clearly
duck = np.zeros(N); ramp = int(.12 * SR)
for v in Q['vo']:
    i0, i1 = int((v['t'] - .1) * SR), int((v['t'] + v['d'] + .15) * SR); duck[max(0, i0):min(N, i1)] = 1
k = np.ones(ramp) / ramp; duck = np.convolve(duck, k, mode='same')
write('kizzo-sfx.wav', mix * (1 - .37 * duck)[:, None])
