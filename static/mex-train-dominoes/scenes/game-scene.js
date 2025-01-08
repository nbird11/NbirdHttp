import Scene from './scene.js';
import Domino from '../entities/domino.js';
import Hub from '../entities/hub.js';
import { POKER_GREEN } from '../utils/constants.js';

/** @typedef {import('../game.js').default} Game */

class GameScene extends Scene {
  /**
   * @param {Game} game - The game instance
   */
  constructor(game) {
    super(game);
    /** @type {Domino[]} Pile of dominoes to be drawn from */
    this.boneyard = [];
    /** @type {Hub} */
    this.hub = new Hub(this.game.width / 2, this.game.height / 2);

    const centerX = this.game.width / 2;
    const centerY = this.game.height / 2;

    /** @type {Domino} Branching domino */
    this.twelveEleven = new Domino(12, 11)
      .setEnd1Bottom()
      .setPosition({
        x: centerX,
        y: centerY - this.hub.mediumDiagonal / 2 - this.hub.notchDepth
      });
    
    this._createBoneyard();
  }

  _createBoneyard() {
    // Create all possible dominoes (0-12)
    for (let end1 = 0; end1 <= 12; end1++) {
      for (let end2 = end1; end2 <= 12; end2++) {
        const domino = new Domino(end1, end2);
        this.boneyard.push(domino);
      }
    }

    // Shuffle the boneyard, using the Fisher-Yates algorithm
    for (let i = this.boneyard.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.boneyard[i], this.boneyard[j]] = [this.boneyard[j], this.boneyard[i]];
    }
  }

  update() {
    // Game logic updates will go here
  }

  draw() {
    const ctx = this.game.ctx;

    // Draw background
    ctx.fillStyle = POKER_GREEN;
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    // Draw the hub
    this.hub.draw(ctx);


    this.twelveEleven.draw(ctx);

    // Draw boneyard count
    this.game.writeText(`Boneyard: ${this.boneyard.length}`, 100, 30, 20);
  }
}

export default GameScene;
