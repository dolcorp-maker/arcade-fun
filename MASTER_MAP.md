# Master Map

## Project Snapshot
- Repository purpose now: a GitHub Pages arcade hub that currently mixes educational games and playful experiments.
- Primary family goal from the latest conversation: build educational games for kids for a father, 8-year-old son, and 5-year-old daughter.
- Hosting model: static files only, served from GitHub Pages.

## Top Level
- `index.html`
  - Main live hub page.
  - Registers 3 playable entries: `English_game_v2`, `flag-game`, `fart-machine`.
  - Uses a `file` override for English Galaxy, pointing to `games/English_game_v2/index_final.html`.
- `index-arcade-room.html`
  - Alternate arcade-room style hub.
  - Currently untracked in git.
  - Still points English Galaxy to the older `games/English_game/` folder.
- `README.md`
  - Legacy documentation from the original pygbag/pygame arcade-hub setup.
  - No longer matches the current repo well.
- `GITHUB_UPLOAD.md`
  - More relevant than `README.md`, but also partially outdated.
  - Still describes the repo as if `flag-game` were the main current game.
- `deploy.sh`
  - Pygbag-oriented build helper from the older repo direction.
  - Not used by the current static HTML games.
- `vscode-agent-pack/`
  - Local task-agent guidance pack for common work modes.
  - Contains reusable role definitions, command prompts, and lightweight standards docs.

## Agent Pack
- `vscode-agent-pack/.agents/code-reviewer.md`
  - Review-focused guidance: bugs, fragility, duplication, edge cases, naming.
- `vscode-agent-pack/.agents/debug-triage.md`
  - Root-cause workflow for diagnosing and fixing issues.
- `vscode-agent-pack/.agents/frontend-design.md`
  - UI-focused guidance: clean, responsive design while preserving logic.
- `vscode-agent-pack/.agents/implementation-planner.md`
  - Planning template for turning feature requests into execution steps.
- `vscode-agent-pack/.agent-commands/`
  - Short command docs that map user intents to those agent roles.
- `vscode-agent-pack/docs/`
  - Shared guidance covering architecture, coding standards, and UI rules.

## How To Use The Agent Pack In This Repo
- Use `implementation-planner` when the task is planning-heavy before coding.
- Use `debug-triage` when the user reports a bug or broken behavior.
- Use `frontend-design` when improving visuals or layout.
- Use `code-reviewer` when the user asks for a review.
- Treat the pack as local process guidance layered on top of the repo’s real code and constraints.

## Games Folder

### `games/English_game/`
- Legacy English learning game.
- Single-file app in `index.html` plus `emojis.json`.
- Inline HTML, CSS, and JavaScript.
- Modes visible in code: listen/choose, challenge, and memory.
- Uses speech synthesis directly inside the page logic.
- Not the current main entry from `index.html`, but still referenced by `index-arcade-room.html`.

### `games/English_game_v2/`
- Current English Galaxy version used by the main hub.
- Main entry file is `index_final.html`.
- Modular structure:
  - `scripts/config.js`: categories, pets, rewards, praise text, letter-word data, storage key.
  - `scripts/words.js`: main word bank.
  - `scripts/state.js`: shared runtime state and helpers.
  - `scripts/game.js`: round flow, challenge mode, memory mode, letters mode.
  - `scripts/ui.js`: rendering and UI updates.
  - `scripts/tts.js`: voice loading, saved TTS settings, queued speech playback.
  - `scripts/speech.js`: older speech layer still present in the folder.
  - `styles/game.css`: extracted styling.
- Important note:
  - There is no `index.html` in this folder right now.
  - The main hub works only because `index.html` explicitly routes this game to `index_final.html`.
- `LANG_UPGARDE.MD`
  - Task note describing the TTS upgrade goal and requirements.

### `games/flag-game/`
- Most structured game in the repo.
- Fully static HTML/CSS/JS geography game.
- Dashboard entry: `index.html`
- Game screen: `game.html`
- Script layout:
  - `scripts/storage.js`: localStorage persistence and session handoff.
  - `scripts/i18n.js`: English/Hebrew text.
  - `scripts/dashboard.js`: player management and setup flow.
  - `scripts/data.js`: loads country and capital datasets.
  - `scripts/game.js`: gameplay loop, timer, scoring flow, UI behavior.
  - `scripts/scoring.js`: Bruce Lee mode points.
  - `scripts/achievements.js`: medals and unlock logic.
  - `scripts/utils.js`: shared helpers.
- Data:
  - `data/flags-countries.json`
  - `data/countries-capitals.json`
- Assets:
  - Large SVG flag set under `assets/`
- Persistence model:
  - Browser-only with localStorage.
  - Good fit for GitHub Pages.

### `games/fart-machine/`
- Prebuilt static app.
- Entry file: `index.html`
- Compiled assets live under `assets/`.
- Looks like a bundled Vite-style output rather than source code.
- Important deployment note:
  - Asset URLs are absolute and currently include `/arcade-fun/...`.
  - This assumes the GitHub Pages repo path is `/arcade-fun/`.
  - If the repo name or Pages path changes, this game can break unless rebuilt or paths are adjusted.

## What Is Actually Active In The Main Hub
- `English Galaxy` -> `games/English_game_v2/index_final.html`
- `Flag Flow Arena` -> `games/flag-game/index.html`
- `Fart Machine` -> `games/fart-machine/index.html`

## Documentation Drift
- The repo began as a generic pygame/pygbag hub, but it is now mostly a static web-games repository.
- `README.md` and `deploy.sh` reflect the old direction.
- `GITHUB_UPLOAD.md` is closer to reality, but it does not fully describe the current 3-game hub state.

## Practical Development Rules For This Repo
- Treat GitHub Pages compatibility as a hard constraint.
- Prefer static assets, browser APIs, and localStorage.
- Check whether a game is source-based or already bundled before editing.
- Be careful with English Galaxy paths because the active entry is `index_final.html`, not `index.html`.
- Be careful with `fart-machine` path assumptions because the bundle is rooted to `/arcade-fun/`.

## Notable Current Risks
- `index-arcade-room.html` and `index.html` do not point to the same English game version.
- `games/English_game_v2/` lacks a default `index.html`, so direct folder linking would fail without the hub's file override.
- `README.md` can mislead future work because it describes a different project stage.
