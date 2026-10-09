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

h, b, a3, d, e, fq, g, a5 = (Q[k] for k in ('h', 'b', 'a3', 'd', 'e', 'f', 'g', 'a5'))
NOTE = lambda n: 440 * 2 ** ((n - 69) / 12)

# ---------------- HOOK: the feed races, the padlock slams ----------------
sl = h['slam']
for k, ts in enumerate(h['swipes']):                                         # a kick and a swipe on every new video
    place(mx(thump(150, 48, .45, .11) * 1.1, click(.01, 5200) * .5), ts, .75, 0, .1)
    place(whoosh(.2, 2800, 700, 1.6), ts, .3, (-1) ** k * .35, .12)
for k in range(int(sl / .085)):                                               # hats, getting busier
    tk = k * .085
    if tk < sl - .02: place(svf_bp(noise(.03), 9000, 2) * env(.03, .001, .012), tk, .1 + .12 * tk / sl, (-1) ** k * .4, .05)
for k, (tw, n) in enumerate(zip(h['w'], (57, 60, 64))):                       # 1 video · then 10 · then 50…
    place(mx(thump(120, 55, .4, .1), click(.02, 3000)), tw, .6, 0, .15)
    st = sum(sine(NOTE(n) * m, .32) * a_ for m, a_ in ((1, 1), (2, .5), (3, .25))) * env(.32, .004, .09)
    place(onepole_lp(st, 3200), tw, .22, 0, .25)
x = tt(sl) / sl                                                               # a riser, cut dead by the padlock
place(svf_bp(noise(sl), 500 * 14 ** (x ** 1.5), 3.0) * x ** 1.6 * 1.1 * np.minimum(1, (sl - tt(sl)) / .004), 0.0, .4, 0, .1)
place(thump(80, 26, 2.2, .7) * 1.5, sl, 1.0, 0, .3)                            # SLAM
place(mx(click(.03, 2400) * 1.8, click(.02, 6400), click(.05, 900)), sl, .85, 0, .35)
place(bell(150, 2.2, 1.2, ((1, 1), (2.76, .5), (5.4, .25), (8.93, .1))), sl + .01, .3, 0, .7)
place(whoosh(.5, 6000, 200, 1.0, .7), sl - .12, .4, 0, .3)
place(whoosh(.35, 900, 2600, 1.6), h['card'], .1, 0, .3)
place(pad([NOTE(n) for n in (38, 45, 50)], h['pull'] - sl + .4, .3, .3), sl + .15, .18, 0, .5)
place(whoosh(1.0, 1400, 300, 1.1), h['pull'], .22, 0, .4)                      # pull back
rw = h['rewindEnd'] - h['rewind']; x = tt(rw) / rw                            # rewind
wob = 1 + .35 * np.sin(2 * np.pi * 38 * tt(rw))
place(svf_bp(noise(rw), 1800 * wob * (1 + 1.5 * x), 5) * np.sin(np.pi * x) * 1.2 + sine(900 * 2 ** (-1.5 * x), rw) * np.sin(np.pi * x) * .15, h['rewind'], .3, 0, .2)
place(mx(click(.015, 2000), thump(200, 120, .1, .03) * .4), h['rewindEnd'], .35, 0, .2)
place(bell(NOTE(76), 1.0, .4, ((1, 1), (2, .3))), h['rewindEnd'] + .05, .12, .4, .5)          # Ben's home

# ---------------- INSTALL: the parent's phone arrives, a link runs to the tablet ----------------
place(whoosh(.6, 300, 1700, 1.3), b['devices'] - .3, .22, -.5, .35)
place(mx(bell(NOTE(69), 1.3, .5, ((1, 1), (2, .3), (3.01, .1))), thump(NOTE(33), NOTE(31), .4, .1) * .5), b['devices'] + .1, .14, -.55, .5)
ld = b['linked'] - b['link']; x = tt(ld) / ld
place(sine(520 * 2 ** (x * 1.4), ld) * np.sin(np.pi * x) * .25 + svf_bp(noise(ld), 1000 * 4 ** x, 6) * .5, b['link'], .16, 0, .45)
for i, n in enumerate((76, 81)): place(bell(NOTE(n), 1.0, .4, ((1, 1), (2, .25))), b['linked'] + i * .09, .12, .3, .5)
place(pad([NOTE(n) for n in (45, 52, 57, 64, 71)], e['lock'] - b['devices'], 1.2, .05), b['devices'], .16, 0, .5)  # a quiet bed, cut by the lock

# ---------------- SCAN ----------------
place(whoosh(.6, 2400, 500, 1.1, .8), a3['sheet'], .24, -.3, .35)
place(svf_bp(noise(.18), 3200, .8) * env(.18, .002, .05), a3['sheet'] + .45, .22, -.3, .3)          # the page lands
place(mx(click(.012, 2400) * .8, thump(220, 140, .08, .02) * .3), a3['tap'], .3, -.4, .2)          # "create a quiz from a photo"
for dt in (-.13, 0): place(sine(2100, .05) * env(.05, .002, .02), a3['lock'] + dt, .16, -.4, .2)    # focus beeps
sd = a3['shot'] - a3['scan']; x = tt(sd) / sd                                                        # the scan sweep
place(svf_bp(noise(sd), 800 * 4 ** x, 3) * np.sin(np.pi * x) * .9 + sine(180, sd) * np.sin(np.pi * x) * .15, a3['scan'], .28, -.4, .3)
place(mx(click(.03, 5200) * 1.4, click(.05, 1400), svf_bp(noise(.12), 2500, .7) * env(.12, .002, .04)), a3['shot'], .45, -.4, .3)
pd = a3['send'] - a3['detected']; x = tt(pd) / pd                                                    # Kizzo reads the lesson
place(sine(330 * 2 ** (x * 1.2), pd) * np.sin(np.pi * x) * .25 + svf_bp(noise(pd), 1500 + 2500 * x, 5) * .4, a3['detected'], .18, -.4, .4)
for i, fr in enumerate((.3, .68, .99)):
    place(bell(NOTE(81 + i * 4), .6, .25, ((1, 1), (2, .25))), a3['detected'] + .05 + fr * (pd - .07), .1, -.4, .5)
for k in range(3):                                                                                  # three questions fly to the tablet
    t0 = a3['send'] + k * .12
    place(whoosh(.7, 900, 4200, 2.2, 1.3) * .8, t0, .24, -.3 + k * .15, .3)
    place(mx(thump(320, 160, .15, .04) * .5, bell(NOTE(88 + k * 3), .5, .25, ((1, 1), (2, .3)))), t0 + .78, .16, .5, .5)
place(whoosh(.5, 1800, 400, 1.2), a3['sheetOut'], .14, -.4, .3)

# ---------------- RULE: a quiz every 20 min ----------------
place(whoosh(.75, 250, 1100, 1.1), d['push'], .2, -.2, .35)
place(whoosh(.3, 3000, 1200, 1.5), d['screen'], .12, -.2, .2)
place(mx(click(.012, 3000), click(.012, 1800) * .7), d['toggle'], .32, -.2, .15)                  # the switch
place(bell(NOTE(84), .25, .08, ((1, 1),)), d['toggle'] + .05, .08, -.2, .3)
place(mx(click(.012, 2600), thump(260, 160, .08, .02) * .3), d['pick'], .32, -.2, .2)              # 20 min
place(mx(whoosh(.4, 600, 3000, 2.0, .7), sine(NOTE(76) * 2 ** (tt(.18) / .18), .18) * env(.18, .005, .08) * .4), d['pick'] + .1, .22, .1, .4)  # the chip lifts off
place(mx(click(.012, 2600), thump(260, 160, .08, .02) * .3), d['qs'], .3, -.2, .2)                 # 3 questions
place(mx(click(.012, 2200), thump(200, 120, .1, .03) * .4), d['save'], .34, -.2, .2)               # save
for i, n in enumerate((76, 83)): place(bell(NOTE(n), .8, .3, ((1, 1), (2, .2))), d['save'] + .06 + i * .08, .1, -.2, .4)
td = d['tokenEnd'] - d['token']; x = tt(td) / td                                                   # 20 min flies to the tablet, becomes 20:00
place(whoosh(td, 500, 3800, 2.0, 1.2) * 1.1, d['token'], .3, 0, .35)
place(mx(thump(240, 120, .2, .05) * .6, bell(NOTE(88), .9, .35, ((1, 1), (2, .3), (3.01, .1)))), d['tokenEnd'], .2, .5, .5)
place(mx(click(.012, 3000), thump(300, 200, .08, .02) * .3), d['tapVid'], .26, .4, .2)             # the child opens videos
place(whoosh(.35, 1200, 400, 1.4), d['vid'], .16, .4, .2)

# ---------------- THE CHILD'S SCREEN: 20 minutes later, locked ----------------
place(whoosh(.85, 200, 2400, 1.2, 1.4), e['dive'], .3, 0, .4)
rd = .8; place(sine(50, rd) * np.sin(np.pi * tt(rd) / rd) ** 2, e['dive'], .3, 0, .1)
lp = e['zero'] - e['lapse']
swipes = [e['lapse'] + lp * .82 * (k / 6) ** .62 for k in range(1, 7)]
for k, ts in enumerate(swipes): place(whoosh(.16, 2500, 700, 1.6), ts, .12 + .02 * k, (-1) ** k * .3, .15)     # the feed scrolls faster
ticks = []; tcur = e['lapse']; step = .14                                                              # time races
while tcur < e['lapse'] + .72 * lp: ticks.append(tcur); tcur += step; step = max(.035, step * .86)
for i, ti in enumerate(ticks): place(click(.01, 3000 + 40 * i) * .7, ti, .2, .3, .05)
rr = .72 * lp; x = tt(rr) / rr
place(svf_bp(noise(rr), 400 * 12 ** x, 4) * x ** 1.5 * .8 + sine(220 * 2 ** (x * 1.5), rr) * x ** 2 * .12, e['lapse'], .3, 0, .2)
for j in range(1, 4):                                                                                 # 0:03 · 0:02 · 0:01 — the hook, answered
    place(mx(click(.02, 2400 + j * 400), thump(160, 80, .25, .06) * .6), e['lapse'] + lp * (.72 + .28 * (j - 1) / 3), .45, .2, .2)
lk = e['lock']                                                                                         # LOCK
place(thump(80, 30, 1.6, .5) * 1.4, lk, .95, 0, .25)
place(mx(click(.03, 2400) * 1.6, click(.02, 6000)), lk, .7, 0, .3)
place(bell(196, 1.6, .8, ((1, 1), (2.76, .45), (5.4, .2))), lk + .02, .2, 0, .6)
place(whoosh(.4, 1200, 3000, 1.6), e['card'], .1, 0, .3)
place(whoosh(.28, 700, 2600, 2.2), e['swipe'], .22, .3, .15)                                          # the swipe goes nowhere
for k in range(2): place(mx(sine(185, .1), sine(196, .1) * .8, sine(370, .1) * .25) * env(.1, .004, .04), e['deny'] + k * .13, .26, .3, .15)  # nope
place(mx(click(.012, 3000), thump(300, 180, .08, .02) * .3), e['go'], .3, 0, .2)

# ---------------- QUIZ ----------------
place(whoosh(.35, 500, 2600, 1.8), fq['start'], .2, 0, .3)
for i in (1, 2): place(whoosh(.3, 2000, 900, 1.6), fq['q'][i], .14, (-1) ** i * .3, .2)
for k, (tq, n) in enumerate(zip(fq['tap'], (76, 80, 83))):                                              # three right answers: E5, G#5, B5
    place(mx(click(.012, 3000), thump(260, 160, .08, .02) * .3), tq, .3, .2, .15)
    place(bell(NOTE(n), 1.5, .7), tq + .02, .24, (0, .4, -.4)[k], .5)
    place(bell(NOTE(n + 12), .4, .15, ((1, 1),)), tq + .1, .08, .5, .4)                                # a notch fills
u = fq['unlock']                                                                                         # UNLOCK
place(mx(click(.02, 4800) * 1.4, click(.03, 2200)), u + .08, .5, 0, .3)                              # the shackle springs
place(thump(70, 34, 1.3, .4), u, .75, 0, .3)
place(pad([NOTE(n) for n in (57, 64, 69, 73, 76)], 3.4, .02, 1.8) * 1.2, u, .5, 0, .7)
for i, n in enumerate((76, 83)): place(bell(NOTE(n), 1.6, .8, ((1, 1), (2, .2), (3.01, .06))), u + .42 + i * .1, .16, 0, .5)   # a clean two-note confirmation
place(mx(thump(200, 120, .15, .04) * .5, bell(NOTE(88), .7, .3)), fq['plus'], .2, 0, .4)
place(whoosh(.45, 2400, 500, 1.3), fq['resume'], .2, 0, .3)
place(pad([NOTE(n) for n in (50, 57, 62, 66, 69)], 3.2, .8, 1.4), fq['resume'], .2, 0, .6)

# ---------------- PAYOFF: the parent is told ----------------
place(whoosh(.85, 1600, 300, 1.1), g['pull'], .18, 0, .4)
for i, n in enumerate((83, 88)): place(bell(NOTE(n), .9, .35, ((1, 1), (2, .2), (3.01, .08))), g['notif'] + i * .11, .16, -.4, .4)

# ---------------- BRAND ----------------
place(whoosh(.8, 2400, 600, 1.2), a5['out'], .14, 0, .5)
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
