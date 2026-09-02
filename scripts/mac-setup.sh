#!/bin/bash
# First-time Mac tools for this repo. Run from the repo root:
#   bash scripts/mac-setup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f package.json ]] || ! grep -q '"name": "mcat-gamsat"' package.json; then
  echo "Run this from the MCAT-GAMSAT repo (the folder that contains package.json)."
  echo "If you cloned twice, you are probably in ~/MCAT-GAMSAT/MCAT-GAMSAT — go up one folder."
  exit 1
fi

if [[ -d MCAT-GAMSAT && -f MCAT-GAMSAT/package.json ]]; then
  echo "Nested clone found at $ROOT/MCAT-GAMSAT"
  echo "Delete it and stay in $ROOT:"
  echo "  rm -rf MCAT-GAMSAT"
  exit 1
fi

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Install Apple's command-line tools (a window may open), then re-run this script:"
  echo "  xcode-select --install"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node is not in this Terminal. Cursor's Node does not count."
  echo "Install Homebrew if you do not have it, then:"
  echo '  brew install node'
  echo "If brew is not found after install (Apple Silicon):"
  echo '  eval "$(/opt/homebrew/bin/brew shellenv)"'
  exit 1
fi

MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$MAJOR" -lt 20 ]]; then
  echo "Need Node 20+. This machine has $(node -v)."
  echo "  brew install node"
  exit 1
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@10.33.3 --activate
else
  echo "corepack missing; installing pnpm with npm"
  npm install -g pnpm@10.33.3
fi

echo "pnpm $(pnpm --version) ready. Next:"
echo "  pnpm install"
echo "  FACTORY_TARGET=423500 PATTERN_TARGET=12000 pnpm bootstrap"
echo "  pnpm sit"
echo "Then Safari or Chrome: http://localhost:3000"
