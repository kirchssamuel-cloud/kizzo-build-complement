import cv2, numpy as np, sys
src, out, scale = sys.argv[1], sys.argv[2], float(sys.argv[3])
img = cv2.imread(src); H, W = img.shape[:2]
ox, oy = 1620, 2180                      # origine du recadrage de travail (pleine résolution)
def Z(x, y): return (int(ox + x/4), int(oy + y/4))   # coordonnées zoom x4 -> pleine résolution
# contour de la façade + petite partie à droite (coordonnées lues sur le zoom)
face = np.array([Z(240,330),Z(300,298),Z(480,298),Z(560,360),Z(592,470),Z(585,700),Z(545,830),Z(470,905),Z(340,930),Z(250,900),Z(215,780),Z(228,560),Z(232,400)], np.int32)
side = np.array([Z(585,505),Z(625,520),Z(660,570),Z(662,640),Z(630,690),Z(585,700)], np.int32)
M = np.zeros((H, W), np.uint8)
cv2.fillPoly(M, [face], 255); cv2.fillPoly(M, [side], 255)
dil = cv2.dilate(M, np.ones((7,7), np.uint8))
# 1) extraire l'appareil (alpha doux)
x0,y0,bw,bh = cv2.boundingRect(face); x1,y1 = x0+bw,y0+bh
pad=10
a = cv2.GaussianBlur(M,(0,0),1.6).astype(np.float32)/255
dev = img.copy()
# 2) combler la zone : peau reconstruite + ombre du conduit
filled = cv2.inpaint(img, dil, 6, cv2.INPAINT_TELEA)
rng = np.random.default_rng(3)
g = cv2.GaussianBlur(rng.standard_normal((H,W)).astype(np.float32),(0,0),0.9)*7.0
dm = cv2.GaussianBlur(dil,(0,0),3).astype(np.float32)/255
filled = np.clip(filled.astype(np.float32)+ (g*dm)[...,None], 0, 255).astype(np.uint8)
cx, cy = Z(450, 640)
cy += 0
canal = np.zeros((H,W), np.float32)
rx, ry = int(36*scale*1.55), int(70*scale*1.55)
cv2.ellipse(canal, (cx,cy), (rx,ry), 8, 0, 360, 1.0, -1)
canal = cv2.GaussianBlur(canal, (0,0), 5)
dark = np.array([40,52,92], np.float32)  # BGR -> RGB(92,52,40) brun chaud  # BGR brun-rouge sombre
f = filled.astype(np.float32)
f = f*(1-0.85*canal[...,None]) + dark*(0.85*canal[...,None])
# 3) coller l'appareil réduit
bx0,by0,bx1,by1 = x0-pad,y0-pad,x1+pad+60,y1+pad
patch = dev[by0:by1, bx0:bx1].astype(np.float32); pa = a[by0:by1, bx0:bx1]
ph, pw = patch.shape[:2]
nh, nw = int(ph*scale), int(pw*scale)
patch_s = cv2.resize(patch, (nw,nh), interpolation=cv2.INTER_AREA)
pa_s = cv2.resize(pa, (nw,nh), interpolation=cv2.INTER_AREA)
# ombre de contact douce
sh = np.zeros((H,W), np.float32)
tx, ty = cx - nw//2 + 6, cy - nh//2          # centré dans le conduit
sh[ty:ty+nh, tx:tx+nw] = pa_s
sh = cv2.GaussianBlur(sh, (0,0), 6)
f = f*(1-0.35*sh[...,None])
roi = f[ty:ty+nh, tx:tx+nw]
f[ty:ty+nh, tx:tx+nw] = roi*(1-pa_s[...,None]) + patch_s*pa_s[...,None]
cv2.imwrite(out, np.clip(f,0,255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
print("hauteur appareil", int((y1-y0+2*pad)*scale), "px pour une oreille de ~540 px")
