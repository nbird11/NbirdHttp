import Scene from '../scene.js';
import Domino from '../domino.js';

/** @typedef {import('../game.js').default} Game */

class TitleScene extends Scene {
  /**
   * @param {Game} game - The game instance
   */
  constructor(game) {
    super(game);
    /** @type {Domino[]} */
    this.dominoes = [];
    this._createDominoes();
  }

  _createDominoes() {
    // Move your current domino creation code here
    for (let i = 0; i < 13; i++) {
      for (let j = 0; j <= i; j++) {
        const domino = new Domino(i, j);
        domino.rotation.setDegrees(90);
        this.dominoes.push(domino);
      }
    }
  }

  /**
   * Rotate all dominoes by 1 degree
   */
  update() {
    this.dominoes.forEach(domino => {
      domino.rotation.addDegrees(1);
    });
  }

  /**
   * Draw the title scene.
   */
  draw() {
    const ctx = this.game.ctx;
    // Draw background
    ctx.fillStyle = '#35654d';
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    // Draw title
    this.game.writeText('Mexican Train Dominoes', this.game.width / 2, this.game.height / 8, 32);

    // Draw dominoes
    this._displayAllDominoes();
  }

  _displayAllDominoes() {
    let position = { x: 45, y: 70 };
    let prev = this.dominoes[0].end1;
    for (const domino of this.dominoes) {
      if (domino.end1 <= 6) {
        if (domino.end1 !== prev) {
          prev = domino.end1;
          position.x = 45;
          position.y += 75;
        }
        domino.draw(this.game.ctx, position.x, position.y);
        position.x += 35;
      } else {
        if (domino.end1 !== prev) {
          prev = domino.end1;
          position.x = this.game.width - 45;
          position.y -= domino.end1 !== 7 ? 75 : 0;
        }
        position.x -= 35;
        domino.draw(this.game.ctx, position.x, position.y);
      }
    }
  }
}

export default TitleScene;
