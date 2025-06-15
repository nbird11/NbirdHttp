/**
 * Generates the HTML template for the header
 * @returns {string} HTML string containing the logo and navigation menu
 */
function headerTemplate() {
  const headerTitle = document.querySelector('header').dataset.title;

  return `
    <img
      src="/assets/NB-logo_v2.png"
      alt="NB Logo"
      class="logo"
      onclick="window.location.href = '/'"
      style="cursor: pointer;"
    >
    ${headerTitle ? `<h1 class="header-title">${headerTitle}</h1>` : ''}
    <nav>
      <a href="/">Home</a>
      <div class="dropdown">
        <a href="#" class="dropbtn">Résumé ▾</a>
        <div class="dropdown-content">
          <a href="/resume/experience/">Experience</a>
          <hr>
          <a href="/resume/education/">Education</a>
          <hr>
          <a href="/resume/projects/">Projects</a>
        </div>
      </div>
      <div class="dropdown">
        <a href="#" class="dropbtn">Games ▾</a>
        <div class="dropdown-content">
          <a href="/back-alley/">Back Alley</a>
          <hr>
          <a href="/dining-philosophers/">Dining Philosophers</a>
          <hr>
          <a href="/mex-train-dominoes/">Mexican Train Dominoes</a>
        </div>
      </div>
      <div class="dropdown">
        <a href="#" class="dropbtn">Other ▾</a>
        <div class="dropdown-content">
          <a href="/quick-pen/">QuickPen</a>
          <hr>
          <a href="/punch.html">Punch Clock</a>
        </div>
      </div>
    </nav>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('header').innerHTML = headerTemplate();
});