import Angle from './angle.js';
import Position from './position.js';
import { DOMINO_BG_COLOR, DOMINO_LW_RATIO, PIP_COLORS } from '../utils/constants.js';

class Domino {
  static LENGTH = 50;
  static WIDTH = Domino.LENGTH * DOMINO_LW_RATIO;

  /**
   * @param {number} end1 - Number on one end (0-12)
   * @param {number} end2 - Number on the other end (0-12)
   */
  constructor(end1, end2) {
    /** @type {number} */
    this.end1 = end1;
    /** @type {number} */
    this.end2 = end2;
    /** @type {Position} */
    this.position = new Position(0, 0);
    /** @type {Angle} */
    this.rotation = new Angle(0);  // Angle in radians
    /** @type {number} */
    this.width = Domino.LENGTH;
    /** @type {number} */
    this.height = Domino.WIDTH;
    /** @type {number} */
    this.pipRadius = Domino.WIDTH / 15;
  }

  /**
   * @param {Position} position
   */
  setPosition(position) {
    this.position.setPosition(position);

    return this;  // for chaining
  }

  setEnd1Left() {
    this.setRotation(0);
    return this;
  }

  setEnd1TopLeft() {
    this.setRotation(45);
    return this;
  }

  setEnd1Top() {
    this.setRotation(90);
    return this;
  }

  setEnd1TopRight() {
    this.setRotation(135);
    return this;
  }

  setEnd1Right() {
    this.setRotation(180);
    return this;
  }

  setEnd1BottomRight() {
    this.setRotation(225);
    return this;
  }

  setEnd1Bottom() {
    this.setRotation(270);
    return this;
  }

  setEnd1BottomLeft() {
    this.setRotation(315);
    return this;
  }

  /**
   * @param {number} degrees - Angle in degrees
   */
  setRotation(degrees) {
    this.rotation.setDegrees(degrees);

    return this;  // for chaining
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();

    // Move to center point and rotate
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation.getRadians());

    const leftX = -this.width / 2;
    const topY = -this.height / 2;

    // Draw the domino background
    ctx.fillStyle = DOMINO_BG_COLOR;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;

    // Main rectangle with rounded corners
    ctx.beginPath();
    ctx.roundRect(leftX, topY, this.width, this.height, 5);
    ctx.fill();
    ctx.stroke();

    // Dividing line
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(0, topY + this.height);
    ctx.stroke();

    // Draw pips
    this._drawPips(ctx, true, this.end1);
    this._drawPips(ctx, false, this.end2);

    ctx.restore();

    return this;  // for chaining
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  drawAt(ctx, x, y) {
    this.position.setPosition({ x, y });
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

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} end1 - True if end1, default true
   * @param {number} value - Number of pips to draw (0-12)
   */
  _drawPips(ctx, end1 = true, value) {
    const positions = this._getPipPositions(value);

    if (value === 0) return;
    ctx.fillStyle = PIP_COLORS[value];
    positions.forEach(([xOffset, yOffset]) => {
      ctx.beginPath();
      const halfWidth = this.width / 2;
      ctx.arc(
        end1 ? (-halfWidth / 2) + xOffset * Domino.LENGTH / 9 : (halfWidth / 2) + xOffset * Domino.LENGTH / 9,
        yOffset * Domino.WIDTH / 3.75,
        this.pipRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }

  /**
   * Get relative pip positions for a given value
   * @param {number} value
   * @returns {Array<[number, number]>} Array of [x, y] offsets
   */
  _getPipPositions(value) {
    const oneAcross = (index) => new PipOffsetBuilder(index, 1).offsets;
    const twoAcross = (index) => new PipOffsetBuilder(index, 2).offsets;
    const threeAcross = (index) => new PipOffsetBuilder(index, 3).offsets;
    const fourAcross = (index) => new PipOffsetBuilder(index, 4).offsets;

    const append = (target, ...offsets) => extendArray(target, ...offsets);

    /** @type {Array<[number, number]>} */
    let offsets = [];

    switch (value) {
      case 0: return [];
      case 1: append(offsets, oneAcross(1)); break;
      case 2: append(offsets, [-1, 1], [1, -1]); break;
      case 3: append(offsets, [-1, 1], oneAcross(1), [1, -1]); break;
      case 4: append(offsets, twoAcross(0), twoAcross(2)); break;
      case 5: append(offsets, twoAcross(0), oneAcross(1), twoAcross(2)); break;
      case 6: append(offsets, threeAcross(0), threeAcross(2)); break;
      case 7: append(offsets, threeAcross(0), oneAcross(1), threeAcross(2)); break;
      case 8: append(offsets, threeAcross(0), twoAcross(1), threeAcross(2)); break;
      case 9: append(offsets, threeAcross(0), threeAcross(1), threeAcross(2)); break;
      case 10: append(offsets, fourAcross(0), [[-1.5, 0], [1.5, 0]], fourAcross(2)); break;
      case 11: append(offsets, fourAcross(0), [[-1.5, 0], [0, 0], [1.5, 0]], fourAcross(2)); break;
      case 12: append(offsets, fourAcross(0), fourAcross(1), fourAcross(2)); break;
      default: return [];
    }
    return offsets;
  }
}  // class Domino

class PipOffsetBuilder {
  static #POSITIONS = {
    1: [0],
    2: [-1, 1],
    3: [-1, 0, 1],
    4: [-1.5, -0.5, 0.5, 1.5]
  }

  /**
   * @param {number} index - 0-based row(/column) index
   * @param {number} quantity - 1-based quantity
   * @throws {Error} if the index or quantity is invalid
   */
  constructor(index, quantity) {
    this.#validateIndex(index);
    this.#validateQuantity(quantity);

    const indexOffset = index - 1;

    /** @type {Array<[number, number]>} `[x offset, y offset]` */
    this.offsets = PipOffsetBuilder.#POSITIONS[quantity].map(
      position => [position, indexOffset]
    );
  }

  /**
   * @param {number} index - 0-based index
   * @throws {Error} if the index is invalid for the given orientation
   */
  #validateIndex(index) {
    if (index < 0 || index > 2) {
      throw new Error(`Invalid row index: ${index}. Must be in range 0-2.`);
    }
  }

  /**
   * @param {number} quantity - 1-based quantity
   * @throws {Error} if the quantity is invalid
   */
  #validateQuantity(quantity) {
    if (quantity < 1 || quantity > 4) {
      throw new Error(`Invalid quantity: ${quantity}. Must be in range 1-4.`);
    }
  }
}  // class PipOffsetBuilder

/**
 * Helper function to extend an array with one or more optionally nested arrays.
 * @param {Array<[number, number]>} target
 * @param {Array<[number, number]> | [number, number]} offsets
 * @returns {Array<[number, number]>} target
 */
function extendArray(target, ...offsets) {
  offsets.forEach(offset => {
    if (Array.isArray(offset[0])) {
      target.push(...offset);
    } else {
      target.push(offset);
    }
  });
  return target;  // for chaining
}

export default Domino;
