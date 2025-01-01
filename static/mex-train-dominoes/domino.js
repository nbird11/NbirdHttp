/**
 * Enum representing the orientation of a domino
 * @enum {number}
 * @readonly
 */
const Orientation = {
  HORIZONTAL: 0,
  VERTICAL: 1
};

class Domino {
  /**
   * @param {number} end1 - Number on one end (0-12)
   * @param {number} end2 - Number on the other end (0-12)
   */
  constructor(end1, end2) {
    this.end1 = end1;
    this.end2 = end2;
    this.orientation = Orientation.HORIZONTAL;
    this.width = 70;
    this.height = 30;
    this.pipRadius = 2;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - Center x coordinate
   * @param {number} y - Center y coordinate
   */
  draw(ctx, x, y) {
    // Save the current context state
    ctx.save();

    // Align to pixel grid for crisp lines
    const leftX = Math.round(x - this.width / 2);
    const topY = Math.round(y - this.height / 2);

    // Draw the domino background
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    // Main rectangle
    ctx.fillRect(leftX, topY, this.width, this.height);
    ctx.strokeRect(leftX + 0.5, topY + 0.5, this.width - 1, this.height - 1);

    // Dividing line
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, topY);
    ctx.lineTo(Math.round(x) + 0.5, topY + this.height);
    ctx.stroke();

    // Draw pips
    const halfWidth = this.width / 2;
    this.drawPips(ctx, leftX + halfWidth / 2, topY + this.height / 2, this.end1);
    this.drawPips(ctx, leftX + halfWidth * 1.5, topY + this.height / 2, this.end2);

    ctx.restore();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} centerX - Center x coordinate of the domino half
   * @param {number} centerY - Center y coordinate of the domino half
   * @param {number} value - Number of pips to draw (0-12)
   */
  drawPips(ctx, centerX, centerY, value) {
    const positions = this.getPipPositions(value);

    ctx.fillStyle = 'black';
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
  getPipPositions(value) {
    const oneAcross = (index) => new PipOffsetBuilder(this.orientation, index, 1).offsets;
    const twoAcross = (index) => new PipOffsetBuilder(this.orientation, index, 2).offsets;
    const threeAcross = (index) => new PipOffsetBuilder(this.orientation, index, 3).offsets;
    const fourAcross = (index) => new PipOffsetBuilder(this.orientation, index, 4).offsets;

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
      case 10: append(offsets, fourAcross(0), twoAcross(1), fourAcross(2)); break;
      case 11: append(offsets, fourAcross(0), threeAcross(1), fourAcross(2)); break;
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
   * @param {Orientation} orientation - 0: horizontal, 1: vertical
   * @param {number} index - 0-based row(/column) index
   * @param {number} quantity - 1-based quantity
   * @throws {Error} if the orientation, index, or quantity is invalid
   */
  constructor(orientation, index, quantity) {
    this.#validateIndex(orientation, index);
    this.#validateQuantity(quantity);
    
    if (![Orientation.HORIZONTAL, Orientation.VERTICAL].includes(orientation)) {
      throw new Error(`Invalid orientation: ${orientation}. Must be 0 (HORIZONTAL) or 1 (VERTICAL).`);
    }
    const indexOffset = index - 1;
    const combineIndexAndOffset = (position) =>
      orientation === Orientation.HORIZONTAL
    ? [position, indexOffset]
    : [indexOffset, position];
    
    /** @type {Array<[number, number]>} `[x offset, y offset]`   */
    this.offsets = PipOffsetBuilder.#POSITIONS[quantity].map(combineIndexAndOffset);
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
