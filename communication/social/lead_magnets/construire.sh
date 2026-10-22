#!/usr/bin/env bash
# Construit les PDF des ressources gratuites depuis les pages HTML de sources/ (Chromium sans interface).
# Usage : ./construire.sh [dossier_apercus]   → avec un dossier, exporte aussi chaque page en PNG pour relecture.
set -euo pipefail
ICI="$(cd "$(dirname "$0")" && pwd)"
CHROME="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
APERCUS="${1:-}"
for nom in contrat_ecran methode_10_minutes phrases_anti_crise; do
  [ -f "$ICI/sources/$nom.html" ] || continue
  sortie="$ICI/kizzo-${nom//_/-}.pdf"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$sortie" "file://$ICI/sources/$nom.html" 2>/dev/null
  echo "$(basename "$sortie") : $(pdfinfo "$sortie" | awk '/^Pages/ {print $2}') page(s)"
  if [ -n "$APERCUS" ]; then
    mkdir -p "$APERCUS"; pdftoppm -r 70 -png "$sortie" "$APERCUS/$nom"
  fi
done
