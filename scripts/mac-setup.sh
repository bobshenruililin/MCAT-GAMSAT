#!/bin/bash
# First-time Mac tools. Run from the repo root, alone — wait for it to finish:
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

if [[ -x /usr/local/bin/brew ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
elif [[ -x /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

if command -v brew >/dev/null 2>&1; then
  export PATH="$(brew --prefix)/bin:${PATH}"
  NODE_PREFIX="$(brew --prefix node 2>/dev/null || true)"
  if [[ -n "${NODE_PREFIX}" && -x "${NODE_PREFIX}/bin/node" ]]; then
    export PATH="${NODE_PREFIX}/bin:${PATH}"
  fi
fi

echo "cpu $(uname -m)"
echo "brew $(command -v brew || echo missing)"
echo "node $(command -v node || echo missing) $(node -v 2>/dev/null || true)"

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Install Apple's command-line tools (a window may open), then re-run this script:"
  echo "  xcode-select --install"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node is not on PATH. Cursor's Node does not count."
  echo "Do not upgrade Node if brew says it is already installed."
  echo "Put Homebrew on PATH (Intel is /usr/local, Apple Silicon is /opt/homebrew):"
  echo '  eval "$(/usr/local/bin/brew shellenv)"'
  echo '  eval "$(/opt/homebrew/bin/brew shellenv)"'
  echo "Then re-run: bash scripts/mac-setup.sh"
  exit 1
fi

MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$MAJOR" -lt 20 ]]; then
  echo "Need Node 20+. This machine has $(node -v)."
  exit 1
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@10.33.3 --activate
else
  echo "corepack missing; installing pnpm with npm"
  npm install -g pnpm@10.33.3
fi

hash -r
echo "pnpm $(command -v pnpm) $(pnpm --version)"
echo "Next (wait — do not paste this into a y/n prompt):"
echo "  pnpm install"
echo "  FACTORY_TARGET=423500 PATTERN_TARGET=12000 pnpm bootstrap"
echo "  pnpm sit"
echo "Then Safari or Chrome: http://localhost:3000"
