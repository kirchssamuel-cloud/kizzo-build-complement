#!/usr/bin/env bash
# Encode rendered PNG frames into the delivery MP4 (H.264 High, yuv420p, AAC), with the sound layer.
set -euo pipefail
cd "$(dirname "$0")"
LANG_CODE="${1:-en}"; UP=$(echo "$LANG_CODE" | tr a-z A-Z)
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "build/frames-$LANG_CODE/f%05d.png" -i build/kizzo-sfx.wav \
  -c:v libx264 -preset slow -crf 15 -tune film -profile:v high -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "../kizzo-film-v2-$UP-1080p.mp4"
echo "wrote ../kizzo-film-v2-$UP-1080p.mp4"
