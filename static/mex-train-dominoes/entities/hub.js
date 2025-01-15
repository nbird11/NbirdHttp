import Domino from './domino.js';
import Position from './position.js';
import { POKER_GREEN, HUB_COLOR, HUB_BORDER, OPEN_BRANCH_OWNER } from '../utils/constants.js';
import { assert, notImplemented } from '../utils/assert.js';
/** @typedef { {owner: string, dominoes: Domino[], open: boolean} } Branch */

class Hub {
  /**
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  constructor(x, y) {
    /** @type {Position} */
    this.position = new Position(x, y);

    /** @type {number} Vertex to opposite vertex */
    this.longDiagonal = 120;
    /** @type {number} Vertex to adjacent vertex (edge to opposite edge) */
    this.mediumDiagonal = this.longDiagonal * Math.cos(Math.PI / 8);
    /** @type {number} How deep the notches cut into the hub */
    this.notchDepth = Domino.LENGTH / 3;
    /** @type {number} Slightly wider than domino width */
    this.notchWidth = Domino.WIDTH + 5;

    /** @type {Domino} Center domino */
    this.centerDomino = new Domino(12, 12).setPosition(this.position);
    /** @type {Branch[]} List of branches (0-7) */
    this.branches = [];
    this._initBranches();
  }

  /**
   * @param {Domino} domino - New center domino
   */
  updateCenterDomino(domino) {
    this.centerDomino = domino;
  }

  /**
   * @param {string} owner - Owner of the branch
   */
  addBranchOwner(owner) {
    if (this.branches.every(branch => branch.owner != OPEN_BRANCH_OWNER)) {
      throw new Error('Hub already has 8 player-owned branches');
    }
    let branch = this.getBranch(OPEN_BRANCH_OWNER);
    branch.owner = owner;
    branch.open = false;
  }

  /**
   * @param {string} owner - Owner of the branch
   */
  setBranchOpen(owner) {
    let branch = this.getBranch(owner);
    branch.open = true;
  }

  /**
   * @param {string} owner - Owner of the branch
   */
  setBranchClosed(owner) {
    let branch = this.getBranch(owner);
    branch.open = false;
  }

  /**
   * @param {string} owner - Owner of the branch
   * @returns {Branch} Branch
   */
  getBranch(owner) {
    let branch = this.branches.find(branch => branch.owner === owner);
    if (!branch) {
      throw new Error(`Branch with owner ${owner} not found`);
    }
    return branch;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    this._drawHub(ctx);
    this.centerDomino.draw(ctx);
    this._drawBranches(ctx);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawHub(ctx) {
    const centerX = this.position.x;
    const centerY = this.position.y;
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
    ctx.moveTo(centerX - horizontalLength / 2, centerY - verticalWidth / 2);   // Left edge, centered vertically
    ctx.lineTo(centerX + horizontalLength / 2, centerY - verticalWidth / 2);   // Top edge
    ctx.lineTo(centerX + horizontalLength / 2, centerY + verticalWidth / 2);   // Right edge
    ctx.lineTo(centerX - horizontalLength / 2, centerY + verticalWidth / 2);   // Bottom edge
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

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawBranches(ctx) {
    notImplemented();

    for (const branch of this.branches) {
    }
  }

  /**
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setXY(x, y) {
    this.position.setXY(x, y);
    this.centerDomino.setPosition({ x, y });
  }

  /**
   * @param {Position} position
   */
  setPosition(position) {
    this.position.setPosition(position);
    this.centerDomino.setPosition(position);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawAt(ctx, x, y) {
    this.position.setXY(x, y);
    this.draw(ctx);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Position} position
   */
  drawAtPosition(ctx, position) {
    this.position.setPosition(position);
    this.draw(ctx);
  }

  _initBranches() {
    for (let i = 0; i < 8; i++) {
      this.branches.push({
        owner: OPEN_BRANCH_OWNER,
        dominoes: [],
        open: true,
      });
    }
  }
}

export default Hub;
