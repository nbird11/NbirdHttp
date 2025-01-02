/** @type {Record<number, string>} */
const PipColors = {
  1: '#ff0000',   // Red
  2: '#638c4d',   // Green
  3: '#7f4db3',   // Purple
  4: '#63d4d3',   // Bright Blue
  5: '#ff69b4',   // Pink
  6: '#d0870e',   // Orange
  7: '#707070',   // Gray
  8: '#e6c619',   // Yellow
  9: '#009d9d',   // Cyan
  10: '#4242ff',  // Blue
  11: '#704214',  // Brown
  12: '#75929b',  // Light Blue
};

const DOMINO_BACKGROUND_COLOR = '#f8f6ec';

class Domino {
  /**
   * @param {number} end1 - Number on one end (0-12)
   * @param {number} end2 - Number on the other end (0-12)
   */
  constructor(end1, end2) {
    this.end1 = end1;
    this.end2 = end2;
    this.rotation = 0;  // Angle in radians
    this.width = 70;
    this.height = 30;
    this.pipRadius = 2;
  }

  /**
   * Set the rotation of the domino
   * @param {number} degrees - Rotation in degrees
   */
  setRotation(degrees) {
    // Normalize degrees to 0-360 range
    degrees = ((degrees % 360) + 360) % 360;
    this.rotation = degrees * Math.PI / 180;
    return this;  // for chaining
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - Center x coordinate
   * @param {number} y - Center y coordinate
   */
  draw(ctx, x, y) {
    ctx.save();

    // Move to center point and rotate
    ctx.translate(x, y);
    ctx.rotate(this.rotation);

    const leftX = Math.round(-this.width / 2);
    const topY = Math.round(-this.height / 2);

    // Draw the domino background
    ctx.fillStyle = DOMINO_BACKGROUND_COLOR;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

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
    const halfWidth = this.width / 2;
    this._drawPips(ctx, -halfWidth / 2, 0, this.end1);
    this._drawPips(ctx, halfWidth / 2, 0, this.end2);

    ctx.restore();

    return this;  // for chaining
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} centerX - Center x coordinate of the domino half
   * @param {number} centerY - Center y coordinate of the domino half
   * @param {number} value - Number of pips to draw (0-12)
   */
  _drawPips(ctx, centerX, centerY, value) {
    const positions = this._getPipPositions(value);

    // Use black for 0, otherwise use the color for the pip count
    if (value === 0) return;
    ctx.fillStyle = PipColors[value];
    positions.forEach(([xOffset, yOffset]) => {
      ctx.beginPath();
      ctx.arc(
        Math.round(centerX + xOffset * 8),
        Math.round(centerY + yOffset * 8),
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
