# 🎮 ARCADE HUB — Free Pygame Games on GitHub Pages

Deploy all your pygame games as a free browser-accessible hub using **Pygbag** (WebAssembly) + **GitHub Pages**. Zero cost. Zero server. Infinite users.

---

## 📁 Final Folder Structure

```
pygame-hub/
├── index.html          ← The game hub (already built for you)
├── deploy.sh           ← Automated build script
├── README.md           ← This file
└── games/
    ├── snake/
    │   ├── main.py     ← Your pygame game (MUST be named main.py)
    │   └── assets/     ← Any images/sounds (optional)
    ├── tetris/
    │   └── main.py
    └── platformer/
        ├── main.py
        └── assets/
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Install Pygbag

```bash
pip install pygbag
```

### Step 2 — Prepare your games

Each game needs to live in its own subfolder inside `games/`, with the main file named **`main.py`**.

> ⚠️ **Important:** Your `main.py` must use an async game loop for pygbag to work in the browser:

```python
import asyncio
import pygame

async def main():
    pygame.init()
    screen = pygame.display.set_mode((800, 600))
    clock = pygame.time.Clock()

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # Your game logic here
        screen.fill((0, 0, 0))
        pygame.display.flip()

        await asyncio.sleep(0)  # ← CRITICAL: This line required!
        clock.tick(60)

asyncio.run(main())
```

### Step 3 — Build all games

```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually build a single game:

```bash
python3 -m pygbag --build games/snake/
```

This generates a `build/web/` folder inside each game directory with `index.html` ready for the browser.

### Step 4 — Update the Hub

Open `index.html` and edit the `GAMES` array to match your games:

```javascript
const GAMES = [
  {
    id: "snake",
    title: "SNAKE",
    description: "Classic snake game — eat, grow, don't crash.",
    emoji: "🐍",
    tag: "CLASSIC",
    difficulty: "easy",
    folder: "snake/build/web",   // ← path to the built index.html
    plays: "0"
  },
  // Add more games here...
];
```

### Step 5 — Push to GitHub

```bash
git init
git add .
git commit -m "Launch Arcade Hub 🎮"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/arcade-hub.git
git push -u origin main
```

### Step 6 — Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** → **Pages**
3. Under "Branch", select `main` and `/ (root)`
4. Click **Save**
5. Wait ~2 minutes — your hub is live at:
   ```
   https://YOUR_USERNAME.github.io/arcade-hub/
   ```

---

## 🔧 Common Fixes

| Problem | Fix |
|---|---|
| Game freezes in browser | Add `await asyncio.sleep(0)` inside game loop |
| Assets not loading | Use relative paths — `assets/image.png` not `/assets/image.png` |
| Black screen | Make sure your game loop runs `pygame.display.flip()` |
| Sound issues | Pygame sounds work in browser, but may need user interaction first |

---

## 🎯 Tips to Go Further

- **Custom domain**: In GitHub Pages settings, add your own domain (e.g. `mygames.com`) for free
- **Analytics**: Add [GoatCounter](https://www.goatcounter.com/) (free, privacy-friendly) to track plays
- **More games**: Duplicate any `games/game_name/` folder, drop in a new `main.py`, rebuild, update the hub
- **Thumbnail images**: Replace emojis with real screenshots by adding an `<img>` to the card thumbnail

---

## 📦 Resources

- [Pygbag Docs](https://pygame-web.github.io/)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Pygbag Examples](https://github.com/pygame-web/pygbag/tree/main/test)
