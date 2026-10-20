"""Assemblage du film Dvora K : segments, textes, carton machine à écrire, carton final.

Usage : python3 build_film.py <dossier_polices>
Sortie : montage/dvora-k-film-v1.mp4
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = f"{ROOT}/rushes"
M = f"{ROOT}/montage"
FONTS = sys.argv[1]
TMP = f"{M}/_build"
os.makedirs(TMP, exist_ok=True)

W, H, FPS = 1080, 1920, 24
SERIF = f"{FONTS}/f3.ttf"          # Cormorant Garamond Regular
SERIF_I = f"{FONTS}/f1.ttf"        # Cormorant Garamond Italic
SCRIPT = f"{FONTS}/f4.ttf"         # Great Vibes
SANS = "/usr/share/fonts/opentype/inter/Inter-Light.otf"
ENC = ["-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-r", str(FPS)]
YUV = "format=yuv420p"


def run(args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


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
        sh = sh.filter(ImageFilter.GaussianBlur(10))
        img = Image.alpha_composite(img, sh)
    img = Image.alpha_composite(img, glyphs)
    img.save(path)
    return path


def overlay_text(src, dst, png, t_in, t_out, fade=0.35):
    run(["-i", src, "-loop", "1", "-i", png, "-filter_complex",
         f"[1]format=rgba,fade=t=in:st={t_in}:d={fade}:alpha=1,fade=t=out:st={t_out - fade}:d={fade}:alpha=1[t];"
         f"[0][t]overlay=0:0:shortest=1,{YUV}[v]", "-map", "[v]", *ENC, dst])


def caption(text):
    return [(text, SERIF_I, 96, 1, (255, 255, 255, 255))]


segs = []

# 1. Cabinet : large, mains, compte-rendu, larmes, flash, retour à la réalité
cab = f"{TMP}/01-cabinet.mp4"
run(["-i", f"{R}/video1-cabinet.mp4", "-i", f"{R}/video-2b-compte-rendu.mp4", "-i", f"{R}/video-4-flash.mp4", "-filter_complex",
     f"[0:v]trim=0.3:2.8,setpts=PTS-STARTPTS,{YUV}[a];"
     f"[0:v]trim=3.3:4.8,setpts=PTS-STARTPTS,{YUV}[b];"
     f"[1:v]{YUV},scale=2160:3840,zoompan=z='1.12+0.18*on/97':x='iw/2-(iw/zoom/2)':y='ih*0.46-(ih/zoom/2)':d=1:s=1080x1920:fps=24,trim=0.6:3.4,setpts=PTS-STARTPTS[c];"
     f"[0:v]trim=5.8:7.2,setpts=PTS-STARTPTS,{YUV},fade=t=out:st=1.28:d=0.12:color=white[d];"
     f"[2:v]trim=1.5:3.1,setpts=PTS-STARTPTS,scale=1188:2112,crop=1080:1920:4:57,curves=all='0/0.04 0.5/0.6 1/1',"
     f"colorbalance=rs=-0.06:bs=0.10:rm=-0.04:bm=0.06,eq=saturation=0.65,vignette=PI/6,{YUV},"
     f"fade=t=in:st=0:d=0.15:color=white,fade=t=out:st=1.48:d=0.12:color=white[e];"
     f"[0:v]trim=8.0:10.04,setpts=PTS-STARTPTS,{YUV},fade=t=in:st=0:d=0.15:color=white[f];"
     f"[a][b][c][d][e][f]concat=n=6:v=1:a=0[v]", "-map", "[v]", *ENC, f"{TMP}/01-raw.mp4"])
# texte sur le retour à la réalité (les 2,04 dernières secondes)
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{TMP}/01-raw.mp4"]))
overlay_text(f"{TMP}/01-raw.mp4", cab, text_layer(f"{TMP}/t1.png", caption("Le jour où tout bascule."), scrim=True), dur - 1.85, dur)
segs.append(cab)

# 2. Carton « Quelques semaines plus tard » écrit lettre par lettre
card_dir = f"{TMP}/card"
os.makedirs(card_dir, exist_ok=True)
msg = "Quelques semaines plus tard"
f = ImageFont.truetype(SERIF_I, 92)
tmpd = ImageDraw.Draw(Image.new("RGB", (W, H)))
widths = [tmpd.textlength(c, font=f) for c in msg]
track = 2
total_w = sum(widths) + track * (len(msg) - 1)
n_frames = int(3.0 * FPS)
start, per_letter, letter_fade = 6, 1.4, 4      # frames
end_fade_start = n_frames - 10
for k in range(n_frames):
    img = Image.new("RGB", (W, H), (0, 0, 0))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x = (W - total_w) / 2
    for i, (c, cw) in enumerate(zip(msg, widths)):
        appear = start + i * per_letter
        a = max(0.0, min(1.0, (k - appear) / letter_fade))
        if k >= end_fade_start:
            a *= max(0.0, 1 - (k - end_fade_start) / 10)
        if a > 0:
            d.text((x, 900), c, font=f, fill=(255, 255, 255, int(255 * a)))
        x += cw + track
    img.paste(layer, (0, 0), layer)
    img.save(f"{card_dir}/{k:03d}.png")
card = f"{TMP}/02-carton.mp4"
run(["-framerate", str(FPS), "-i", f"{card_dir}/%03d.png", *ENC, card])
segs.append(card)

# 3. Miroir + lit
s3 = f"{TMP}/03-miroir-lit.mp4"
run(["-i", f"{R}/video-5-miroir.mp4", "-i", f"{R}/video-6-lit.mp4", "-filter_complex",
     f"[0:v]trim=1.2:3.7,setpts=PTS-STARTPTS,{YUV}[a];[1:v]trim=0.8:4.0,setpts=PTS-STARTPTS,{YUV}[b];"
     f"[a][b]concat=n=2:v=1:a=0[v]", "-map", "[v]", *ENC, s3])
segs.append(s3)

# 4. Canapé, Instagram, sourire (ralenti léger) + texte
raw4 = f"{TMP}/04-raw.mp4"
run(["-i", f"{R}/video-789-multiplan.mp4", "-i", f"{R}/video-8-instagram-higgsfield.mp4", "-filter_complex",
     f"[0:v]trim=0:1.917,setpts=PTS-STARTPTS,{YUV}[a];"
     f"[1:v]trim=0.8:2.5,setpts=PTS-STARTPTS,{YUV}[b];"
     f"[0:v]trim=4.083:6.04,setpts=1.35*(PTS-STARTPTS),minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1,{YUV}[c];"
     f"[a][b][c]concat=n=3:v=1:a=0[v]", "-map", "[v]", *ENC, raw4])
dur4 = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", raw4]))
s4 = f"{TMP}/04-decouverte.mp4"
overlay_text(raw4, s4, text_layer(f"{TMP}/t2.png", caption("Et si je restais moi ?"), scrim=True), dur4 - 2.35, dur4)
segs.append(s4)

# 5. Arrivée au salon (rue, façade, entrée)
s5 = f"{TMP}/05-arrivee.mp4"
run(["-i", f"{M}/sequence-salon-arrivee-v1.mp4", "-vf", YUV, *ENC, s5])
segs.append(s5)

# 6. Pose de la perruque (image validée, en attendant la vidéo) + texte
still = f"{ROOT}/images-cles/plan-13.jpg"
raw6 = f"{TMP}/06-raw.mp4"
run(["-loop", "1", "-i", still, "-filter_complex",
     f"[0]scale=2160:3870,crop=2160:3840,zoompan=z='1.0+0.06*on/96':x='iw/2-(iw/zoom/2)':y='ih*0.40-(ih/zoom/2)':d=1:s=1080x1920:fps=24,"
     f"trim=0:4,setpts=PTS-STARTPTS,{YUV}[v]", "-map", "[v]", *ENC, raw6])
s6 = f"{TMP}/06-pose.mp4"
overlay_text(raw6, s6, text_layer(f"{TMP}/t3.png", caption("Rester soi. Rester belle."), y_center=1560, scrim=True), 1.2, 4.0)
segs.append(s6)

# 7. Carton final sur fond flou du salon
bg = Image.open(still).convert("RGB").resize((W, int(W * 5504 / 3072)))
bg = bg.crop((0, (bg.height - H) // 2, W, (bg.height - H) // 2 + H)).filter(ImageFilter.GaussianBlur(28))
dark = Image.new("RGB", (W, H), (18, 12, 10))
bg = Image.blend(bg, dark, 0.62)
bg.save(f"{TMP}/end-bg.png")
L1 = text_layer(f"{TMP}/e1.png", [("Dvora K", SCRIPT, 190, 0, (255, 255, 255, 255))], y_center=760, shadow=False)
L2 = text_layer(f"{TMP}/e2.png", [("PERRUQUES NATURELLES", SANS, 34, 9, (235, 222, 205, 255)),
                                   ("sur-mesure, posées avec douceur", SERIF_I, 46, 1, (235, 222, 205, 255))], y_center=960, shadow=False)
L3 = text_layer(f"{TMP}/e3.png", [("65 rue d'Hautpoul · Paris 19e", SERIF, 50, 1, (255, 255, 255, 255)),
                                   ("@dvora_k_perruque", SANS, 38, 3, (255, 255, 255, 230))], y_center=1180, shadow=False)
L4 = text_layer(f"{TMP}/e4.png", [("Prenez rendez-vous", SERIF_I, 64, 1, (255, 255, 255, 255))], y_center=1390, shadow=False)
s7 = f"{TMP}/07-fin.mp4"
run(["-loop", "1", "-t", "5", "-i", f"{TMP}/end-bg.png", "-loop", "1", "-i", L1, "-loop", "1", "-i", L2,
     "-loop", "1", "-i", L3, "-loop", "1", "-i", L4, "-filter_complex",
     "[1]format=rgba,fade=t=in:st=0.3:d=0.8:alpha=1[l1];[2]format=rgba,fade=t=in:st=0.9:d=0.7:alpha=1[l2];"
     "[3]format=rgba,fade=t=in:st=1.4:d=0.7:alpha=1[l3];[4]format=rgba,fade=t=in:st=1.9:d=0.7:alpha=1[l4];"
     f"[0]format=rgba[b];[b][l1]overlay=shortest=1[x1];[x1][l2]overlay=shortest=1[x2];[x2][l3]overlay=shortest=1[x3];"
     f"[x3][l4]overlay=shortest=1,fade=t=out:st=4.4:d=0.6,{YUV}[v]", "-map", "[v]", "-t", "5", *ENC, s7])

# Assemblage : coupes franches, fondu enchaîné entre la pose et le carton final
d6 = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", s6]))
body = f"{TMP}/body.mp4"
lst = f"{TMP}/list.txt"
with open(lst, "w") as fh:
    for s in segs[:-1]:
        fh.write(f"file '{s}'\n")
run(["-f", "concat", "-safe", "0", "-i", lst, *ENC, body])
out = f"{M}/dvora-k-film-v1.mp4"
run(["-i", body, "-i", s6, "-i", s7, "-f", "lavfi", "-t", "60", "-i", "anullsrc=r=48000:cl=stereo", "-filter_complex",
     f"[1][2]xfade=transition=fade:duration=0.6:offset={d6 - 0.6:.3f}[end];[0][end]concat=n=2:v=1:a=0,{YUV}[v]",
     "-map", "[v]", "-map", "3:a", "-shortest", *ENC, "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out])
print(out)
