"""Version finale : transitions fluides entre les parties, bruitages, musique plus basse.

Usage : python3 build_final.py <dossier_audio_scratch>
Entrées : montage/dvora-k-film-v2.mp4 (image), musique/musique-triste.mp4, musique/musique-entrainante.mp4
Sortie : montage/dvora-k-film-final-v2.mp4
"""
import os, subprocess, sys, wave
import numpy as np

M = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(M)
AUD = sys.argv[1]
os.makedirs(AUD, exist_ok=True)
SR = 48000
SRC = f"{M}/dvora-k-film-v2.mp4"
ENC = ["-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-r", "24"]


def run(args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def dur(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


# ---------- 1. Image : fondus au noir autour du carton, fondus enchaînés entre les parties ----------
T = dur(SRC)
cuts = [0, 11.875, 14.875, 20.542, 26.708, 35.833, 38.958, 42.375, T]
XF = 0.4
parts = []
for i in range(len(cuts) - 1):
    p = f"{AUD}/part{i}.mp4"
    a, b = cuts[i], cuts[i + 1]
    vf = "setpts=PTS-STARTPTS"
    if i == 0:
        vf += f",fade=t=out:st={b - a - 0.3:.3f}:d=0.3"
    if i == 2:
        vf += ",fade=t=in:st=0:d=0.35"
    run(["-ss", f"{a}", "-to", f"{b}", "-i", SRC, "-an", "-vf", vf, *ENC, p])
    parts.append(p)

lens = [dur(p) for p in parts]
inputs = sum([["-i", p] for p in parts], [])
fc = "".join(f"[{k}]settb=1/24,fps=24,format=yuv420p[n{k}];" for k in range(len(parts)))
fc += "[n0][n1][n2]concat=n=3:v=1:a=0,settb=1/24[c0];"
acc, label, offs = lens[0] + lens[1] + lens[2], "c0", []
for k in range(3, len(parts)):
    off = acc - XF
    offs.append(off)
    fc += f"[{label}][n{k}]xfade=transition=fade:duration={XF}:offset={off:.3f}[c{k}];"
    label = f"c{k}"
    acc = off + lens[k]
fc = fc.rstrip(";")
video = f"{AUD}/video.mp4"
run([*inputs, "-filter_complex", fc, "-map", f"[{label}]", *ENC, video])
TV = dur(video)

# nouvelle chronologie (secondes)
t_cr, t_tears, t_flash_in, t_flash_out, t_card = 4.0, 6.833, 8.2, 9.75, 11.875
t_mirror = 14.875
t_sofa = offs[0]                      # fondu lit -> canapé
t_insta = t_sofa + (22.458 - 20.542)
t_smile = t_sofa + (24.167 - 20.542)
t_street = offs[1]
t_facade = t_street + (29.875 - 26.708)
t_door = t_street + (32.875 - 26.708)
t_salon = offs[2]
t_pose = offs[3]
t_miroir = offs[4]
t_end = t_miroir + 3.4                # fondu vers le carton final (déjà dans la source)

# ---------- 2. Bruitages synthétisés ----------
N = int(TV * SR) + SR
sfx = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(7)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if sig.ndim == 1:
        sig = np.stack([sig * (1 - max(pan, 0)), sig * (1 + min(pan, 0))], 1)
    j = min(N, i + len(sig))
    if i < N:
        sfx[i:j] += sig[: j - i] * gain


def env(n, a, r):
    e = np.ones(n, np.float32)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for k in range(len(x)):
        s = (1 - a) * x[k] + a * s; y[k] = s
    return y


def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n).astype(np.float32)
    return y / (np.abs(y).max() + 1e-9)


def whoosh(d=0.6, lo=300, hi=6000, rise=True):
    n = int(d * SR)
    x = bandnoise(n, lo, hi)
    t = np.linspace(0, 1, n)
    shape = (np.sin(np.pi * t) ** 2) if not rise else t ** 2.2 * (1 - t ** 8)
    return (x * shape).astype(np.float32)


def thump(f=55, d=0.28):
    n = int(d * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t * (1 - 0.35 * t / d)) * np.exp(-t * 16)
    return (s + 0.3 * bandnoise(n, 40, 180) * np.exp(-t * 40)).astype(np.float32)


def heartbeat():
    a = thump(58); b = thump(50, 0.24) * 0.7
    out = np.zeros(int(0.5 * SR), np.float32)
    out[: len(a)] += a; out[int(0.16 * SR): int(0.16 * SR) + len(b)] += b
    return out


def hit(d=1.4):
    n = int(d * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * 42 * t) * np.exp(-t * 3.5)
    air = bandnoise(n, 2500, 12000) * np.exp(-t * 5) * 0.35
    return (sub * 0.9 + air).astype(np.float32)


def bell(f0=1318.5, d=1.8):
    n = int(d * SR); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * dk) for m, a, dk in [(1, 1, 2.2), (2.76, .4, 3.5), (5.4, .2, 5), (8.9, .1, 7)])
    return (s * env(n, 0.002, 0.3)).astype(np.float32)


def shimmer(d=1.6, base=1760):
    n = int(d * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for k, f in enumerate([base, base * 1.25, base * 1.5, base * 2, base * 2.5]):
        st = int(k * 0.07 * SR)
        tt = t[: n - st]
        s[st:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.5) * 0.25
    return (s * env(n, 0.01, 0.4)).astype(np.float32)


def click(d=0.035, hi=True):
    n = int(d * SR); t = np.arange(n) / SR
    x = bandnoise(n, 1800 if hi else 600, 9000) * np.exp(-t * 180)
    x += np.sin(2 * np.pi * 180 * t) * np.exp(-t * 90) * 0.4
    return x.astype(np.float32)


def rustle(d=0.7):
    n = int(d * SR)
    x = bandnoise(n, 1500, 8000)
    am = np.abs(lowpass(rng.standard_normal(n).astype(np.float32), 18))
    am /= am.max() + 1e-9
    return (x * am * env(n, 0.05, 0.2)).astype(np.float32)


def ambience(d, lo, hi, g):
    n = int(d * SR)
    return (bandnoise(n, lo, hi) * env(n, 0.6, 0.6) * g).astype(np.float32)


# Cabinet : papier, battements de cœur, flash
place(rustle(0.8), t_cr + 0.05, 0.22, -0.2)
beats = [6.95, 7.75, 8.45, 9.0, 9.5, 10.0, 10.65]
for k, bt in enumerate(beats):
    place(heartbeat(), bt, 0.55 + 0.05 * min(k, 4))
place(whoosh(0.45), t_flash_in - 0.45, 0.35)
place(hit(1.3), t_flash_in, 0.55)
n_ring = int((t_flash_out - t_flash_in) * SR)
ring = (np.sin(2 * np.pi * 3400 * np.arange(n_ring) / SR) * env(n_ring, 0.25, 0.3)).astype(np.float32)
place(ring, t_flash_in, 0.035)
place(whoosh(0.35, rise=False), t_flash_out - 0.2, 0.3)
place(hit(1.0), t_flash_out, 0.35)
# Carton : coup sourd puis machine à écrire
place(hit(2.0), t_card + 0.02, 0.45)
msg = "Quelques semaines plus tard"
for i, c in enumerate(msg):
    if c != " ":
        place(click(), t_card + (6 + i * 1.4) / 24, 0.22 + 0.06 * rng.random(), rng.uniform(-0.15, 0.15))
place(whoosh(0.7, 200, 3000, rise=False), t_mirror - 0.35, 0.18)
# Transitions fluides : souffles doux
for tt in (t_sofa, t_street, t_salon, t_pose):
    place(whoosh(0.8, 250, 5000, rise=False), tt - 0.35, 0.16)
# Téléphone : tap et défilements
place(click(0.03), t_insta + 0.15, 0.18)
for k in range(3):
    place(whoosh(0.18, 2000, 9000, rise=False), t_insta + 0.45 + k * 0.45, 0.07)
place(shimmer(1.4, 1568), t_smile + 0.1, 0.10)
# Rue : ambiance urbaine discrète, porte et clochette
place(ambience(t_door + 2.0 - t_street, 60, 900, 0.05), t_street)
place(click(0.05, hi=False), t_door + 0.75, 0.25)
place(bell(1318.5), t_door + 0.85, 0.16)
place(bell(1046.5), t_door + 1.05, 0.12)
# Salon : ambiance feutrée, révélation au miroir, carton final
place(ambience(t_miroir + 4 - t_salon, 120, 2500, 0.025), t_salon)
place(whoosh(1.2, 300, 8000, rise=True), t_miroir - 1.0, 0.14)
place(shimmer(2.2, 1760), t_miroir + 0.1, 0.16)
place(shimmer(2.0, 1318.5), t_end + 0.35, 0.12)

sfx = np.tanh(sfx * 1.1) * 0.9
sfx_path = f"{AUD}/sfx.wav"
with wave.open(sfx_path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(sfx[: int(TV * SR)], -1, 1) * 32767).astype(np.int16).tobytes())

# ---------- 3. Musique (plus basse) + bruitages ----------
sad = f"{ROOT}/musique/musique-triste.mp4"
up = f"{ROOT}/musique/musique-entrainante.mp4"
x_start = t_insta - 0.2               # entrée de la musique entraînante
sad_out = x_start - 0.5
fc = (f"[0:a]atrim=start=1.6:end={1.6 + sad_out + 1.6:.3f},asetpts=PTS-STARTPTS,volume=1.5dB,"
      f"afade=t=in:st=0:d=0.2,afade=t=out:st={sad_out:.3f}:d=1.5[sad];"
      f"[1:a]atrim=start=16.2:end=50,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.0,"
      f"adelay={int(x_start * 1000)}|{int(x_start * 1000)}[up];"
      f"[sad][up]amix=inputs=2:duration=longest:normalize=0,atrim=0:{TV:.3f},"
      f"afade=t=out:st={TV - 2.2:.3f}:d=2.2,volume=-7dB[mus];"
      f"[2:a]aformat=channel_layouts=stereo[fx];"
      f"[mus][fx]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]")
mix = f"{AUD}/mix-final.wav"
run(["-i", sad, "-i", up, "-i", sfx_path, "-filter_complex", fc, "-map", "[a]", "-c:a", "pcm_s16le", mix])

out = f"{M}/dvora-k-film-final-v2.mp4"
run(["-i", video, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
     "-shortest", "-movflags", "+faststart", out])
print(out, f"{TV:.2f}s", "insta", round(t_insta, 2), "miroir", round(t_miroir, 2))
