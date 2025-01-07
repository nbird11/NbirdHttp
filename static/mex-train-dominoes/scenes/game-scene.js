import Scene from './scene.js';
import Domino from '../domino.js';

/** @typedef {import('../game.js').default} Game */

const POKER_GREEN = '#35654d';
const HUB_COLOR = '#d4b483';  // A warm beige color
const HUB_BORDER = '#826e50';  // Darker shade for the border

class GameScene extends Scene {
  /**
   * @param {Game} game - The game instance
   */
  constructor(game) {
    super(game);
    /** @type {Domino[]} */
    this.boneyard = [];
    /** @type {number} */
    this.hubSize = 120;  // Diameter of the octagon
    /** @type {number} */
    this.notchDepth = Domino.LENGTH / 4;  // How deep the notches are
    /** @type {number} */
    this.notchWidth = Domino.WIDTH * 1.2;  // Slightly wider than domino width

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

  _drawHub() {
    const ctx = this.game.ctx;
    const centerX = this.game.width / 2;
    const centerY = this.game.height / 2;
    const radius = this.hubSize / 2;
    const baseRotation = Math.PI / 8;  // 22.5 degrees

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(baseRotation);  // Rotate octagon to align edges with axes

    // Draw the main octagon shape
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Fill and stroke the octagon
    ctx.fillStyle = HUB_COLOR;
    ctx.fill();
    ctx.strokeStyle = HUB_BORDER;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the notches for the trains
    for (let i = 0; i < 8; i++) {
      const midAngle = (i * Math.PI) / 4 + Math.PI / 8;  // Halfway between vertices
      const midX = Math.cos(midAngle) * radius;
      const midY = Math.sin(midAngle) * radius;

      // Draw notch rectangle
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(((i + 1) * Math.PI / 4) - baseRotation);  // 45° increments, counter-rotated by baseRotation

      // Draw the notch with background color fill only
      ctx.beginPath();
      ctx.moveTo(-this.notchWidth / 2, this.notchDepth / 2);
      ctx.lineTo(-this.notchWidth / 2, -this.notchDepth / 2);
      ctx.lineTo(this.notchWidth / 2, -this.notchDepth / 2);
      ctx.lineTo(this.notchWidth / 2, this.notchDepth / 2);
      ctx.closePath();

      ctx.fillStyle = POKER_GREEN;
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
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
    this._drawHub();

    // Draw boneyard count
    this.game.writeText(`Boneyard: ${this.boneyard.length}`, 100, 30, 20);
  }
}

export default GameScene;
