#!/bin/bash
# =============================================================
#  ARCADE HUB - Deployment Script
#  Run this from inside your pygame-hub/ folder
# =============================================================

set -e

echo ""
echo "  ██████  █████  ██████   ██████  █████  ██████  ███████ "
echo " ██   ██ ██   ██ ██   ██ ██      ██   ██ ██   ██ ██      "
echo " ███████ ██████  ██████  ██      ███████ ██   ██ █████   "
echo " ██   ██ ██   ██ ██   ██ ██      ██   ██ ██   ██ ██      "
echo " ██   ██ ██   ██ ██   ██  ██████ ██   ██ ██████  ███████ "
echo "                      DEPLOY SCRIPT"
echo ""

GAMES_DIR="./games"

if [ ! -d "$GAMES_DIR" ]; then
  echo "❌  No 'games/' directory found. Please create it first."
  echo "    Structure expected:"
  echo "    games/"
  echo "    ├── game1/"
  echo "    │   └── main.py"
  echo "    ├── game2/"
  echo "    │   └── main.py"
  exit 1
fi

echo "✅  Found games/ directory"
echo ""

# Install pygbag if not present
if ! python3 -m pygbag --help &>/dev/null 2>&1; then
  echo "📦  Installing pygbag..."
  pip install pygbag
fi

echo "🎮  Building games with pygbag..."
echo ""

for game_dir in "$GAMES_DIR"/*/; do
  game_name=$(basename "$game_dir")
  main_file="$game_dir/main.py"

  if [ ! -f "$main_file" ]; then
    echo "  ⚠️  Skipping $game_name — no main.py found"
    continue
  fi

  echo "  🔨 Building: $game_name"
  python3 -m pygbag --build "$game_dir" 2>&1 | grep -v "^$" | head -20
  echo "  ✅  Done: $game_name"
  echo ""
done

echo "🌐  All games built!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NEXT: Push to GitHub Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  git add ."
echo "  git commit -m 'Deploy arcade hub'"
echo "  git push origin main"
echo ""
echo "  Then in GitHub → Settings → Pages → set branch to main"
echo "  Your hub will be live at: https://YOUR_USERNAME.github.io/REPO_NAME/"
echo ""
