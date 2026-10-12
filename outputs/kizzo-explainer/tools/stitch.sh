#!/bin/sh
# Assemble l'accroche filmée (vidéo réaliste générée par IA) et la promo motion design :
# fin de l'accroche plongée dans l'écran cassé (zoom + fondu de 0,4 s) → promo qui démarre
# dans ce même écran cassé. Son : l'accroche s'efface sous la promo, -14 LUFS, limiteur.
# usage : sh tools/stitch.sh accroche.mp4 promo.mp4 sortie.mp4 [début_s] [fin_s]
set -e
HOOK="$1"; PROMO="$2"; OUT="$3"; T0="${4:-0}"; T1="${5:-}"
X=0.4
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$HOOK")
[ -n "$T1" ] || T1="$DUR"
LEN=$(echo "$T1 - $T0" | bc -l)
OFF=$(echo "$LEN - $X" | bc -l)
ffmpeg -nostdin -y -v error \
  -ss "$T0" -t "$LEN" -i "$HOOK" -i "$PROMO" \
  -filter_complex "\
[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=60,format=yuv420p,setsar=1[h];\
[1:v]fps=60,format=yuv420p,setsar=1[p];\
[h][p]xfade=transition=zoomin:duration=$X:offset=$OFF[v];\
[0:a]aresample=48000,volume=1.0[ha];[1:a]aresample=48000[pa];\
[ha][pa]acrossfade=d=$X:c1=tri:c2=tri,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,alimiter=limit=0.84:level=false[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 19 -maxrate 12M -bufsize 24M -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
echo "✓ $OUT"
