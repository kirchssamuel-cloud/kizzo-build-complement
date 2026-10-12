# Planche contact : python3 tools/sheet.py out.png img1 img2 ... (4 par ligne)
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
W, H = 300, 533
cols = min(4, len(files))
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * H), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS)
    x, y = (i % cols) * W, (i // cols) * H
    sheet.paste(im, (x, y))
    d.text((x + 6, y + 6), f.split('/')[-1], fill=(255, 255, 0))
sheet.save(out)
