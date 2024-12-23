/**
 * Generates the HTML template for the header
 * @returns {string} HTML string containing the logo and navigation menu
 */
function headerTemplate() {
  return `
    <img src="/assets/profPic.jpg" alt="NB Logo" class="logo">
    <nav>
      <a href="/">Home</a>
      <a href="/resume.html">Résumé</a>
      <a href="/punch.html">Punch Clock</a>
      <a href="/quick-pen/">QuickPen</a>
      <a href="https://github.com/nbird11" target="_blank">GitHub</a>
      <a href="https://www.linkedin.com/in/nathanabird/" target="_blank">LinkedIn</a>
    </nav>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('header').innerHTML = headerTemplate();
});