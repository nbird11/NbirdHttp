import TitleScene from './scenes/title-scene.js';

/** @typedef {import('./scene.js').default} Scene */

/**
 * The main game class
 * @class Game
 * @property {CanvasRenderingContext2D} ctx - The canvas context
 * @property {Scene} currentScene - The current scene
 */
class Game {
  /**
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   */
  constructor(ctx) {
    /** @type {CanvasRenderingContext2D} */
    this.ctx = ctx;
    /** @type {number} */
    this.width = ctx.canvas.clientWidth;
    /** @type {number} */
    this.height = ctx.canvas.clientHeight;
    /** @type {Scene} */
    this.currentScene = new TitleScene(this);
  }

  /**
   * Write text to the canvas.
   * @param {string} text - The text to write
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {number} fontSize - The font size
   */
  writeText(text, x, y, fontSize = 20) {
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x, y);
  }

  /**
   * Update the game dimensions
   */
  updateDimensions() {
    this.width = this.ctx.canvas.clientWidth;
    this.height = this.ctx.canvas.clientHeight;
    this.currentScene.updateDimensions();
  }

  run() {
    this.update();
    this.draw();

    requestAnimationFrame(() => this.run());
  }

  /**
   * Update the game using the current scene.
   */
  update() {
    this.currentScene.update();
  }

  /**
   * Draw the game using the current scene.
   */
  draw() {
    this.currentScene.draw();
  }

  /**
   * Set the current scene.
   * @param {Scene} scene - The scene to set
   */
  setScene(scene) {
    this.currentScene = scene;
  }
}

export default Game;
