/** @module angle */

/**
 * @class Angle
 * @classdesc A class to represent an angle.
 * @method constructor
 * @method getRadians
 * @method getDegrees
 * @method setDegrees
 * @method addDegrees
 */
class Angle {
  /**
   * @param {number} degrees - Rotation in degrees
   */
  constructor(degrees) {
    this.radians = this.#toRadians(this.#normalize(degrees));
  }

  /**
   * Get the rotation of the domino in degrees
   * @returns {number} Rotation in degrees
   */
  getRadians() {
    return this.radians;
  }

  /**
   * Get the rotation of the domino in degrees
   * @returns {number} Rotation in degrees
   */
  getDegrees() {
    return this.#toDegrees(this.radians);
  }

  /**
   * Set the rotation of the domino in degrees
   * @param {number} degrees - Rotation in degrees
   */
  setDegrees(degrees) {
    this.radians = this.#toRadians(this.#normalize(degrees));
    return this;  // for chaining
  }

  /**
   * Add a rotation in degrees
   * @param {number?} degrees - Rotation in degrees; defaults to 1
   */
  addDegrees(degrees = 1) {
    this.setDegrees(this.getDegrees() + degrees);
    return this;  // for chaining
  }

  /**
   * Degrees to radians
   * @private
   * @param {number} degrees - Rotation in degrees
   * @returns {number} Rotation in radians
   */
  #toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  /**
   * Radians to degrees
   * @private
   * @param {number} radians - Rotation in radians
   * @returns {number} Rotation in degrees
   */
  #toDegrees(radians) {
    return (radians * 180 / Math.PI) % 360;
  }

  /**
   * Normalize the rotation to 0-360 degrees
   * @private
   * @param {number} degrees - Rotation in degrees
   * @returns {number} Rotation in degrees
   */
  #normalize(degrees) {
    return ((degrees % 360) + 360) % 360;
  }
}

export default Angle;