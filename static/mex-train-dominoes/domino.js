class Domino {
  /**
   * @param {number} left - Number on left side (0-12)
   * @param {number} right - Number on right side (0-12)
   */
  constructor(left, right) {
    this.left = left;
    this.right = right;
    this.width = 60;
    this.height = 30;
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
    const leftX = Math.round(x - this.width/2);
    const topY = Math.round(y - this.height/2);
    
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
    
    // Draw numbers with better anti-aliasing
    ctx.fillStyle = 'black';
    ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Ensure text is drawn at exact pixels
    const textY = Math.round(y);
    ctx.fillText(this.left.toString(), Math.round(x - this.width/4), textY);
    ctx.fillText(this.right.toString(), Math.round(x + this.width/4), textY);
    
    ctx.restore();
  }
}

export default Domino; 