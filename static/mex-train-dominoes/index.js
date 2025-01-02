import Game from './game.js';

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('game');
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');

/** @type {Game} */
let game = null;

function setupCanvas() {
  // Get the display size
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Get the device pixel ratio
  const dpr = window.devicePixelRatio || 1;

  // Set the canvas size in actual pixels
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  // Scale the context to ensure correct drawing operations
  ctx.scale(dpr, dpr);

  // Enable text anti-aliasing
  ctx.textRendering = 'optimizeLegibility';
  ctx.imageSmoothingEnabled = true;
}

function main() {
  setupCanvas();
  game = new Game(ctx);
  game.run();  // This will start the animation loop
}

/**
 * Limits how often a function is called.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to wait before calling the function.
 * @returns {Function} The debounced function.
 */
function debounce(func, wait) {
  /** @type {number} id */
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Handle resize events
window.addEventListener('resize', debounce(() => {
  if (game) {
    setupCanvas();
    game.updateDimensions(canvas.clientWidth, canvas.clientHeight);
    game.draw();
  }
}, 250));

document.addEventListener('DOMContentLoaded', main);