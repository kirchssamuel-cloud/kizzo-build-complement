"""Montage de la pub A (aide auditive) : 10 plans calés sur la voix off, sous-titres mot à mot,
carton final, grain léger, mixage voix (+ musique si fournie).

Usage : python3 build_pubA.py <dossier_temp> [fichier_musique]
Variables : B4_CUT (coupe interne du bloc 4, défaut 1.8), FAST=1 (réutilise les plans déjà faits)
Sorties : montage/pubA-voix-seule.mp4  (ou montage/pubA-final.mp4 si une musique est fournie)
"""
import os, subprocess, sys, shutil, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R, VO, OUT = f"{ROOT}/rushes", f"{ROOT}/voix/voix-off-pub-A.mp3", f"{ROOT}/montage"
TMP = sys.argv[1]
MUSIC = sys.argv[2] if len(sys.argv) > 2 else None
SUFFIX = sys.argv[3] if len(sys.argv) > 3 else ""
os.makedirs(TMP, exist_ok=True)
FAST = os.environ.get("FAST") == "1"
B4_CUT = float(os.environ.get("B4_CUT", "2.04"))

W, H, FPS = 1080, 1920, 24
LEAD = 0.2                     # silence avant la voix
ENC = ["-c:v", "libx264", "-crf", "13", "-preset", "slow", "-pix_fmt", "yuv420p", "-r", str(FPS)]
BOLD = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
MED = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
ACCENT = (255, 214, 107, 255)


def run(args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))


# ---------------------------------------------------------------- 1. les 10 plans, calés sur la voix
PAUSE_AT, PAUSE = 10.40, 0.70     # pause ajoutée dans la voix (entre « intéressé ? » et « Répondez ») pour 2 s + 2 s sur les plans 5 et 6
def sh(t):                         # temps voix -> temps film (après la pause ajoutée)
    return t + PAUSE if t >= PAUSE_AT else t
B = [0, 2.3, 4.5, 6.3, 9.1, 11.1, 13.1, 15.0, 18.3, 20.1, 22.3]     # débuts de plan (temps film)
D = [B[i + 1] - B[i] for i in range(10)]
D[0] += LEAD
# (bloc, début, fin, interpolation si ralenti notable)
SRC = [
    ("bloc2-rencontre", 0.00, 2.33, False),
    ("bloc2-rencontre", 2.58, 4.78, False),
    ("bloc2-rencontre", 5.08, 6.88, False),
    ("bloc1-produit", 0.20, 3.00, False),
    ("plan5", 0.30, 2.30, False),
    ("plan5b", 0.20, 2.20, False),
    ("bloc3-consultation", 2.08, 3.98, False),
    ("bloc3-consultation", 4.08, 7.04, True),
    ("bloc4-preuve", 0.20, B4_CUT - 0.04, False),
    ("bloc4-preuve", B4_CUT + 0.05, 4.00, True),
]
# plans 5 et 6 : images fixes 4K + poussée lente (l'animation IA abîmait l'appareil)
STILLS = {}     # (plans 5 et 6 : vidéos à partir des images validées ; le plan 5 est retourné pour regarder à gauche)
FLIP = set()   # les deux vidéos sont déjà générées face à gauche
FILES = {"bloc1-produit": "pubA-bloc1-produit.mp4", "bloc2-rencontre": "pubA-bloc2-rencontre.mp4",
         "bloc3-consultation": "pubA-bloc3-consultation.mp4", "bloc4-preuve": "pubA-bloc4-preuve.mp4",
         "plan5": "pubA-plan5-v12-arc-video.mp4", "plan5b": "pubA-plan5b-closeup-v2-arc-video.mp4"}
# plan 3 : l'écran mural (x 0-148) sort du champ grâce à un recadrage de 16 % ancré à droite
WALL_PATCH = "crop=930:1653:150:60,scale=1080:1920:flags=lanczos,setsar=1"

clips = []
for i, ((blk, a, b, interp), d) in enumerate(zip(SRC, D), 1):
    out = f"{TMP}/plan{i:02d}.mp4"
    clips.append(out)
    if FAST and os.path.exists(out):
        continue
    if i in STILLS:
        img, fx, fy, z1 = STILLS[i]
        n = round(d * FPS)
        zp = (f"scale=2160:-2:flags=lanczos,crop=2160:3840,setsar=1,zoompan=z='1+{z1 - 1:.3f}*on/{n}':"
              f"x='min(max({fx}*iw-iw/zoom/2,0),iw-iw/zoom)':y='min(max({fy}*ih-ih/zoom/2,0),ih-ih/zoom)':"
              f"d=1:s={W}x{H}:fps={FPS},format=yuv420p")
        run(["-loop", "1", "-i", img, "-vf", zp, "-frames:v", str(n), "-an", *ENC, out])
        continue
    L = b - a
    vf = f"trim=start={a:.3f}:end={b:.3f},setpts=PTS-STARTPTS"
    if blk in FLIP:
        vf += ",hflip"
    if L < d - 0.02:
        vf += f",setpts={d / L:.5f}*PTS"
        if interp:
            vf += ",minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1"
    vf += f",fps={FPS},scale={W}:{H}:flags=lanczos,setsar=1,format=yuv420p"
    if i == 3:
        vf += "," + WALL_PATCH + ",format=yuv420p"
    run(["-i", f"{R}/{FILES[blk]}", "-vf", vf, "-frames:v", str(round(d * FPS)), "-an", *ENC, out])

lst = f"{TMP}/list.txt"
with open(lst, "w") as fh:
    for c in clips:
        fh.write(f"file '{c}'\n")
base = f"{TMP}/base.mp4"
run(["-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", base])
T_BASE = dur(base)

# ---------------------------------------------------------------- 2. carton final
END_D = 3.0
last = f"{TMP}/last.png"
run(["-sseof", "-0.1", "-i", base, "-frames:v", "1", last])
bg = Image.open(last).convert("RGB").resize((W, H)).filter(ImageFilter.GaussianBlur(26))
bg = Image.blend(bg, Image.new("RGB", (W, H), (20, 18, 16)), 0.55)


def shadowed(layer, blur=9, op=0.55):
    sh = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    sh.putalpha(layer.split()[3].point(lambda v: int(v * op)))
    return Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)), layer)


def centered_text(text, font_path, size, y, fill=(255, 255, 255, 255)):
    f = ImageFont.truetype(font_path, size)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    w = d.textlength(text, font=f)
    d.text(((W - w) / 2, y), text, font=f, fill=fill)
    return shadowed(lay)


title1 = centered_text("Répondez à", BOLD, 112, 760)
title2 = centered_text("3 questions", BOLD, 132, 890, ACCENT)
sub = centered_text("pour savoir si vous êtes éligible", MED, 58, 1085)


def arrow(offset):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    cx, cy = W // 2, 1330 + offset
    for k in range(2):
        y = cy + k * 46
        d.line([(cx - 62, y), (cx, y + 52), (cx + 62, y)], fill=(255, 255, 255, 255 - k * 70), width=16, joint="curve")
    return shadowed(lay, 7, 0.5)


end_dir = f"{TMP}/end"
if not (FAST and os.path.exists(f"{TMP}/card.mp4")):
    shutil.rmtree(end_dir, ignore_errors=True)
    os.makedirs(end_dir)
    for k in range(int(END_D * FPS)):
        t = k / FPS
        fr = bg.convert("RGBA")
        for lay, t0 in ((title1, 0.15), (title2, 0.35), (sub, 0.85)):
            a = min(1.0, max(0.0, (t - t0) / 0.45))
            if a > 0:
                l2 = lay.copy(); l2.putalpha(lay.split()[3].point(lambda v, a=a: int(v * a)))
                fr = Image.alpha_composite(fr, l2)
        a = min(1.0, max(0.0, (t - 1.2) / 0.4))
        if a > 0:
            ar = arrow(int(18 * math.sin((t - 1.2) * 2 * math.pi / 0.9)))
            ar.putalpha(ar.split()[3].point(lambda v, a=a: int(v * a)))
            fr = Image.alpha_composite(fr, ar)
        fr.convert("RGB").save(f"{end_dir}/{k:03d}.png")
    run(["-framerate", str(FPS), "-i", f"{end_dir}/%03d.png", *ENC, f"{TMP}/card.mp4"])

XF = 0.4
joined = f"{TMP}/joined.mp4"
run(["-i", base, "-i", f"{TMP}/card.mp4", "-filter_complex",
     f"[0]settb=1/24,fps=24,setsar=1,format=yuv420p[a];[1]settb=1/24,fps=24,setsar=1,format=yuv420p[b];"
     f"[a][b]xfade=transition=fade:duration={XF}:offset={T_BASE - XF:.3f},format=yuv420p,"
     f"fade=t=in:st=0:d=0.2[v]", "-map", "[v]", *ENC, joined])
T_TOT = dur(joined)

# ---------------------------------------------------------------- 3. sous-titres mot à mot, calés sur les silences de la voix
SEG = [  # (début, fin, [(groupe de mots, syllabes)])
    (0.00, 2.05, [("Nous recherchons", 4), ("des personnes", 3), ("de votre ville,", 4)]),
    (2.54, 4.19, [("âgées de 50 ans", 6), ("et plus,", 2)]),
    (4.73, 8.50, [("qui souhaiteraient", 6), ("essayer", 3), ("gratuitement", 4), ("une aide auditive", 5), ("quasi invisible.", 6)]),
    (9.13, 10.02, [("Vous êtes", 3), ("intéressé ?", 4)]),
    (10.77, 13.75, [("Répondez à", 4), ("ces trois questions", 4), ("pour savoir si", 4), ("vous êtes éligible.", 6)]),
    (14.46, 15.23, [("Si c'est le cas,", 5)]),
    (15.49, 17.56, [("nous vous proposerons", 6), ("rapidement", 4), ("un rendez-vous,", 4)]),
    (17.75, 21.28, [("afin de vous permettre", 6), ("d'essayer", 3), ("gratuitement", 4), ("le modèle", 3), ("qui vous convient.", 4)]),
]
HILITE = {"gratuitement", "quasi", "invisible", "trois", "questions"}
def voice_dips():
    raw = subprocess.check_output(["ffmpeg", "-loglevel", "error", "-i", VO, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"])
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    hop = 160
    n = len(x) // hop
    db = 20 * np.log10(np.array([np.sqrt(np.mean(x[k * hop:(k + 1) * hop] ** 2) + 1e-12) for k in range(n)]) + 1e-9)
    db = np.convolve(db, np.ones(3) / 3, mode="same")
    return [k * 0.01 for k in range(2, n - 2)
            if db[k] < db[k - 1] and db[k] <= db[k + 1] and db[k] < -45]


DIPS = voice_dips()
caps = []   # (t_début, t_fin, texte)
for s_, e_, groups in SEG:
    tot = sum(sy for _, sy in groups)
    bounds, acc = [s_], 0
    for _, sy in groups[:-1]:
        acc += sy
        b = s_ + (e_ - s_) * acc / tot
        near = [d for d in DIPS if abs(d - b) <= 0.22 and s_ + 0.08 < d < e_ - 0.08]
        bounds.append(min(near, key=lambda d: abs(d - b)) if near else b)
    bounds.append(e_)
    for (g, _), t0, t1 in zip(groups, bounds[:-1], bounds[1:]):
        caps.append((t0, t1, g))
# chaque sous-titre reste jusqu'au suivant du même segment, et 0,1 s après la fin du segment
spans = []
for idx, (t0, t1, g) in enumerate(caps):
    nxt = caps[idx + 1][0] if idx + 1 < len(caps) else None
    end = t1 if (nxt is None or nxt - t1 > 0.2) else nxt
    spans.append((sh(t0) + LEAD, sh(end + 0.1) + LEAD, g))


def caption_img(text, alpha=1.0, y_center=1215, max_w=940):
    words = text.split(" ")
    size = 88
    while True:
        f = ImageFont.truetype(BOLD, size)
        d = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
        total = sum(d.textlength(w + " ", font=f) for w in words)
        if total <= max_w or size <= 64:
            break
        size -= 4
    lines = [words]
    if total > max_w:      # deux lignes
        half = len(words) // 2 or 1
        lines = [words[:half], words[half:]]
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    lh = int(size * 1.18)
    y = y_center - lh * len(lines) // 2
    for ln in lines:
        lw = sum(d.textlength(w + " ", font=f) for w in ln) - d.textlength(" ", font=f)
        x = (W - lw) / 2
        for w in ln:
            clean = w.strip(",.?!").lower()
            col = ACCENT if clean in HILITE else (255, 255, 255, 255)
            d.text((x, y), w, font=f, fill=col, stroke_width=3, stroke_fill=(0, 0, 0, 150))
            x += d.textlength(w + " ", font=f)
        y += lh
    lay = shadowed(lay, 10, 0.5)
    if alpha < 1.0:
        lay.putalpha(lay.split()[3].point(lambda v: int(v * alpha)))
    return lay


cap_dir = f"{TMP}/caps"
shutil.rmtree(cap_dir, ignore_errors=True)
os.makedirs(cap_dir)
blank = f"{cap_dir}/blank.png"
Image.new("RGBA", (W, H), (0, 0, 0, 0)).save(blank)
nF = int(T_TOT * FPS)
timeline = [blank] * nF
for t0, t1, g in spans:
    f0, f1 = int(round(t0 * FPS)), min(nF, int(round(t1 * FPS)))
    ramp = [caption_img(g, a) for a in (0.35, 0.7)]
    full = caption_img(g)
    paths = []
    for k, im in enumerate(ramp + [full]):
        p = f"{cap_dir}/c{f0}_{k}.png"
        im.save(p)
        paths.append(p)
    for fr in range(f0, f1):
        timeline[fr] = paths[min(fr - f0, 2)]
for fr, p in enumerate(timeline):
    link = f"{cap_dir}/f{fr:04d}.png"
    os.symlink(p, link)

# ---------------------------------------------------------------- 4. grain léger + sous-titres
video = f"{TMP}/video.mp4"
if not (FAST and os.environ.get("REUSE_VIDEO") == "1" and os.path.exists(video)):
    run(["-i", joined, "-framerate", str(FPS), "-i", f"{cap_dir}/f%04d.png", "-filter_complex",
         "[0]noise=alls=4:allf=t,format=yuv420p[g];[g][1]overlay=0:0:format=auto,format=yuv420p[v]",
         "-map", "[v]", "-frames:v", str(nF), *ENC, video])

# ---------------------------------------------------------------- 5. audio : voix traitée (+ musique)
voice = f"{TMP}/voix.wav"
run(["-i", VO, "-af", "highpass=f=75,acompressor=threshold=-21dB:ratio=3:attack=15:release=140:makeup=3,"
     "loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000", "-ac", "1", voice])
voice2 = f"{TMP}/voix-pause.wav"
run(["-i", voice, "-filter_complex",
     f"[0:a]atrim=0:{PAUSE_AT},asetpts=PTS-STARTPTS[a];[0:a]atrim={PAUSE_AT},asetpts=PTS-STARTPTS[b];"
     f"aevalsrc=0:d={PAUSE}:s=48000:c=mono[s];[a][s][b]concat=n=3:v=0:a=1[o]", "-map", "[o]", "-ac", "1", voice2])
voice = voice2
if MUSIC:
    fc = (f"[0:a]adelay={int(LEAD * 1000)}|{int(LEAD * 1000)},apad,atrim=0:{T_TOT:.3f},asplit=2[v1][v2];"
          f"[1:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-2:LRA=11,volume=-9dB,"
          f"afade=t=in:st=0:d=1.0,afade=t=out:st={T_TOT - 2.2:.3f}:d=2.2,atrim=0:{T_TOT:.3f}[m];"
          f"[m][v2]sidechaincompress=threshold=0.035:ratio=6:attack=15:release=400[md];"
          f"[v1]aformat=channel_layouts=stereo[vs];[vs][md]amix=inputs=2:duration=first:normalize=0,"
          f"alimiter=limit=0.92,loudnorm=I=-15:TP=-1.5:LRA=9,aresample=48000[a]")
    run(["-i", voice, "-i", MUSIC, "-filter_complex", fc, "-map", "[a]", "-c:a", "pcm_s16le", f"{TMP}/mix.wav"])
    name = f"pubA-final{SUFFIX}.mp4"
else:
    run(["-i", voice, "-af", f"adelay={int(LEAD * 1000)}|{int(LEAD * 1000)},apad,atrim=0:{T_TOT:.3f},"
         "aformat=channel_layouts=stereo,afade=t=out:st=%.3f:d=0.4" % (T_TOT - 0.4), "-c:a", "pcm_s16le", f"{TMP}/mix.wav"])
    name = "pubA-voix-seule.mp4"
out = f"{OUT}/{name}"
run(["-i", video, "-i", f"{TMP}/mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "19", "-preset", "slow",
     "-maxrate", "9M", "-bufsize", "18M", "-profile:v", "high", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
     "-shortest", "-movflags", "+faststart", out])
print(out, f"{T_TOT:.2f}s", "plans:", [round(x, 2) for x in D])
