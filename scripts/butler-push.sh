#!/bin/bash
# butler-push.sh — push machines-itch.zip to itch.io via butler.
#
# Reads BUTLER_API_KEY from .env (gitignored). Never prints the key or
# any other .env value to stdout/stderr.
#
# Usage: bash scripts/butler-push.sh

set -euo pipefail

ZIP="machines-itch.zip"
TARGET="risingore/soul-strike:html"
BUTLER_BIN="${BUTLER_BIN:-$HOME/.local/bin/butler}"

if [ ! -f "$ZIP" ]; then
  echo "Error: $ZIP not found. Run 'bun run package-itch' (or '/dist') first." >&2
  exit 1
fi

if [ ! -x "$BUTLER_BIN" ]; then
  echo "Error: butler not found at $BUTLER_BIN." >&2
  echo "Install butler from https://itch.io/docs/butler/installing.html and run 'butler login'." >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "Error: .env not found. Copy .env.example to .env and fill BUTLER_API_KEY." >&2
  exit 1
fi

# Load .env into environment without echoing any value.
set -a
# shellcheck disable=SC1091
source .env
set +a

if [ -z "${BUTLER_API_KEY:-}" ]; then
  echo "Error: BUTLER_API_KEY missing in .env (key is empty)." >&2
  exit 1
fi

# butler reads BUTLER_API_KEY from environment.
# --userversion stamps the build with a timestamp for itch's build history.
USERVERSION="$(date +%Y%m%d-%H%M)"
echo "Pushing $ZIP -> $TARGET (version: $USERVERSION)"
"$BUTLER_BIN" push "$ZIP" "$TARGET" --userversion "$USERVERSION"
