/**
 * Generates the HTML template for the header
 * @returns {string} HTML string containing the logo and navigation menu
 */
function headerTemplate() {
  return `
    <img src="/assets/simple-NB-logo.png" alt="NB Logo" class="logo">
    <nav>
      <a href="/">Home</a>
      <div class="dropdown">
        <a href="#" class="dropbtn">Résumé ▾</a>
        <div class="dropdown-content">
          <a href="/resume/education/">Education</a>
          <a href="/resume/experience/">Experience</a>
          <a href="/resume/projects/">Projects</a>
        </div>
      </div>
      <a href="/punch.html">Punch Clock</a>
      <a href="/quick-pen/">QuickPen</a>
    </nav>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('header').innerHTML = headerTemplate();
});