#!/bin/bash
# Package dist/ as a zip ready for itch.io HTML5 upload.
# Usage: bun run package-itch  (or bash scripts/package-itch.sh)
#
# Uses python3 (Ubuntu standard) instead of the zip CLI so that WSL
# environments without the `zip` package can still produce submissions.
set -e

PROJECT_NAME=$(bun -e "console.log(require('./package.json').name)")
DIST_DIR="dist"
OUT="${PROJECT_NAME}-itch.zip"

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: $DIST_DIR not found. Run 'bun run build' first."
  exit 1
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "Error: $DIST_DIR/index.html not found. Build output is invalid."
  exit 1
fi

rm -f "$OUT"

python3 - "$DIST_DIR" "$OUT" <<'PY'
import os
import sys
import zipfile

src_dir, out_path = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for root, _, files in os.walk(src_dir):
        for name in files:
            abs_path = os.path.join(root, name)
            rel_path = os.path.relpath(abs_path, src_dir)
            zf.write(abs_path, rel_path)
PY

echo "Packaged: $OUT"
echo "Upload to itch.io as HTML5 game, set the index file to index.html"
