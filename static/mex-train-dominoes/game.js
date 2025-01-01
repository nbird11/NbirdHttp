import Domino from './domino.js';

class Game {
  /** @param {CanvasRenderingContext2D} ctx */
  constructor(ctx) {
    this.ctx = ctx;
    /** @type {Domino[]} */
    this.dominoes = [];  // DELETEME: for testing
    this.updateDimensions(ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    this.createDominoes();  // DELETEME: for testing
  }

  createDominoes() {  // DELETEME: for testing
    for (let i = 0; i < 13; i++) {
      for (let j = 0; j <= i; j++) {
        this.dominoes.push(new Domino(i, j));
      }
    }
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

    let position = { x: 45, y: this.height - 13 * 35 };
    let prev = this.dominoes[0].end1;
    for (const domino of this.dominoes) {``
      // if (position.x > this.width - 45) {
      if (domino.end1 !== prev) {
        prev = domino.end1;
        position.x = 45;
        position.y += 35;
      }
      domino.draw(this.ctx, position.x, position.y);
      position.x += 75;
    }
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
