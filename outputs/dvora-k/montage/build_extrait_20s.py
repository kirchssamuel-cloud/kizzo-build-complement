"""Extrait de 20 s du film Dvora K, sans aucun texte, pour présenter le savoir-faire (portfolio).

Usage : python3 build_extrait_20s.py <dossier_build_v3>
Entrées : les parties sans texte produites par build_v3.py (p0-raw, p2, p3-raw, p4b-raw, p4c, p4d, p5-raw), les musiques
Sortie : montage/dvora-k-extrait-20s-sans-texte.mp4
"""
import os, subprocess, sys, wave
import numpy as np

M = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(M)
B = sys.argv[1]
TMP = f"{B}/extrait"
os.makedirs(TMP, exist_ok=True)
SR, FPS, TOTAL = 48000, 24, 20.0
ENC = ["-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-r", str(FPS)]
NORM = "settb=1/24,fps=24,setsar=1,format=yuv420p"


def run(args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


# (source, début, fin) : du diagnostic au sourire devant le miroir
shots = [
    ("p0-raw", 4.5, 6.1),    # le compte-rendu (zoom)
    ("p0-raw", 7.0, 8.2),    # les larmes, flash blanc
    ("p0-raw", 8.2, 9.8),    # elle s'imagine sans cheveux (lumière froide)
    ("p2", 0.4, 2.2),        # quelques semaines plus tard : le miroir
    ("p3-raw", 1.92, 3.4),   # elle découvre Dvora K sur Instagram
    ("p3-raw", 3.7, 5.1),    # premier sourire
    ("p4c", 0.0, 2.0),       # le vrai salon, logo doré
    ("p4d", 0.6, 2.6),       # le mur de perruques
    ("p5-raw", 0.2, 2.45),   # Dvora pose la perruque
    ("p5-raw", 3.0, 5.0),    # elle se découvre
    ("p5-raw", 5.3, None),   # de dos au miroir (complète jusqu'à 20 s)
]
used = sum(b - a for _, a, b in shots if b is not None)
last_len = TOTAL - used
inputs, fc = [], ""
for k, (src, a, b) in enumerate(shots):
    if b is None:
        b = a + last_len
    inputs += ["-i", f"{B}/{src}.mp4"]
    fc += f"[{k}:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS,{NORM}[s{k}];"
fc += "".join(f"[s{k}]" for k in range(len(shots))) + f"concat=n={len(shots)}:v=1:a=0,fade=t=in:st=0:d=0.3,fade=t=out:st={TOTAL - 0.9:.3f}:d=0.9[v]"
video = f"{TMP}/video.mp4"
run([*inputs, "-filter_complex", fc, "-map", "[v]", "-t", f"{TOTAL}", *ENC, video])

# instants clés (secondes)
starts, acc = [], 0.0
for _, a, b in shots:
    starts.append(acc)
    acc += (b - a) if b is not None else last_len
t_tears, t_flash, t_mirror, t_insta, t_smile = starts[1], starts[2], starts[3], starts[4], starts[5]
t_logo, t_wig, t_pose, t_alone, t_back = starts[6:11]

# ---------- bruitages ----------
N = int(TOTAL * SR) + SR
sfx = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(11)


def place(sig, t, gain=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    sfx[i:j] += np.stack([sig[: j - i]] * 2, 1) * gain


def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n).astype(np.float32)
    return y / (np.abs(y).max() + 1e-9)


def whoosh(d=0.6, lo=300, hi=6000, rise=True):
    n = int(d * SR); x = bandnoise(n, lo, hi); t = np.linspace(0, 1, n)
    return (x * ((t ** 2.2 * (1 - t ** 8)) if rise else np.sin(np.pi * t) ** 2)).astype(np.float32)


def thump(f=55, d=0.28):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t * (1 - 0.35 * t / d)) * np.exp(-t * 16)).astype(np.float32)


def heartbeat():
    out = np.zeros(int(0.5 * SR), np.float32); a, b = thump(58), thump(50, 0.24) * 0.7
    out[: len(a)] += a; out[int(0.16 * SR): int(0.16 * SR) + len(b)] += b
    return out


def hit(d=1.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 42 * t) * np.exp(-t * 3.5) * 0.9 + bandnoise(n, 2500, 12000) * np.exp(-t * 5) * 0.35).astype(np.float32)


def shimmer(d=1.8, base=1760):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for k, f in enumerate([base, base * 1.25, base * 1.5, base * 2, base * 2.5]):
        st = int(k * 0.07 * SR); tt = t[: n - st]
        s[st:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.5) * 0.25
    return (s * np.minimum(1, np.linspace(0, 40, n))).astype(np.float32)


def bell(f0=1318.5, d=1.6):
    n = int(d * SR); t = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * k) for m, a, k in [(1, 1, 2.2), (2.76, .4, 3.5), (5.4, .2, 5)]).astype(np.float32)


for k, bt in enumerate([t_tears + 0.05, t_tears + 0.7]):
    place(heartbeat(), bt, 0.55)
place(whoosh(0.4), t_flash - 0.4, 0.3); place(hit(1.2), t_flash, 0.5)
place(whoosh(0.35, rise=False), t_mirror - 0.2, 0.25)
place(bandnoise(int(0.03 * SR), 1800, 9000) * np.exp(-np.arange(int(0.03 * SR)) / SR * 180), t_insta + 0.15, 0.18)
place(shimmer(1.4, 1568), t_smile + 0.1, 0.10)
place(whoosh(0.5, 300, 4000, rise=False), t_logo - 0.25, 0.12)
place(bell(1318.5), t_logo, 0.15); place(bell(1046.5), t_logo + 0.2, 0.11)
place(whoosh(1.0, 300, 8000, rise=True), t_alone - 0.9, 0.13)
place(shimmer(2.2, 1760), t_alone + 0.05, 0.15)
place(shimmer(1.8, 1568), t_back + 0.2, 0.10)
sfx = np.tanh(sfx * 1.1) * 0.9
sfx_path = f"{TMP}/sfx.wav"
with wave.open(sfx_path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(sfx[: int(TOTAL * SR)], -1, 1) * 32767).astype(np.int16).tobytes())

# ---------- musique : triste, puis entraînante dont la relance (35 s du morceau) tombe quand elle se découvre ----------
x_start = t_insta - 0.2
up_start = 35.0 - (t_alone - x_start)
fc = (f"[0:a]atrim=start=1.6:end={1.6 + x_start + 1.2:.3f},asetpts=PTS-STARTPTS,volume=1.5dB,"
      f"afade=t=in:st=0:d=0.3,afade=t=out:st={x_start - 0.3:.3f}:d=1.2[sad];"
      f"[1:a]atrim=start={up_start:.3f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.8,"
      f"adelay={int(x_start * 1000)}|{int(x_start * 1000)}[up];"
      f"[sad][up]amix=inputs=2:duration=longest:normalize=0,apad,atrim=0:{TOTAL},"
      f"afade=t=out:st={TOTAL - 1.4:.3f}:d=1.4,volume=-7dB[mus];"
      f"[2:a]aformat=channel_layouts=stereo[fx];"
      f"[mus][fx]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]")
mix = f"{TMP}/mix.wav"
if os.environ.get("SANS_MUSIQUE") == "1":   # bruitages seuls, sans musique
    fc = (f"[2:a]aformat=channel_layouts=stereo,volume=4dB,afade=t=out:st={TOTAL - 1.0:.3f}:d=1.0,"
          f"alimiter=limit=0.9,aresample=48000[a]")
run(["-i", f"{ROOT}/musique/musique-triste.mp4", "-i", f"{ROOT}/musique/musique-entrainante.mp4", "-i", sfx_path,
     "-filter_complex", fc, "-map", "[a]", "-c:a", "pcm_s16le", mix])
out = f"{M}/dvora-k-extrait-20s-sans-texte{'-sans-musique' if os.environ.get('SANS_MUSIQUE') == '1' else ''}.mp4"
run(["-i", video, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
     "-shortest", "-movflags", "+faststart", out])
print(out, {k: round(v, 2) for k, v in zip(["tears", "flash", "mirror", "insta", "smile", "logo", "wig", "pose", "alone", "back"],
                                          [t_tears, t_flash, t_mirror, t_insta, t_smile, t_logo, t_wig, t_pose, t_alone, t_back])})
