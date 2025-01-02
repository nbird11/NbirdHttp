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
    // for (let i = 0; i < 13; i++) {
    //   for (let j = 0; j <= i; j++) {
    //     const domino = new Domino(i, j);
    //     // Rotate every other domino by 45 degrees for testing
    //     if ((i + j) % 2 === 0) {
    //       domino.setRotation(45);
    //     }
    //     this.dominoes.push(domino);
    //   }
    // }
    this.dominoes.push(new Domino(3, 7).setRotation(0));
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
    this.update();
    this.draw();
    requestAnimationFrame(() => this.run());
  }

  draw() {
    this.drawBackground();
    this.writeText('Mexican Train Dominoes', this.width / 2, this.height / 8, 32);

    let position = { x: this.width / 2, y: this.height / 2 };
    let prev = this.dominoes[0].end1;
    for (const domino of this.dominoes) {
      console.log(domino);
      // if (domino.end1 !== prev) {
      if (position.x > this.width - 45) {
        prev = domino.end1;
        position.x = 45;
        position.y += 70;
      }
      domino.draw(this.ctx, position.x, position.y);
      position.x += 75;
    }
  }

  update() {
    this.dominoes.forEach(domino => {
      // Each domino rotates independently
      const currentDegrees = domino.rotation * 180 / Math.PI;
      domino.setRotation((currentDegrees + 1) % 360);
    });
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
