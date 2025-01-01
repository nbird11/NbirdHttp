/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('game');
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');

function main() {
  ctx.fillStyle = '#181818';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.font = 'Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('Mexican Train Dominoes', canvas.width / 2, canvas.height / 8);
}

document.addEventListener('DOMContentLoaded', () => {
  main();
});