import Game from './game.js';

/** @type {HTMLCanvasElement} */
const canvasElement = document.getElementById('game');
/** @type {CanvasRenderingContext2D} */
const ctx = canvasElement.getContext('2d');

/** @type {Game?} */
let game = null;

function updateCanvasScale() {
  // Get the display size
  const displayWidth = canvasElement.clientWidth;
  const displayHeight = canvasElement.clientHeight;

  // Get the device pixel ratio
  const dpr = window.devicePixelRatio || 1;

  // Set the canvas size in actual pixels
  canvasElement.width = displayWidth * dpr;
  canvasElement.height = displayHeight * dpr;

  // Scale the context to ensure correct drawing operations
  ctx.scale(dpr, dpr);

  // Enable text anti-aliasing
  ctx.textRendering = 'optimizeLegibility';
  ctx.imageSmoothingEnabled = true;

  game?.updateDimensions();
}

function main() {
  updateCanvasScale();
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
window.addEventListener('resize', debounce(updateCanvasScale, 250));

document.addEventListener('DOMContentLoaded', main);