#!/usr/bin/env bash
# Re-render architecture + app-flow diagrams from Mermaid sources.
# Requires: mmdc (@mermaid-js/mermaid-cli) and Chrome/Chromium.
set -euo pipefail
cd "$(dirname "$0")"

export PUPPETEER_EXECUTABLE_PATH="${PUPPETEER_EXECUTABLE_PATH:-/usr/bin/google-chrome-stable}"
CFG="mermaid-config.json"
BG="#F7F4ED"
SCALE=2
WIDTH=1400

for name in architecture app-flow; do
  echo "Rendering ${name}..."
  mmdc -i "${name}.mmd" -o "${name}.png" -c "$CFG" -b "$BG" -s "$SCALE" -w "$WIDTH"
  mmdc -i "${name}.mmd" -o "${name}.svg" -c "$CFG" -b "$BG"
done

echo "Done: architecture.png/svg, app-flow.png/svg"
