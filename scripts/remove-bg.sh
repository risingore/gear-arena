#!/bin/bash
# Batch background removal for all images in assets-raw/.
#
# Usage:
#   bun run remove-bg
#   bash scripts/remove-bg.sh
#
# Reads every .jpg / .jpeg / .png from assets-raw/ (recursively),
# runs rembg to strip the background, and writes transparent PNGs
# into public/assets/images/ with the same base name.
#
# Requires: .venv with rembg installed (setup: python3 -m venv .venv && .venv/bin/pip install rembg[cli])

set -e

VENV_REMBG="$(dirname "$0")/../.venv/bin/rembg"
SRC_DIR="$(dirname "$0")/../assets-raw"
DST_DIR="$(dirname "$0")/../public/assets/images"

if [ ! -x "$VENV_REMBG" ]; then
  echo "Error: rembg not found at $VENV_REMBG"
  echo "Run: python3 -m venv .venv && .venv/bin/pip install rembg[cli]"
  exit 1
fi

mkdir -p "$DST_DIR"

COUNT=0
for src in "$SRC_DIR"/*.{jpg,jpeg,png,JPG,JPEG,PNG} "$SRC_DIR"/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
  [ -f "$src" ] || continue
  base="$(basename "$src")"
  name="${base%.*}"
  dst="$DST_DIR/${name}.png"

  echo "Processing: $base → ${name}.png"
  "$VENV_REMBG" i "$src" "$dst"
  COUNT=$((COUNT + 1))
done

echo ""
echo "Done. $COUNT image(s) processed → $DST_DIR/"
