/**
 * Generates the HTML template for the header
 * @returns {string} HTML string containing the logo and navigation menu
 */
function headerTemplate() {
  return `
    <img src="/assets/NB-logo_v2.png" alt="NB Logo" class="logo">
    <nav>
      <a href="/">Home</a>
      <div class="dropdown">
        <a href="#" class="dropbtn">Résumé ▾</a>
        <div class="dropdown-content">
          <a href="/resume/experience/">Experience</a>
          <a href="/resume/education/">Education</a>
          <a href="/resume/projects/">Projects</a>
        </div>
      </div>
      <div class="dropdown">
        <a href="#" class="dropbtn">Games ▾</a>
        <div class="dropdown-content">
          <a href="/back-alley/">Back Alley</a>
          <a href="/mex-train-dominoes/">Mex Train Dominoes</a>
        </div>
      </div>
      <div class="dropdown">
        <a href="#" class="dropbtn">Other ▾</a>
        <div class="dropdown-content">
          <a href="/quick-pen/">QuickPen</a>
          <a href="/punch.html">Punch Clock</a>
        </div>
      </div>
    </nav>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('header').innerHTML = headerTemplate();
});