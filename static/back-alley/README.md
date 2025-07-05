# Back Alley Score Sheet

This is a web-based score-keeping application for the card game "Back Alley." It provides a dynamic and user-friendly interface to manage players, track bids, and automatically calculate scores according to the game's rules.

## How to Run

> [!NOTE]
> This project is part of a larger monorepo.  
> If you want to see this project in the context of its hosting site, you can visit [https://nbird.dev/back-alley](https://nbird.dev/back-alley)

### Standalone Usage

If you wish to run this project by itself, please be aware that `index.html` references files from the parent monorepo:

- `/styles/global.css`
- `/scripts/load-header.js`
- `/scripts/load-footer.js`

When you open `index.html` directly, your browser will not be able to find these files, which will result in errors in the developer console and a missing icon. However, **these errors will not prevent the scorecard from functioning.**

For a cleaner experience, you can optionally comment out or remove the `<link>` for `global.css`, the `<header>` and `<footer>` sections from `index.html`.

After making these changes, you can open `index.html` directly in your browser, or host the `back-alley` directory with a simple HTTP server.

> [!TIP]
> See [Using Python](https://github.com/nbird11/dining-philosophers?tab=readme-ov-file#using-python) or [Using VS Code Live Server](https://github.com/nbird11/dining-philosophers?tab=readme-ov-file#using-vs-code-live-server) for more info.

## Features

- **Dynamic Score Sheet:** The scorecard table is generated dynamically. Add as many players as you need, and the table will expand accordingly.
- **Multiple Frames:** The game can be played in multiple "frames" of 13 rounds each. The card count automatically cycles from 13 down to 1, and then back up for subsequent frames.
- **Automatic Score Calculation:** Scores are calculated and updated automatically as you enter a player's bid and the number of tricks they took. The application handles standard scoring, "going set," and bonus points for extra tricks.
- **"Board" Bid Handling:** The scorecard correctly calculates scores for special "Board" bids, including multipliers for multiple players bidding board in the same round.
- **Trump Selector:** For each round, you can select the trump suit (Spades, Hearts, Clubs, Diamonds, or No Trump).
- **Reset Game:** A "Reset Game" button allows you to clear the entire scoresheet and start a new game.
