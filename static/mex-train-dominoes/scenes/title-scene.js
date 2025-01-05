import Scene from './scene.js';
import Domino from '../domino.js';
import GameScene from './game-scene.js';

/** @typedef {import('../game.js').default} Game */

const POKER_GREEN = '#35654d';
const PURPLE = '#5e3c52';

class TitleScene extends Scene {
  /**
   * @param {Game} game - The game instance
   */
  constructor(game) {
    super(game);
    /** @type { {domino: Domino, rotationSpeed: number}[] } */
    this.dominoes = [];
    /** @type {{x: number, y: number, width: number, height: number}} */
    this.playButton = {
      x: 0,
      y: 0,
      width: 150,
      height: 50
    };
    this._createDominoes();
    this._updateDominoPositions();
    this._updatePlayButtonPosition();
  }

  _createDominoes() {
    // Create a smaller set of display dominoes
    const displayValues = [
      [12, 9], [6, 3], [9, 6], [3, 1],
    ];

    this.dominoes = displayValues.map(([end1, end2], index) => {
      const domino = new Domino(end1, end2);
      domino.rotation.setDegrees(Math.random() * 360);

      // Positions of dominoes are set in _updateDominoPositions()

      let rotationSpeed = 0;
      while (rotationSpeed === 0) {
        rotationSpeed = index % 2 === 0 ? 1 : -1;
      }

      return { domino: domino, rotationSpeed };
    });
  }

  _updatePlayButtonPosition() {
    this.playButton.x = (this.game.width - this.playButton.width) / 2;
    this.playButton.y = this.game.height * 0.7;
  }

  _updateDominoPositions() {
    const centerX = this.game.width / 2;
    const centerY = this.game.height / 2;
    const spacing = 100;

    this.dominoes.forEach(({ domino }, index) => {
      // Calculate offset from center
      // For 4 dominoes: indices 0,1,2,3 should map to positions -1.5, -0.5, 0.5, 1.5
      const offsetMultiplier = index - (this.dominoes.length - 1) / 2;
      const xOffset = offsetMultiplier * spacing;
      domino.position.setPosition({
        x: centerX + xOffset,
        y: centerY
      });
    });
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
      const gameScene = new GameScene(this.game);
      this.game.setScene(gameScene);
    }
  }

  update() {
    // Gently rotate the dominoes
    this.dominoes.forEach(({ domino, rotationSpeed }) => {
      domino.rotation.addDegrees(rotationSpeed);
    });
  }

  updateDimensions() {
    super.updateDimensions();
    this._updatePlayButtonPosition();
    this._updateDominoPositions();
  }

  draw() {
    const ctx = this.game.ctx;

    // Draw background
    ctx.fillStyle = POKER_GREEN;
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    // Draw title
    this.game.writeText('Mexican Train Dominoes', this.game.width / 2, this.game.height / 4, 48);

    this.dominoes.forEach(({ domino }) => domino.draw(ctx));

    // Draw play button
    ctx.fillStyle = PURPLE;
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
