"""Film Dvora K v3 : vrai salon (façade, logo, mur de perruques, pose par Dvora, miroir), textes de marque,
transitions fluides, bruitages, musique.

Usage : python3 build_v3.py <dossier_polices> <dossier_temp>
Sortie : montage/dvora-k-film-v3.mp4
"""
import os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R, M, K = f"{ROOT}/rushes", f"{ROOT}/montage", f"{ROOT}/images-cles"
FONTS, TMP = sys.argv[1], sys.argv[2]
os.makedirs(TMP, exist_ok=True)

W, H, FPS, SR = 1080, 1920, 24, 48000
SERIF, SERIF_I, SCRIPT = f"{FONTS}/f3.ttf", f"{FONTS}/f1.ttf", f"{FONTS}/f4.ttf"
SANS = "/usr/share/fonts/opentype/inter/Inter-Light.otf"
ENC = ["-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-r", str(FPS)]
YUV = "format=yuv420p"
NORM = "settb=1/24,fps=24,setsar=1,format=yuv420p"

# Points de coupe des nouveaux rushes (secondes, mesurés à la détection de plans)
V1_CUT = 2.125                 # vidéo 1 : porte -> mur de perruques
V2_POSE = (0.0, 2.50)          # vidéo 2 : pose par Dvora
V2_ALONE = (2.58, 3.67)        # vidéo 2 : elle seule, sourire (ralenti 1,6x)
V2_MIRROR = (5.46, 8.04)       # vidéo 2 : de dos au miroir (ralenti 1,25x) ; le gros plan en pleurs (3,71-5,42) est écarté
ALONE_SLOW, MIRROR_SLOW = 1.6, 1.25


def run(args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def dur(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


def text_layer(path, lines, y_center=1180, shadow=True, scrim=False):
    """lines: list of (text, font_path, size, tracking_px, fill_rgba)."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    blocks, total = [], 0
    for text, fp, size, track, fill in lines:
        f = ImageFont.truetype(fp, size)
        widths = [d.textlength(c, font=f) for c in text]
        width = sum(widths) + track * (len(text) - 1)
        asc, desc = f.getmetrics()
        blocks.append((text, f, widths, width, asc + desc, track, fill))
        total += asc + desc + int(size * 0.25)
    y = y_center - total // 2
    glyphs = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glyphs)
    for text, f, widths, width, lh, track, fill in blocks:
        x = (W - width) / 2
        for c, cw in zip(text, widths):
            g.text((x, y), c, font=f, fill=fill)
            x += cw + track
        y += lh + int(f.size * 0.25)
    if scrim:
        sc = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(sc).ellipse((60, y_center - total // 2 - 70, W - 60, y_center + total // 2 + 70), fill=(0, 0, 0, 120))
        img = Image.alpha_composite(img, sc.filter(ImageFilter.GaussianBlur(45)))
    if shadow:
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sh.putalpha(glyphs.split()[3].point(lambda a: int(a * 0.55)))
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(10)))
    img = Image.alpha_composite(img, glyphs)
    img.save(path)
    return path


def caption(text):
    return [(text, SERIF_I, 96, 1, (255, 255, 255, 255))]


def overlay_texts(src, dst, items, fade=0.35):
    """items: list of (png, t_in, t_out)."""
    inputs, fc, last = ["-i", src], "", "0"
    for k, (png, t_in, t_out) in enumerate(items, 1):
        inputs += ["-loop", "1", "-i", png]
        fc += (f"[{k}]format=rgba,fade=t=in:st={t_in:.3f}:d={fade}:alpha=1,"
               f"fade=t=out:st={t_out - fade:.3f}:d={fade}:alpha=1[t{k}];[{last}][t{k}]overlay=0:0:shortest=1[o{k}];")
        last = f"o{k}"
    run([*inputs, "-filter_complex", fc + f"[{last}]{YUV}[v]", "-map", "[v]", *ENC, dst])


def xfade_chain(parts, joins, out):
    """parts: fichiers ; joins[i] = durée du fondu entre parts[i] et parts[i+1] (0 = coupe franche).
    Renvoie les instants de début de chaque partie dans le résultat."""
    lens = [dur(p) for p in parts]
    inputs = sum([["-i", p] for p in parts], [])
    fc = "".join(f"[{k}]{NORM}[n{k}];" for k in range(len(parts)))
    label, acc, starts = "n0", lens[0], [0.0]
    for k in range(1, len(parts)):
        d = joins[k - 1]
        if d > 0:
            off = acc - d
            fc += f"[{label}][n{k}]xfade=transition=fade:duration={d}:offset={off:.4f},settb=1/24[c{k}];"
        else:
            off = acc
            fc += f"[{label}][n{k}]concat=n=2:v=1:a=0,settb=1/24[c{k}];"
        starts.append(off)
        label, acc = f"c{k}", off + lens[k]
    run([*inputs, "-filter_complex", fc.rstrip(";"), "-map", f"[{label}]", *ENC, out])
    return starts


# ======================= 1. Parties du film =======================
P = {}

# P0. Cabinet : large, mains, compte-rendu, larmes, flash, retour à la réalité (fondu au noir final)
raw = f"{TMP}/p0-raw.mp4"
run(["-i", f"{R}/video1-cabinet.mp4", "-i", f"{R}/video-2b-compte-rendu.mp4", "-i", f"{R}/video-4-flash.mp4", "-filter_complex",
     f"[0:v]trim=0.3:2.8,setpts=PTS-STARTPTS,{YUV}[a];"
     f"[0:v]trim=3.3:4.8,setpts=PTS-STARTPTS,{YUV}[b];"
     f"[1:v]{YUV},scale=2160:3840,zoompan=z='1.12+0.18*on/97':x='iw/2-(iw/zoom/2)':y='ih*0.46-(ih/zoom/2)':d=1:s=1080x1920:fps=24,trim=0.6:3.4,setpts=PTS-STARTPTS[c];"
     f"[0:v]trim=5.8:7.2,setpts=PTS-STARTPTS,{YUV},fade=t=out:st=1.28:d=0.12:color=white[d];"
     f"[2:v]trim=1.5:3.1,setpts=PTS-STARTPTS,scale=1188:2112,crop=1080:1920:4:57,curves=all='0/0.04 0.5/0.6 1/1',"
     f"colorbalance=rs=-0.06:bs=0.10:rm=-0.04:bm=0.06,eq=saturation=0.65,vignette=PI/6,{YUV},"
     f"fade=t=in:st=0:d=0.15:color=white,fade=t=out:st=1.48:d=0.12:color=white[e];"
     f"[0:v]trim=8.0:10.04,setpts=PTS-STARTPTS,{YUV},fade=t=in:st=0:d=0.15:color=white[f];"
     f"[a][b][c][d][e][f]concat=n=6:v=1:a=0[v]", "-map", "[v]", *ENC, raw])
d0 = dur(raw)
tmp0 = f"{TMP}/p0-txt.mp4"
overlay_texts(raw, tmp0, [(text_layer(f"{TMP}/t1.png", caption("Le jour où tout bascule."), scrim=True), d0 - 1.85, d0)])
P[0] = f"{TMP}/p0.mp4"
run(["-i", tmp0, "-vf", f"fade=t=out:st={d0 - 0.3:.3f}:d=0.3,{YUV}", *ENC, P[0]])

# P1. Carton « Quelques semaines plus tard » écrit lettre par lettre
card_dir = f"{TMP}/card"
os.makedirs(card_dir, exist_ok=True)
msg = "Quelques semaines plus tard"
f = ImageFont.truetype(SERIF_I, 92)
tmpd = ImageDraw.Draw(Image.new("RGB", (W, H)))
widths = [tmpd.textlength(c, font=f) for c in msg]
track = 2
total_w = sum(widths) + track * (len(msg) - 1)
n_frames = int(3.0 * FPS)
start, per_letter, letter_fade = 6, 1.4, 4
end_fade_start = n_frames - 10
for k in range(n_frames):
    img = Image.new("RGB", (W, H), (0, 0, 0))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x = (W - total_w) / 2
    for i, (c, cw) in enumerate(zip(msg, widths)):
        a = max(0.0, min(1.0, (k - (start + i * per_letter)) / letter_fade))
        if k >= end_fade_start:
            a *= max(0.0, 1 - (k - end_fade_start) / 10)
        if a > 0:
            d.text((x, 900), c, font=f, fill=(255, 255, 255, int(255 * a)))
        x += cw + track
    img.paste(layer, (0, 0), layer)
    img.save(f"{card_dir}/{k:03d}.png")
P[1] = f"{TMP}/p1.mp4"
run(["-framerate", str(FPS), "-i", f"{card_dir}/%03d.png", *ENC, P[1]])

# P2. Miroir de la salle de bain + lit (ouverture en fondu depuis le noir)
P[2] = f"{TMP}/p2.mp4"
run(["-i", f"{R}/video-5-miroir.mp4", "-i", f"{R}/video-6-lit.mp4", "-filter_complex",
     f"[0:v]trim=1.2:3.7,setpts=PTS-STARTPTS,{YUV}[a];[1:v]trim=0.8:4.0,setpts=PTS-STARTPTS,{YUV}[b];"
     f"[a][b]concat=n=2:v=1:a=0,fade=t=in:st=0:d=0.35[v]", "-map", "[v]", *ENC, P[2]])

# P3. Canapé, Instagram de Dvora K, sourire (ralenti léger)
raw = f"{TMP}/p3-raw.mp4"
run(["-i", f"{R}/video-789-multiplan.mp4", "-i", f"{R}/video-8-instagram-higgsfield.mp4", "-filter_complex",
     f"[0:v]trim=0:1.917,setpts=PTS-STARTPTS,{YUV}[a];"
     f"[1:v]trim=0.8:2.5,setpts=PTS-STARTPTS,{YUV}[b];"
     f"[0:v]trim=4.083:6.04,setpts=1.35*(PTS-STARTPTS),minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1,{YUV}[c];"
     f"[a][b][c]concat=n=3:v=1:a=0[v]", "-map", "[v]", *ENC, raw])
d3 = dur(raw)
P3_INSTA, P3_SMILE = 1.917, 1.917 + 1.7
P[3] = f"{TMP}/p3.mp4"
overlay_texts(raw, P[3], [
    (text_layer(f"{TMP}/t2a.png", caption("Elle découvre Dvora K"), scrim=True), P3_INSTA + 0.1, P3_SMILE + 0.05),
    (text_layer(f"{TMP}/t2.png", caption("Et si je restais moi ?"), scrim=True), d3 - 2.35, d3)])

# P4. Arrivée : rue -> vraie façade -> vrai salon (logo) vu par ses yeux -> mur de perruques
a = f"{TMP}/p4a.mp4"
run(["-i", f"{R}/video-10-v2-rue.mp4", "-vf", f"trim=0.8:4.0,setpts=PTS-STARTPTS,{YUV}", *ENC, a])
b_raw, b = f"{TMP}/p4b-raw.mp4", f"{TMP}/p4b.mp4"
FAC_D = 2.3
nf = int(FAC_D * FPS)
run(["-loop", "1", "-i", f"{K}/plan-V2-facade-reelle-fermee.jpg", "-vf",
     f"scale=2160:-2,crop=2160:3840,setsar=1,zoompan=z='1.0+0.07*on/{nf}':x='iw/2-(iw/zoom/2)':y='ih*0.40-(ih/zoom/2)':d=1:s=1080x1920:fps=24,setsar=1,{YUV}",
     "-frames:v", str(nf), *ENC, b_raw])
overlay_texts(b_raw, b, [(text_layer(f"{TMP}/t4.png", caption("Dvora K · Paris 19e"), y_center=1180, scrim=True), 0.35, FAC_D)])
c = f"{TMP}/p4c.mp4"
run(["-i", f"{R}/reel-salon-logo-1080p.mp4", "-vf", f"trim=0.15:2.6,setpts=PTS-STARTPTS,{YUV}", *ENC, c])
dd = f"{TMP}/p4d.mp4"
wig_len = dur(f"{R}/video-V1-entree-perruques.mp4") - V1_CUT - 0.05
nw = int(wig_len * FPS)
run(["-i", f"{R}/video-V1-entree-perruques.mp4", "-vf",
     f"trim={V1_CUT + 0.04:.3f}:{V1_CUT + 0.04 + wig_len:.3f},setpts=PTS-STARTPTS,scale=2160:3840,"
     f"zoompan=z='1.0+0.13*on/{nw}':x='iw*0.60-(iw/zoom/2)':y='ih*0.40-(ih/zoom/2)':d=1:s=1080x1920:fps=24,{YUV}",
     *ENC, dd])
P[4] = f"{TMP}/p4.mp4"
p4_starts = xfade_chain([a, b, c, dd], [0, 0.3, 0], P[4])

# P5. Vidéo 2 : pose par Dvora (texte), elle seule, miroir de dos (texte)
v2 = f"{R}/video-V2-pose-miroir.mp4"
raw = f"{TMP}/p5-raw.mp4"
MI = "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1"
run(["-i", v2, "-filter_complex",
     f"[0:v]trim={V2_POSE[0]}:{V2_POSE[1]},setpts=PTS-STARTPTS,{YUV}[a];"
     f"[0:v]trim={V2_ALONE[0]}:{V2_ALONE[1]},setpts={ALONE_SLOW}*(PTS-STARTPTS),{MI},{YUV}[b];"
     f"[0:v]trim={V2_MIRROR[0]}:{V2_MIRROR[1]},setpts={MIRROR_SLOW}*(PTS-STARTPTS),{MI},{YUV}[c];"
     f"[a][b][c]concat=n=3:v=1:a=0[v]", "-map", "[v]", *ENC, raw])
d5 = dur(raw)
V2_CUT_A = V2_POSE[1] - V2_POSE[0]
V2_CUT_B = V2_CUT_A + (V2_ALONE[1] - V2_ALONE[0]) * ALONE_SLOW
P[5] = f"{TMP}/p5.mp4"
overlay_texts(raw, P[5], [
    (text_layer(f"{TMP}/t5.png", [("Chaque perruque,", SERIF_I, 92, 1, (255, 255, 255, 255)), ("posée par Dvora", SERIF_I, 92, 1, (255, 255, 255, 255))], y_center=1180, scrim=True), 0.4, V2_CUT_A - 0.05),
    (text_layer(f"{TMP}/t6.png", caption("Rester soi. Rester belle."), y_center=1500, scrim=True), V2_CUT_B + 0.4, d5 - 0.65)])

# P6. Carton final : signature « Dvora K » qui s'écrit, puis les informations
last = f"{TMP}/v2-last.png"
run(["-sseof", "-0.1", "-i", v2, "-frames:v", "1", last])
bg = Image.open(last).convert("RGB").resize((W, H)).filter(ImageFilter.GaussianBlur(28))
bg = Image.blend(bg, Image.new("RGB", (W, H), (18, 12, 10)), 0.64)
sig = text_layer(f"{TMP}/e1.png", [("Dvora K", SCRIPT, 200, 0, (255, 255, 255, 255))], y_center=760, shadow=False)
L2 = text_layer(f"{TMP}/e2.png", [("PERRUQUES NATURELLES", SANS, 34, 9, (235, 222, 205, 255)),
                                   ("sur-mesure, posées avec douceur", SERIF_I, 46, 1, (235, 222, 205, 255))], y_center=980, shadow=False)
L3 = text_layer(f"{TMP}/e3.png", [("65 rue d'Hautpoul · Paris 19e", SERIF, 50, 1, (255, 255, 255, 255)),
                                   ("@dvora_k_perruque", SANS, 38, 3, (255, 255, 255, 230))], y_center=1190, shadow=False)
L4 = text_layer(f"{TMP}/e4.png", [("Prenez rendez-vous", SERIF_I, 64, 1, (255, 255, 255, 255))], y_center=1400, shadow=False)
sig_img = Image.open(sig)
alpha = np.array(sig_img.split()[3])
cols = np.where(alpha.max(0) > 0)[0]
x0, x1 = int(cols.min()), int(cols.max())
END_D, SIG_T0, SIG_D = 6.5, 0.35, 1.5
layers = [Image.open(p) for p in (L2, L3, L4)]
fades = [(1.75, 0.6), (2.2, 0.6), (2.65, 0.6)]
end_dir = f"{TMP}/end"
os.makedirs(end_dir, exist_ok=True)
xs = np.arange(W)
for k in range(int(END_D * FPS)):
    t = k / FPS
    fr = bg.copy().convert("RGBA")
    # signature dévoilée de gauche à droite, avec un bord doux, comme une plume
    p = min(1.0, max(0.0, (t - SIG_T0) / SIG_D))
    p = 1 - (1 - p) ** 2
    edge = x0 + (x1 - x0 + 60) * p
    ramp = np.clip((edge - xs) / 60.0, 0, 1)
    m = (alpha * ramp[None, :]).astype(np.uint8)
    s = sig_img.copy(); s.putalpha(Image.fromarray(m))
    fr = Image.alpha_composite(fr, s)
    for lay, (st, fd) in zip(layers, fades):
        a_ = min(1.0, max(0.0, (t - st) / fd))
        if a_ > 0:
            l2 = lay.copy(); l2.putalpha(lay.split()[3].point(lambda v, a_=a_: int(v * a_)))
            fr = Image.alpha_composite(fr, l2)
    fo = min(1.0, max(0.0, (END_D - 0.6 - t) / 0.6)) if t > END_D - 0.6 else 1.0
    fr = Image.blend(Image.new("RGB", (W, H)), fr.convert("RGB"), fo)
    fr.save(f"{end_dir}/{k:03d}.png")
P[6] = f"{TMP}/p6.mp4"
run(["-framerate", str(FPS), "-i", f"{end_dir}/%03d.png", *ENC, P[6]])

# ======================= 2. Assemblage + signature discrète =======================
order = [P[k] for k in range(7)]
joins = [0, 0, 0.4, 0.4, 0.4, 0.6]
body = f"{TMP}/body.mp4"
st = xfade_chain(order, joins, body)
TV = dur(body)

t_card, t_mirror, t_sofa, t_street, t_pose, t_endcard = st[1], st[2], st[3], st[4], st[5], st[6]
t_insta, t_smile = t_sofa + P3_INSTA, t_sofa + P3_SMILE
t_facade, t_logo, t_wig = t_street + p4_starts[1], t_street + p4_starts[2], t_street + p4_starts[3]
t_alone, t_mirror2 = t_pose + V2_CUT_A, t_pose + V2_CUT_B

# petite signature « Dvora K » en haut, quand elle découvre le salon sur Instagram puis dans le salon
wm = Image.new("RGBA", (W, H), (0, 0, 0, 0))
fw = ImageFont.truetype(SCRIPT, 62)
dw = ImageDraw.Draw(wm)
tw = dw.textlength("Dvora K", font=fw)
glyph = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glyph).text(((W - tw) / 2, 250), "Dvora K", font=fw, fill=(255, 255, 255, 225))
sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sh.putalpha(glyph.split()[3].point(lambda v: int(v * 0.6)))
wm = Image.alpha_composite(wm, sh.filter(ImageFilter.GaussianBlur(6)))
wm = Image.alpha_composite(wm, glyph)
wm_path = f"{TMP}/wm.png"; wm.save(wm_path)
windows = [(t_insta + 0.2, t_street - 0.1), (t_wig + 0.3, t_endcard - 0.1)]   # pas sur la façade ni sur le logo réel
expr = "+".join(
    f"between(T,{a0:.3f},{b0:.3f})*min(1,min((T-{a0:.3f})/0.5,({b0:.3f}-T)/0.4))" for a0, b0 in windows)
video = f"{TMP}/video.mp4"
run(["-i", body, "-loop", "1", "-i", wm_path, "-filter_complex",
     f"[1]format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='alpha(X,Y)*({expr})'[w];"
     f"[0][w]overlay=0:0:shortest=1,{YUV}[v]", "-map", "[v]", *ENC, video])

# ======================= 3. Bruitages =======================
N = int(TV * SR) + SR
sfx = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(7)


def place(sig_, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if sig_.ndim == 1:
        sig_ = np.stack([sig_ * (1 - max(pan, 0)), sig_ * (1 + min(pan, 0))], 1)
    j = min(N, i + len(sig_))
    if 0 <= i < N:
        sfx[i:j] += sig_[: j - i] * gain


def env(n, a_, r):
    e = np.ones(n, np.float32)
    na, nr = int(a_ * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def lowpass(x, fc):
    a_ = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s_ = 0.0
    for k in range(len(x)):
        s_ = (1 - a_) * x[k] + a_ * s_; y[k] = s_
    return y


def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n))
    fq = np.fft.rfftfreq(n, 1 / SR)
    X[(fq < lo) | (fq > hi)] = 0
    y = np.fft.irfft(X, n).astype(np.float32)
    return y / (np.abs(y).max() + 1e-9)


def whoosh(d=0.6, lo=300, hi=6000, rise=True):
    n = int(d * SR); x = bandnoise(n, lo, hi); t = np.linspace(0, 1, n)
    shape = (np.sin(np.pi * t) ** 2) if not rise else t ** 2.2 * (1 - t ** 8)
    return (x * shape).astype(np.float32)


def thump(fr_=55, d=0.28):
    n = int(d * SR); t = np.arange(n) / SR
    s_ = np.sin(2 * np.pi * fr_ * t * (1 - 0.35 * t / d)) * np.exp(-t * 16)
    return (s_ + 0.3 * bandnoise(n, 40, 180) * np.exp(-t * 40)).astype(np.float32)


def heartbeat():
    a_ = thump(58); b_ = thump(50, 0.24) * 0.7
    out = np.zeros(int(0.5 * SR), np.float32)
    out[: len(a_)] += a_; out[int(0.16 * SR): int(0.16 * SR) + len(b_)] += b_
    return out


def hit(d=1.4):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 42 * t) * np.exp(-t * 3.5) * 0.9 + bandnoise(n, 2500, 12000) * np.exp(-t * 5) * 0.35).astype(np.float32)


def bell(f0=1318.5, d=1.8):
    n = int(d * SR); t = np.arange(n) / SR
    s_ = sum(a_ * np.sin(2 * np.pi * f0 * m_ * t) * np.exp(-t * dk) for m_, a_, dk in [(1, 1, 2.2), (2.76, .4, 3.5), (5.4, .2, 5), (8.9, .1, 7)])
    return (s_ * env(n, 0.002, 0.3)).astype(np.float32)


def shimmer(d=1.6, base=1760):
    n = int(d * SR); t = np.arange(n) / SR; s_ = np.zeros(n)
    for k, fq in enumerate([base, base * 1.25, base * 1.5, base * 2, base * 2.5]):
        st_ = int(k * 0.07 * SR); tt = t[: n - st_]
        s_[st_:] += np.sin(2 * np.pi * fq * tt) * np.exp(-tt * 2.5) * 0.25
    return (s_ * env(n, 0.01, 0.4)).astype(np.float32)


def click(d=0.035, hi=True):
    n = int(d * SR); t = np.arange(n) / SR
    x = bandnoise(n, 1800 if hi else 600, 9000) * np.exp(-t * 180)
    return (x + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 90) * 0.4).astype(np.float32)


def rustle(d=0.7):
    n = int(d * SR); x = bandnoise(n, 1500, 8000)
    am = np.abs(lowpass(rng.standard_normal(n).astype(np.float32), 18)); am /= am.max() + 1e-9
    return (x * am * env(n, 0.05, 0.2)).astype(np.float32)


def ambience(d, lo, hi, g):
    n = int(d * SR)
    return (bandnoise(n, lo, hi) * env(n, 0.6, 0.6) * g).astype(np.float32)


# Cabinet
place(rustle(0.8), 4.05, 0.22, -0.2)
for k, bt in enumerate([6.95, 7.75, 8.45, 9.0, 9.5, 10.0, 10.65]):
    place(heartbeat(), bt, 0.55 + 0.05 * min(k, 4))
t_fi, t_fo = 8.2, 9.75
place(whoosh(0.45), t_fi - 0.45, 0.35); place(hit(1.3), t_fi, 0.55)
n_ring = int((t_fo - t_fi) * SR)
place((np.sin(2 * np.pi * 3400 * np.arange(n_ring) / SR) * env(n_ring, 0.25, 0.3)).astype(np.float32), t_fi, 0.035)
place(whoosh(0.35, rise=False), t_fo - 0.2, 0.3); place(hit(1.0), t_fo, 0.35)
# Carton : coup sourd puis machine à écrire
place(hit(2.0), t_card + 0.02, 0.45)
for i, ch in enumerate(msg):
    if ch != " ":
        place(click(), t_card + (6 + i * 1.4) / 24, 0.22 + 0.06 * rng.random(), rng.uniform(-0.15, 0.15))
place(whoosh(0.7, 200, 3000, rise=False), t_mirror - 0.35, 0.18)
# Fondus entre les parties : souffles doux
for tt in (t_sofa, t_street, t_pose):
    place(whoosh(0.8, 250, 5000, rise=False), tt - 0.35, 0.16)
# Téléphone
place(click(0.03), t_insta + 0.15, 0.18)
for k in range(3):
    place(whoosh(0.18, 2000, 9000, rise=False), t_insta + 0.45 + k * 0.45, 0.07)
place(shimmer(1.4, 1568), t_smile + 0.1, 0.10)
# Rue, façade, porte et clochette à l'entrée dans le vrai salon
place(ambience(t_logo + 0.4 - t_street, 60, 900, 0.05), t_street)
place(whoosh(0.5, 300, 4000, rise=False), t_facade - 0.25, 0.10)
place(click(0.05, hi=False), t_logo - 0.2, 0.25)
place(bell(1318.5), t_logo - 0.1, 0.16)
place(bell(1046.5), t_logo + 0.1, 0.12)
# Salon : ambiance feutrée, main sur la perruque, pose, reflet, miroir, carton final
place(ambience(t_endcard + 1.0 - t_logo, 120, 2500, 0.025), t_logo)
place(rustle(0.6), t_wig + 0.9, 0.08, 0.15)
place(rustle(0.9), t_pose + 0.5, 0.10, -0.1)
place(whoosh(1.2, 300, 8000, rise=True), t_alone - 1.0, 0.14)
place(shimmer(2.2, 1760), t_alone + 0.05, 0.16)
place(shimmer(1.8, 1568), t_mirror2 + 0.2, 0.10)
place(shimmer(2.0, 1318.5), t_endcard + SIG_T0, 0.12)

sfx = np.tanh(sfx * 1.1) * 0.9
sfx_path = f"{TMP}/sfx.wav"
with wave.open(sfx_path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(sfx[: int(TV * SR)], -1, 1) * 32767).astype(np.int16).tobytes())

# ======================= 4. Musique + mixage =======================
sad, up = f"{ROOT}/musique/musique-triste.mp4", f"{ROOT}/musique/musique-entrainante.mp4"
x_start = t_insta - 0.2                     # entrée de la musique entraînante
sad_out = x_start - 0.5
up_start = 35.0 - (t_alone - x_start)       # la relance du morceau (35 s) tombe quand elle découvre son reflet
up_len = dur(up) - up_start
mus_end = min(TV, x_start + up_len)
fc = (f"[0:a]atrim=start=1.6:end={1.6 + sad_out + 1.6:.3f},asetpts=PTS-STARTPTS,volume=1.5dB,"
      f"afade=t=in:st=0:d=0.2,afade=t=out:st={sad_out:.3f}:d=1.5[sad];"
      f"[1:a]atrim=start={up_start:.3f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.0,"
      f"adelay={int(x_start * 1000)}|{int(x_start * 1000)}[up];"
      f"[sad][up]amix=inputs=2:duration=longest:normalize=0,apad,atrim=0:{TV:.3f},"
      f"afade=t=out:st={mus_end - 2.4:.3f}:d=2.4,volume=-7dB[mus];"
      f"[2:a]aformat=channel_layouts=stereo[fx];"
      f"[mus][fx]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]")
mix = f"{TMP}/mix.wav"
run(["-i", sad, "-i", up, "-i", sfx_path, "-filter_complex", fc, "-map", "[a]", "-c:a", "pcm_s16le", mix])

out = f"{M}/dvora-k-film-v3.mp4"
run(["-i", video, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
     "-shortest", "-movflags", "+faststart", out])
marks = dict(card=t_card, mirror=t_mirror, sofa=t_sofa, insta=t_insta, street=t_street, facade=t_facade, logo=t_logo,
             wig=t_wig, pose=t_pose, alone=t_alone, mirror2=t_mirror2, endcard=t_endcard, up_start=up_start, total=TV)
print(out, {k: round(v, 2) for k, v in marks.items()})
