import Domino from './domino.js';

var debug = true;
var loopCount = 0;

class Game {
  /** @param {CanvasRenderingContext2D} ctx */
  constructor(ctx) {
    this.ctx = ctx;
    /** @type {Domino[]} */
    this.dominoes = [];  // DELETEME: for testing
    this.updateDimensions(ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    this._createAllDominoes();  // DELETEME: for testing
  }

  _createAllDominoes() {  // DELETEME: for testing
    for (let i = 0; i < 13; i++) {
      for (let j = 0; j <= i; j++) {
        const domino = new Domino(i, j);
        // Rotate every other domino by 45 degrees for testing
        // if ((i + j) % 2 === 0) {
        domino.rotation.setDegrees(90);
        // }
        this.dominoes.push(domino);
      }
    }
    // this.dominoes.push(new Domino(3, 7).setRotation(0));
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
    if (debug) {
      console.log(`Running game loop ${loopCount}`);  // Debug
      loopCount++;
      if (loopCount > 10) {
        debug = false;
      }
    }
    this.update();
    this.draw();
    requestAnimationFrame(() => this.run());
  }

  draw() {
    this.drawBackground();
    this.writeText('Mexican Train Dominoes', this.width / 2, this.height / 8, 32);
    this._displayAllDominoes();
  }

  update() {
    if (debug) console.log('Updating dominoes');  // Debug
    this.dominoes.forEach(domino => {
      const before = domino.rotation.getDegrees();  // Debug
      domino.rotation.addDegrees(1);
      const after = domino.rotation.getDegrees();   // Debug
      if (debug) console.log(`Domino rotation: ${before} -> ${after}`);  // Debug
    });
  }

  _displayAllDominoes() {  // DELETEME: for testing
    let position = { x: 45, y: 70 };
    let prev = this.dominoes[0].end1;
    for (const domino of this.dominoes) {
      // if (position.x > this.width - 45) {  // snippet
      if (domino.end1 <= 6) {
        if (domino.end1 !== prev) {
          prev = domino.end1;
          position.x = 45;
          position.y += 75;
        }
        domino.draw(this.ctx, position.x, position.y);
        position.x += 35;
        // }
      } else {
        if (domino.end1 !== prev) {
          prev = domino.end1;
          position.x = this.width - 45;
          position.y -= domino.end1 !== 7 ? 75 : 0;
        }
        position.x -= 35;
        domino.draw(this.ctx, position.x, position.y);
      }
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
