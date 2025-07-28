import profile from '/scripts/load-profile.js';

const logoFallback = '/assets/NB-logo_v2.png';

/**
 * Creates the HTML for a single experience item
 * @param {import('../../scripts/load-profile.js').Experience} experience
 * @returns {string} HTML string for the experience item
 */
function experienceTemplate(experience) {
  const logoSrc = experience.logo || logoFallback;
  const bullets = experience.bullets.map(bullet => `<li>${bullet}</li>`).join('');

  return `
    <div class="card-item">
      <img class="card-logo company-logo"
        src="${logoSrc}"
        alt="${experience.company} logo"
        onerror="this.src='${logoFallback}'"
        style="border-radius:15px">
      <div class="card-content">
        <div class="card-header">
          <h2 class="card-title">${experience.title}</h2>
          <p>${experience.company} · ${experience.employmentType}</p>
          <p>${experience.start} - ${experience.end}</p>
          <p>${experience.location} · ${experience.locationType}</p>
        </div>
        <ul class="card-list-items">
          ${bullets}
        </ul>
      </div>
    </div>`;
}

/**
 * Loads all experience items into the experience-list div
 */
function loadExperience() {
  const experienceHTML = profile.experience.map(exp => experienceTemplate(exp)).join('');
  document.getElementById('experience-list').innerHTML = experienceHTML;
}

loadExperience();