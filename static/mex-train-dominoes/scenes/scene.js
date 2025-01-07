/** @typedef {import('../game.js').default} Game */

/** @abstract */
class Scene {
  /**
   * @param {Game} game - The game instance
   */
  constructor(game) {
    /** @type {Game} */
    this.game = game;
  }

  /**
   * Update the scene.
   * @abstract
   */
  update() {}

  /**
   * Draw the scene.
   * @abstract
   */
  draw() {}

  /**
   * Update the scene dimensions.
   */
  updateDimensions() {
    this.game.width = this.game.ctx.canvas.clientWidth;
    this.game.height = this.game.ctx.canvas.clientHeight;
  }
}

export default Scene;