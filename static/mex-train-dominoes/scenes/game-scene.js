import Scene from './scene.js';
import Domino from '../entities/domino.js';

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
    /** @type {Domino[]} Pile of dominoes to be drawn from */
    this.boneyard = [];
    /** @type {number} Vertex to opposite vertex */
    this.longDiagonal = 120;
    /** @type {number} Vertex to adjacent vertex (edge to opposite edge) */
    this.mediumDiagonal = this.longDiagonal * Math.cos(Math.PI / 8);
    /** @type {number} How deep the notches cut into the hub */
    this.notchDepth = Domino.LENGTH / 3;
    /** @type {number} Slightly wider than domino width */
    this.notchWidth = Domino.WIDTH + 5;

    const centerX = this.game.width / 2;
    const centerY = this.game.height / 2;
    
    /** @type {Domino} Center domino */
    this.twelveTwelve = new Domino(12, 12)
      .setEnd1Left()
      .setPosition({
        x: centerX,
        y: centerY
      });

    /** @type {Domino} Branching domino */
    this.twelveEleven = new Domino(12, 11)
      .setEnd1Bottom()
      .setPosition({
        x: centerX,
        y: centerY - this.mediumDiagonal / 2 - this.notchDepth
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

  _drawHub() {
    const ctx = this.game.ctx;
    const centerX = this.game.width / 2;
    const centerY = this.game.height / 2;
    const circumradius = this.longDiagonal / 2;  // Distance from center to vertex
    const inradius = circumradius * Math.cos(Math.PI / 8);  // Distance from center to edge middle = R * cos(45°)
    const sideLength = 2 * circumradius * Math.sin(Math.PI / 8);  // Length of each edge = 2R * sin(45°)

    ctx.save();

    // Draw the main octagon shape - edges at cardinal directions
    ctx.beginPath();
    // Start at top edge center and go clockwise
    ctx.moveTo(centerX, centerY - inradius);                    // Top-middle
    ctx.lineTo(centerX + sideLength / 2, centerY - inradius);   // Half edge to top-right vertex
    ctx.lineTo(centerX + inradius, centerY - sideLength / 2);   // To right-top vertex
    ctx.lineTo(centerX + inradius, centerY + sideLength / 2);   // To right-bottom vertex
    ctx.lineTo(centerX + sideLength / 2, centerY + inradius);   // To bottom-right vertex
    ctx.lineTo(centerX - sideLength / 2, centerY + inradius);   // To bottom-left vertex
    ctx.lineTo(centerX - inradius, centerY + sideLength / 2);   // To left-bottom vertex
    ctx.lineTo(centerX - inradius, centerY - sideLength / 2);   // To left-top vertex
    ctx.lineTo(centerX - sideLength / 2, centerY - inradius);   // To top-left vertex
    ctx.lineTo(centerX, centerY - inradius);                    // Back to top-middle
    ctx.closePath();

    // Fill and stroke the octagon
    ctx.fillStyle = HUB_COLOR;
    ctx.fill();
    ctx.strokeStyle = HUB_BORDER;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the center notch - a horizontal rectangle slightly larger than a domino
    ctx.beginPath();
    const horizontalLength = Domino.LENGTH + 5;   // Slightly longer than domino
    const verticalWidth = Domino.WIDTH + 5;       // Slightly wider than domino
    
    // Draw from left to right, centered both horizontally and vertically
    ctx.moveTo(centerX - horizontalLength/2, centerY - verticalWidth/2);   // Left edge, centered vertically
    ctx.lineTo(centerX + horizontalLength/2, centerY - verticalWidth/2);   // Top edge
    ctx.lineTo(centerX + horizontalLength/2, centerY + verticalWidth/2);   // Right edge
    ctx.lineTo(centerX - horizontalLength/2, centerY + verticalWidth/2);   // Bottom edge
    ctx.closePath();

    ctx.fillStyle = POKER_GREEN;
    ctx.fill();

    // Draw the edge notches - one in each cardinal direction
    const directions = [
      [1, 0],    // Right
      [0, 1],    // Down
      [-1, 0],   // Left
      [0, -1],   // Up
      [0.7071, 0.7071],    // Bottom-right
      [-0.7071, 0.7071],   // Bottom-left
      [-0.7071, -0.7071],  // Top-left
      [0.7071, -0.7071],   // Top-right
    ];

    for (const [dx, dy] of directions) {
      // Calculate center point of edge
      const x = centerX + dx * circumradius;
      const y = centerY + dy * circumradius;

      // Draw notch
      ctx.beginPath();
      // Calculate perpendicular direction for notch
      const perpX = -dy;
      const perpY = dx;
      const halfWidth = this.notchWidth / 2;

      // Draw notch rectangle
      ctx.moveTo(x - perpX * halfWidth, y - perpY * halfWidth);
      ctx.lineTo(
        x - perpX * halfWidth - dx * this.notchDepth,
        y - perpY * halfWidth - dy * this.notchDepth
      );
      ctx.lineTo(
        x + perpX * halfWidth - dx * this.notchDepth,
        y + perpY * halfWidth - dy * this.notchDepth
      );
      ctx.lineTo(
        x + perpX * halfWidth,
        y + perpY * halfWidth
      );
      ctx.closePath();

      ctx.fillStyle = POKER_GREEN;
      ctx.fill();
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

    // Draw test dominoes
    this.twelveTwelve.draw(ctx);
    this.twelveEleven.draw(ctx);

    // Draw boneyard count
    this.game.writeText(`Boneyard: ${this.boneyard.length}`, 100, 30, 20);
  }
}

export default GameScene;
