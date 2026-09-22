#!/usr/bin/env bash
# Render DESIGN.md to the PDF that the Google Ads API Basic Access application
# asks for (question 8 accepts .pdf, .doc or .rtf only).
#
# Needs pandoc and Google Chrome; no LaTeX. Run from this directory.
set -euo pipefail
cd "$(dirname "$0")"
out="dist/namefi-keyword-volume-design.pdf"
mkdir -p dist
pandoc DESIGN.md -f gfm -t html5 --standalone \
  --metadata title="Namefi — Keyword Volume Tool, Design Document" \
  -c design-pdf.css --embed-resources -o dist/design.html
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$out" dist/design.html 2>/dev/null
rm -f dist/design.html
echo "wrote $out ($(wc -c <"$out" | tr -d ' ') bytes)"
