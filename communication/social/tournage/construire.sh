#!/usr/bin/env bash
# Construit la fiche de tournage (PDF de pages de téléphone) : génère le HTML, puis Chromium sans interface l'imprime.
# Usage : ./construire.sh [dossier_apercus]   → avec un dossier, exporte aussi chaque page en PNG pour relecture.
set -euo pipefail
ICI="$(cd "$(dirname "$0")" && pwd)"
CHROME="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
python3 -I "$ICI/generer_fiche.py"
sortie="$ICI/fiche-tournage-FC1-FC3.pdf"
"$CHROME" --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$sortie" "file://$ICI/sources/fiche_tournage.html" 2>/dev/null
echo "$(basename "$sortie") : $(pdfinfo "$sortie" | awk '/^Pages/ {print $2}') page(s), $(pdfinfo "$sortie" | awk '/^Page size/ {print $3 "x" $5 " pt"}')"
if [ -n "${1:-}" ]; then mkdir -p "$1"; pdftoppm -r 60 -png "$sortie" "$1/fiche"; fi
