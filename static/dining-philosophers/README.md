# Dining Philosophers

A real-time, visual simulation of the classic Dining Philosophers concurrency problem. This project provides an interactive way to observe the challenges of resource allocation and deadlock avoidance in a multi-threaded environment.

The simulation displays philosophers sitting around a circular table with chopsticks placed between them. You can see their status (thinking, hungry, or eating) indicated by the color of their border, and their hunger level represented by a bar.

## How to Run

> [!NOTE]
> This project is part of a larger monorepo.

### Standalone Usage

If you wish to run this project by itself, please be aware that `index.html` references files from the parent monorepo:

- `/styles/global.css`
- `/scripts/load-header.js`
- `/scripts/load-footer.js`

When you open `index.html` directly, your browser will not be able to find these files, which will result in errors in the developer console. However, **these errors will not prevent the simulation from running.**

For a cleaner experience without console errors, you can optionally comment out or remove the `<link>` for `global.css` and the `<header>` and `<footer>` sections from `index.html`.

After making these changes, you can open `index.html` directly in your browser, or host the `dining-philosophers` directory with a simple HTTP server. Here are two common ways to run a local server:

#### Using Python

If you have Python installed, navigate to this directory in your terminal and run:

```bash
# For Python 3
python -m http.server
```

Then open `http://localhost:8000` in your browser.

#### Using VS Code Live Server

If you're using Visual Studio Code, you can install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension. After installation, right-click on `index.html` and choose "Open with Live Server".

## Features

- **Visual Simulation:** Watch philosophers think, get hungry, and eat in real-time.
- **State Indicators:** The border of each philosopher changes color to indicate their current state:
  - **Thinking:** Black border
  - **Hungry:** Orange border
  - **Eating:** Green border
- **Hunger Bars:** Each philosopher has a hunger bar that depletes over time. When a philosopher eats, their hunger is replenished.
- **Deadlock Avoidance:** The simulation implements a solution to the deadlock problem by having each philosopher attempt to pick up the chopstick with the lower ID number first.
- **Dynamic UI:** The philosophers and chopsticks are dynamically positioned based on the number of philosophers.

## Configuration

You can customize the simulation by changing the constants at the top of the `main.js` file:

- `N`: The number of philosophers (and chopsticks). The default is 5.
- `STOP_EATING_WHEN_FULL`: If `true`, a philosopher will stop eating once their hunger bar is full. If `false`, they will eat for a random duration.
- `AUTO_RESET`: If `true`, the simulation will automatically reset if a deadlock is detected (which shouldn't happen with the current logic).

Feel free to experiment with these values to see how the simulation changes!
