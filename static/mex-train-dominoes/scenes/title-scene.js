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
    /** @type {{x: number, y: number, width: number, height: number}} */
    this.playButton = {
      x: 0,
      y: 0,
      width: 150,
      height: 50
    };
    this._createDominoes();
    this._updatePlayButtonPosition();
  }

  _createDominoes() {
    // Create a smaller set of display dominoes
    const displayValues = [[12, 12], [9, 6], [6, 3], [3, 0]];
    this.dominoes = displayValues.map(([end1, end2]) => {
      const domino = new Domino(end1, end2);
      domino.rotation.setDegrees(45);
      return domino;
    });
  }

  _updatePlayButtonPosition() {
    this.playButton.x = (this.game.width - this.playButton.width) / 2;
    this.playButton.y = this.game.height * 0.7;
  }

  /**
   * @param {number} x 
   * @param {number} y 
   * @returns {boolean}
   */
  isPointInPlayButton(x, y) {
    return x >= this.playButton.x &&
           x <= this.playButton.x + this.playButton.width &&
           y >= this.playButton.y &&
           y <= this.playButton.y + this.playButton.height;
  }

  /**
   * Handle mouse click events
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   */
  onClick(x, y) {
    if (this.isPointInPlayButton(x, y)) {
      console.log('Play button clicked!');
      // TODO: Switch to game scene when implemented
    }
  }

  update() {
    // Gently rotate the dominoes
    this.dominoes.forEach((domino, index) => {
      const baseAngle = (Date.now() / 2000) + (index * Math.PI / 2);
      domino.rotation.setDegrees(90 + Math.sin(baseAngle) * 15);
    });
  }

  updateDimensions() {
    super.updateDimensions();
    this._updatePlayButtonPosition();
  }

  draw() {
    const ctx = this.game.ctx;
    
    // Draw background
    ctx.fillStyle = '#35654d';
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    // Draw title
    this.game.writeText('Mexican Train Dominoes', this.game.width / 2, this.game.height / 4, 48);

    // Draw decorative dominoes in a diamond pattern
    const centerX = this.game.width / 2;
    const centerY = this.game.height / 2;
    const spacing = 100;

    this.dominoes.forEach((domino, index) => {
      const offset = (index - (this.dominoes.length - 1) / 2) * spacing;
      domino.draw(ctx, centerX + offset, centerY);
    });

    // Draw play button
    ctx.fillStyle = '#5e3c52';
    ctx.beginPath();
    ctx.roundRect(
      this.playButton.x,
      this.playButton.y,
      this.playButton.width,
      this.playButton.height,
      10
    );
    ctx.fill();

    // Draw button text
    this.game.writeText('Play', 
      this.playButton.x + this.playButton.width / 2,
      this.playButton.y + this.playButton.height / 2 + 7,
      24
    );
  }
}

export default TitleScene;
