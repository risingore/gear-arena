#!/usr/bin/env bash
# SOUL STRIKE release pipeline — tsc + build + package-itch in one command.
#
# Usage:
#   bun run release             # local build + itch zip
#   bun run release deploy      # + wrangler deploy (requires Cloudflare auth)
#
# Exits non-zero on any step failure so CI can fail fast.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Type check"
bunx tsc --noEmit

echo "==> Production build"
bun run build

echo "==> Bundle size report"
find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) -exec du -h {} +

echo "==> itch.io zip"
bun run package-itch

ZIP_PATH="$ROOT/machines-itch.zip"
if [ -f "$ZIP_PATH" ]; then
  SIZE=$(du -h "$ZIP_PATH" | cut -f1)
  echo "    $ZIP_PATH ($SIZE)"
fi

if [ "${1:-}" = "deploy" ]; then
  echo "==> Cloudflare Workers deploy"
  bun run deploy
fi

echo ""
echo "Release ready."
