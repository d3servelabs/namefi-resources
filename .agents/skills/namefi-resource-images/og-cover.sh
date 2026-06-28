#!/usr/bin/env bash
# og-cover.sh — generate one Namefi resources OpenGraph/Twitter cover card
# (content/assets/<slug>-og.jpg) in the canonical flat-vector house style.
#
# The model (ChatGPT Image 2 / gpt-image-2) renders the headline, subtitle and
# any in-art labels itself (it is good at crisp text). The official Namefi
# logotype is composited in afterward — TOP-RIGHT — from the real SVG, and the
# bottom ~22% is kept empty as bleed for the caption X/Twitter overlays.
#
# Usage:
#   og-cover.sh <out_jpg> <headline_line1> <headline_line2> <subtitle> <visual>
#
# Requires OPENAI_API_KEY in env. From the workspace, inject it from
# namefi-astra's Infisical (resources has no .infisical.json):
#   cd ~/ws/d3servelabs/namefi-astra/main && \
#   ~/dotfiles/tools/infisical/with-secret.sh --match '^OPENAI_API_KEY$' --as OPENAI_API_KEY -- \
#     bash <this>/og-cover.sh content/assets/foo-og.jpg "Line 1" "Line 2" "Subtitle." "Scene description."
#
# Batch many cards by reading a TSV of
#   <file>\t<h1>\t<h2>\t<subtitle>\t<visual>
# and calling this script per row (≤4 in parallel is comfortable).
set -euo pipefail
OUT_JPG="$1"; H1="$2"; H2="$3"; SUB="$4"; VISUAL="$5"
: "${OPENAI_API_KEY:?OPENAI_API_KEY not set — inject via with-secret.sh}"

# Official logo source (rasterized fresh each run; never use generated logo text).
LOGO_SRC="${NAMEFI_LOGOTYPE_SVG:-$HOME/ws/d3servelabs/namefi-astra/main/apps/resources/public/logotype.svg}"
W="$(mktemp -d "${TMPDIR:-/tmp}/og.XXXXXX")"
trap 'rm -rf "$W"' EXIT   # clean up the temp dir on any exit (incl. failure)
rsvg-convert -w 132 -h 43 "$LOGO_SRC" -o "$W/logo.png"

cat > "$W/prompt.txt" <<PROMPT
Vivid, colorful flat-vector editorial illustration. Warm off-white cream background (hex #F6F4EC) filling the ENTIRE frame edge-to-edge, full bleed, no border or frame, with a subtle faint light-gray dot grid. Modern and clean with calm negative space, but the central subject is rich and full-color using accurate brand-inspired colors. Friendly illustration with simple shapes and a clear visual analogy. No photographs, no 3D render, no drop shadows. All text short, crisp and correctly spelled.

Wide horizontal OpenGraph banner, native wide aspect ratio, final target 1200x630.

STRICT LAYOUT MAP:
- Top-right logo reserve: x 930-1180, y 24-120 must remain completely empty cream/dot-grid background. No text, no logo, no icon, no tag, no line, no decoration in this rectangle. A real logo will be added there later.
- Headline block: upper-left, x 80-840, y 70-210.
- Subtitle: below headline, x 85-840, y 222-268.
- Main illustration: keep it COMPACT and CENTERED strictly inside x 110-1090, y 290-470, floating in calm cream space. NO part of it — no palm, tag, coin, character, icon, or label — may extend above y 290, below y 480, or touch the left/right edges. Do not fill the frame; surround the scene with generous empty cream.
- Bottom bleed band: the ENTIRE bottom strip from x 0-1200, y 485-630 (about the bottom 22%) must stay completely empty cream/dot-grid background — no text, no objects, no labels, no plants, no decoration of any kind. This is reserved safe space for a social-media caption that platforms (e.g. X/Twitter) overlay along the bottom of the card.

SAFE AREA: keep every letter, icon, and important object at least 75px from the top edge, 80px from the left/right edges, and at least 150px from the bottom edge. NOTHING may touch, run off, or be clipped by any canvas edge except the plain cream background.

Do not include any Namefi logo, Namefi wordmark, letter N brand mark, signature, watermark, or extra publisher branding inside the generated art.

Exact readable text only:
Headline line 1: "$H1"
Headline line 2: "$H2"
Subtitle: "$SUB"

Visual content: $VISUAL Use vivid, friendly brand-inspired flat colors, but do not create photorealistic logos. Keep the whole scene in the upper two-thirds so the bottom band stays empty. No extra readable text besides the specified headline and subtitle, except short crisp labels (like ".com", ".net") that belong to the illustration and sit above the bottom bleed band.

Avoid: any text or object in the top-right logo reserve or the bottom bleed band, misspelled text, duplicate title text, extra paragraphs of text, cropped text, cropped objects, text at the extreme top or bottom, dark blurred stock-style backgrounds, gradients, shadows, 3D effects, photo realism, watermarks.
PROMPT

jq -n --rawfile prompt "$W/prompt.txt" \
  '{model:"gpt-image-2", prompt:$prompt, size:"1216x640", quality:"high", output_format:"png", n:1}' \
  | curl -sS --max-time 300 https://api.openai.com/v1/images/generations \
      -H "Authorization: Bearer ${OPENAI_API_KEY}" -H 'Content-Type: application/json' -d @- > "$W/resp.json"

if jq -e '.error' "$W/resp.json" >/dev/null 2>&1; then echo "ERROR: $(jq -r '.error.message' "$W/resp.json")" >&2; exit 1; fi
jq -r '.data[0].b64_json // empty' "$W/resp.json" | base64 -D > "$W/raw.png"
[ -s "$W/raw.png" ] || { echo "no image bytes returned" >&2; exit 1; }

mkdir -p "$(dirname "$OUT_JPG")"
python3 - "$W/raw.png" "$W/logo.png" "$OUT_JPG" <<'PY'
import sys
from PIL import Image
raw, logo_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
img = Image.open(raw).convert('RGB').resize((1200, 630), Image.Resampling.LANCZOS)
mark = Image.open(logo_path).convert('RGBA')
layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
# TOP-RIGHT logo placement (44px from right, 40px from top)
layer.alpha_composite(mark, (1200 - mark.width - 44, 40))
Image.alpha_composite(img.convert('RGBA'), layer).convert('RGB').save(out, 'JPEG', quality=92, optimize=True, progressive=True)
PY
echo "OK $OUT_JPG  $(sips -g pixelWidth -g pixelHeight "$OUT_JPG" | awk '/pixel/{printf "%s ",$2}') $(( $(stat -f%z "$OUT_JPG")/1024 ))KB"
rm -rf "$W"
