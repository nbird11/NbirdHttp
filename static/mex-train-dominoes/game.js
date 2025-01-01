import Domino from './domino.js';

class Game {
  /** @param {CanvasRenderingContext2D} ctx */
  constructor(ctx) {
    this.ctx = ctx;
    this.testDomino = new Domino(6, 4);
    this.updateDimensions(ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  }

  /**
   * Update the game dimensions
   * @param {number} width 
   * @param {number} height 
   */
  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  run() {
    this.draw();
  }

  draw() {
    this.drawBackground();
    this.writeText('Mexican Train Dominoes', this.width / 2, this.height / 8, 32);

    // Draw test domino in the center of the canvas
    this.testDomino.draw(
      this.ctx,
      this.width / 2,
      this.height / 2
    );
  }

  drawBackground() {
    this.ctx.fillStyle = '#35654d';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  writeText(text, x, y, fontSize = 20) {
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x, y);
  }
}

export default Game;
