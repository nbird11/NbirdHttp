
/**
 * @class Position
 * @classdesc A class to represent a position in 2D space
 */
class Position {
  /**
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   */
  setXY(x, y) {
    this.x = x;
    this.y = y;

    return this;
  }

  /**
   * @param {Position} position - The position to set
   */
  setPosition(position) {
    this.x = position.x;
    this.y = position.y;

    return this;
  }

  /**
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   */
  add(x, y) {
    this.x += x;
    this.y += y;

    return this;
  }

  /**
   * @param {Position} position - The position to add
   */
  addPosition(position) {
    this.x += position.x;
    this.y += position.y;

    return this;
  }
}

export default Position;