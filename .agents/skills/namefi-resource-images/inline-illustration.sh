#!/usr/bin/env bash
# inline-illustration.sh — generate one full-bleed inline article illustration
# (content/assets/<slug>-NN-<name>.jpg) in the same flat-vector house style as
# the OG covers, but without the strict cover layout. The model renders an
# optional short heading and any small labels itself. A small Namefi logotype is
# composited top-right unless --no-logo is given.
#
# Usage:
#   inline-illustration.sh <out_jpg> <scene> [heading] [--no-logo] [--size WxH]
#     <scene>   : vivid description of the illustration (the visual analogy)
#     [heading] : optional short heading rendered top-left (omit or "" for none)
#     --no-logo : skip the Namefi logo (use for purely decorative scenes)
#     --size    : output WxH (default 1200x675, 16:9). Generated at 1536x1024,
#                 center-cropped to the target ratio, then resized.
#
# Requires OPENAI_API_KEY (inject via with-secret.sh from namefi-astra; see og-cover.sh).
set -euo pipefail
OUT_JPG="${1:?usage: inline-illustration.sh <out_jpg> <scene> [heading] [--no-logo] [--size WxH]}"
SCENE="${2:?missing <scene>}"; shift 2
HEADING=""
# an optional heading may follow scene, but only if it is not a flag
if [ $# -gt 0 ] && [ "${1#--}" = "$1" ]; then HEADING="$1"; shift; fi
LOGO=1; OUTW=1200; OUTH=675
while [ $# -gt 0 ]; do case "$1" in
  --no-logo) LOGO=0;;
  --size) shift; OUTW="${1%x*}"; OUTH="${1#*x}";;
esac; shift; done
: "${OPENAI_API_KEY:?OPENAI_API_KEY not set — inject via with-secret.sh}"
LOGO_SRC="${NAMEFI_LOGOTYPE_SVG:-$HOME/ws/d3servelabs/namefi-astra/main/apps/resources/public/logotype.svg}"
W="$(mktemp -d "${TMPDIR:-/tmp}/inl.XXXXXX")"

HEAD_LINE=""
[ -n "$HEADING" ] && HEAD_LINE="- Heading: in the upper-left, a short bold near-black sans-serif heading reading exactly: \"$HEADING\".
"
LOGO_NOTE=""
[ "$LOGO" -eq 1 ] && LOGO_NOTE="- Top-right logo reserve: keep the top-right corner (roughly the top 20% of the height and the right 24% of the width) as completely empty cream/dot-grid background — no object, icon, label or decoration there. A real Namefi logo is added in that corner later; do not draw any logo, wordmark or letter mark yourself.
"

cat > "$W/prompt.txt" <<PROMPT
Vivid, colorful flat-vector editorial illustration. Warm off-white cream background (hex #F6F4EC) filling the ENTIRE frame edge-to-edge, full bleed, no border or frame, with a subtle faint light-gray dot grid. Modern and clean with calm negative space, but the central subject is rich and full-color using accurate brand-inspired colors. Friendly illustration with simple shapes and a clear visual analogy. No photographs, no 3D render, no drop shadows. All text short, crisp and correctly spelled. Do not use a dark-blue or purple-dominant palette, no dark background, no isometric pixel-art.

LAYOUT & SAFE AREA (critical):
- Keep the whole illustration COMPACT and CENTERED with a generous empty cream margin all around it. Leave at least 90px of empty cream background on every side.
- NOTHING — no object, icon, label, plant, coin, character, or letter — may touch, run off, or be clipped by any of the four edges. Do not fill the frame edge-to-edge with objects; the scene should float inside calm cream space.
$HEAD_LINE$LOGO_NOTE
Visual content: $SCENE Only short crisp labels that belong to the illustration; no paragraphs of text, no misspellings, no watermark, no cropped objects.
PROMPT

jq -n --rawfile prompt "$W/prompt.txt" \
  '{model:"gpt-image-2", prompt:$prompt, size:"1536x1024", quality:"high", output_format:"png", n:1}' \
  | curl -sS --max-time 300 https://api.openai.com/v1/images/generations \
      -H "Authorization: Bearer ${OPENAI_API_KEY}" -H 'Content-Type: application/json' -d @- > "$W/resp.json"
if jq -e '.error' "$W/resp.json" >/dev/null 2>&1; then echo "ERROR: $(jq -r '.error.message' "$W/resp.json")" >&2; exit 1; fi
jq -r '.data[0].b64_json // empty' "$W/resp.json" | base64 -D > "$W/raw.png"
[ -s "$W/raw.png" ] || { echo "no image bytes" >&2; exit 1; }

# center-crop 1536x1024 to the target ratio, resize, encode progressive JPG
RW=$(sips -g pixelWidth "$W/raw.png" | awk '/pixelWidth/{print $2}')
RH=$(sips -g pixelHeight "$W/raw.png" | awk '/pixelHeight/{print $2}')
TARGET_H=$(( RW * OUTH / OUTW ))
if [ "$TARGET_H" -le "$RH" ]; then sips -c "$TARGET_H" "$RW" "$W/raw.png" --out "$W/c.png" >/dev/null; else cp "$W/raw.png" "$W/c.png"; fi
sips -z "$OUTH" "$OUTW" "$W/c.png" --out "$W/c.png" >/dev/null

mkdir -p "$(dirname "$OUT_JPG")"
if [ "$LOGO" -eq 1 ]; then
  rsvg-convert -w 116 -h 38 "$LOGO_SRC" -o "$W/logo.png"
  python3 - "$W/c.png" "$W/logo.png" "$OUT_JPG" "$OUTW" "$OUTH" <<'PY'
import sys
from PIL import Image
src, logo, out, ow, oh = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
img = Image.open(src).convert('RGBA'); mark = Image.open(logo).convert('RGBA')
layer = Image.new('RGBA', img.size, (0,0,0,0))
# TOP-RIGHT logo placement (34px from right, 26px from top)
layer.alpha_composite(mark, (ow - mark.width - 34, 26))
Image.alpha_composite(img, layer).convert('RGB').save(out, 'JPEG', quality=62, optimize=True, progressive=True)
PY
else
  cjpeg -quality 62 -progressive -outfile "$OUT_JPG" "$W/c.png" 2>/dev/null || sips -s format jpeg -s formatOptions 62 "$W/c.png" --out "$OUT_JPG" >/dev/null
fi
echo "OK $OUT_JPG  $(sips -g pixelWidth -g pixelHeight "$OUT_JPG" | awk '/pixel/{printf "%s ",$2}') $(( $(stat -f%z "$OUT_JPG")/1024 ))KB"
rm -rf "$W"
