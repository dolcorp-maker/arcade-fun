# GITHUB_UPLOAD — How to Add Games to the Arcade Hub

**Repo:** https://github.com/dolcorp-maker/arcade-fun
**Live hub:** https://dolcorp-maker.github.io/arcade-fun/
**Local folder:** /Users/admin/Downloads/FLAGS/github-pages/

---

## Current structure

```
github-pages/
├── index.html              ← Hub landing page — edit GAMES array here
├── GITHUB_UPLOAD.md        ← This file
├── deploy.sh               ← Only for Pygame/pygbag games, ignore for HTML games
├── README.md               ← General setup notes
└── games/
    └── flag-game/          ← Flag Flow Arena (HTML/JS)
        ├── index.html      (dashboard — hub links here)
        ├── game.html
        ├── scripts/
        ├── styles/
        ├── data/
        └── assets/
```

---

## Adding an HTML/JS game (no build step)

### Step 1 — Copy the game folder

```bash
cp -r /path/to/your-game /Users/admin/Downloads/FLAGS/github-pages/games/your-game
```

### Step 2 — Remove files that must NOT go to GitHub

```bash
cd /Users/admin/Downloads/FLAGS/github-pages/games/your-game
rm -f cert.pem key.pem server.py run.command gamedata.json
```

Make sure the game uses **localStorage only** — no calls to `/api/*` endpoints.
If the game has a Python server, its storage must be converted to localStorage before uploading.

### Step 3 — Add a card to index.html

Open `/Users/admin/Downloads/FLAGS/github-pages/index.html` and add one object to the `GAMES` array:

```js
const GAMES = [
  // ... existing games ...
  {
    id: "your-game",            // unique ID, no spaces
    title: "YOUR GAME TITLE",   // shown on card in ALL CAPS style
    description: "One or two sentences describing the game and how to play.",
    emoji: "🎮",                // big emoji shown on card thumbnail
    tag: "CATEGORY",            // e.g. GEOGRAPHY · ACTION · PUZZLE · TRIVIA
    difficulty: "medium",       // easy | medium | hard
    folder: "your-game",        // must exactly match the folder name in games/
    plays: "0"
  },
];
```

The card will automatically link to `games/your-game/index.html`.

### Step 4 — Commit and push

```bash
cd /Users/admin/Downloads/FLAGS/github-pages
git add .
git commit -m "Add <game name> to arcade hub"
git push origin main
```

GitHub Pages deploys automatically. Live within ~1 minute.

---

## Updating an existing game (e.g. Flag Flow Arena)

The source for Flag Flow Arena is `/Users/admin/Downloads/FLAGS/flag-game-pages/`.
After making changes there, sync to the hub with:

```bash
rm -rf /Users/admin/Downloads/FLAGS/github-pages/games/flag-game
cp -r /Users/admin/Downloads/FLAGS/flag-game-pages/ /Users/admin/Downloads/FLAGS/github-pages/games/flag-game
rm -f /Users/admin/Downloads/FLAGS/github-pages/games/flag-game/cert.pem \
      /Users/admin/Downloads/FLAGS/github-pages/games/flag-game/key.pem \
      /Users/admin/Downloads/FLAGS/github-pages/games/flag-game/gamedata.json \
      /Users/admin/Downloads/FLAGS/github-pages/games/flag-game/HANDOFF.md

cd /Users/admin/Downloads/FLAGS/github-pages
git add .
git commit -m "Update Flag Flow Arena"
git push origin main
```

---

## Adding a Pygame game (needs build step)

Pygame games must be compiled to WebAssembly using pygbag before they work in a browser.

### Step 1 — Prepare the game

Place your game in `games/your-pygame-game/main.py`.
Your game loop **must** be async:

```python
import asyncio, pygame

async def main():
    pygame.init()
    # ... your game setup ...
    while True:
        # ... your game logic ...
        await asyncio.sleep(0)   # ← required, do not remove

asyncio.run(main())
```

### Step 2 — Build with pygbag

```bash
pip install pygbag   # once
python3 -m pygbag --build games/your-pygame-game/
```

This creates `games/your-pygame-game/build/web/index.html`.

### Step 3 — Add card to index.html

Same as the HTML game step above, but set `folder` to the build output:

```js
{ folder: "your-pygame-game/build/web", ... }
```

### Step 4 — Push

```bash
git add . && git commit -m "Add <game name>" && git push origin main
```

---

## Rules summary

| Rule | Detail |
|------|--------|
| No cert files | Never commit `cert.pem` or `key.pem` |
| No server files | Remove `server.py`, `run.command` |
| localStorage only | No `/api/*` calls in JS |
| Folder = card link | `folder: "name"` → links to `games/name/index.html` |
| One folder per game | Each game lives in its own subfolder under `games/` |
