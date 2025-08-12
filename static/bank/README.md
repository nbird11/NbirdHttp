# Bank Dice Game

A lightweight, browser-based implementation of the party dice game "Bank" with a clean UI, manual roll input panel, and automatic scoring.

[![Live](https://img.shields.io/badge/Live-nbird.dev%2Fbank-success?logo=google-chrome)](https://nbird.dev/bank)
![Static Badge](https://img.shields.io/badge/Vanilla_JS-ES6%2B-blue)
![Static Badge](https://img.shields.io/badge/No_Frameworks-0_dependencies-informational)
![Static Badge](https://img.shields.io/badge/Persistence-localStorage-9cf)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](../../LICENSE)

## How to Run

> [!NOTE]
> This project is part of a larger monorepo.  
> To see it within the full site, visit [https://nbird.dev/bank](https://nbird.dev/bank)

### Standalone Usage

If you open `index.html` directly, note it references shared files from the monorepo:

- `/styles/global.css`
- `/scripts/load-header.js`
- `/scripts/load-footer.js`

Your browser won't find these when run outside the monorepo, which produces console errors. These errors do not prevent the game from working. For a cleaner standalone run, you can comment out the `<link>` to `global.css` and the `<header>/<footer>` blocks in `index.html`.

After that, you can simply open `index.html` in your browser, or host the `bank/` folder with a simple HTTP server:

#### Using Python

```bash
python -m http.server
# or
python3 -m http.server
```

Then open `http://localhost:8000` in your browser and navigate to the `bank/` path.

#### Using VS Code Live Server

Install the Live Server extension, then right‑click `index.html` and choose "Open with Live Server".

## Features

- **Flexible player setup**: Add, rename, and remove players before the game starts.
- **Round length selection**: Choose 10, 15, or 20 rounds via quick‑select chips.
- **Manual roll panel**: Click number buttons for sums 2–12 and a dedicated "Double" action; no RNG involved for transparent scoring.
- **Pot logic**: First three rolls treat 7 as 70; after the third roll, doubles double the pot and a 7 ends the round with the pot lost.
- **Bank action**: Any active player can "Bank" to claim the current pot and sit out the rest of the round.
- **Auto progression**: Rounds advance automatically; final results calculated at game end, with tie handling.
- **Persistent state**: Game state (players, scores, round, pot) is saved to `localStorage` and restored on reload.
- **No dependencies**: Built with HTML, CSS, and vanilla JS. Bootstrap Icons are loaded via CDN for small UI affordances.

## How to Play (Rules Summary)

- **Turn flow**: Players act in order on a shared pot.
- **First three rolls**: Add the sum to the pot. If the sum is 7, add 70 instead.
- **After the third roll**:
  - Rolling a 7 immediately ends the round and the pot is lost.
  - Clicking "Double" doubles the pot (represents rolling doubles).
  - Other sums add normally to the pot.
- **Banking**: On your turn, click "Bank" to take the current pot into your score and sit out for the rest of the round. The pot remains for remaining players.
- **Round end**: The round ends when all players have banked or a 7 is rolled after the third roll. The next round starts with the player after the last to act.
- **Game end**: After the chosen number of rounds, the highest total score wins (ties allowed).

## Files

- `index.html`: Page markup and layout, header/footer hooks, and rules details.
- `style.css`: Component and layout styles.
- `main.js`: Game state, UI rendering, roll panel logic, banking, persistence, and round/game progression.

## Credits

This project was mainly vibe-coded by GPT-5, with heavy coercions by Nathan Bird.
