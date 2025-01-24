import projects from './load-projects.js';

/**
 * Generates HTML template for a single project card
 * @param {import('./projects.mjs').Project} project The project object containing all project details
 * @returns {string} HTML string representing the project card
 */
function projectTemplate(project) {
  const techStack = project.technologies.map(tech =>
    `<span class="tech-badge">${tech}</span>`
  ).join('');

  return `
    <div class="project-card" data-categories="${project.categories.join(' ')}">
      <div class="project-image">
        ${project.featured ? '<span class="featured-badge">Featured</span>' : ''}
        <img src="${project.image || './assets/project-default.png'}"
             alt="${project.title} screenshot"
             onerror="this.src='./assets/project-default.png'">
      </div>
      <div class="project-content">
        <div class="project-header">
          <h2>${project.title}</h2>
          <span class="project-date">${project.date}</span>
        </div>
        <div class="tech-stack">
          ${techStack}
        </div>
        <p>${project.description}</p>
        <div class="project-links">
          ${project.demo ? `<a href="${project.demo}" target="_blank" class="demo-link">Demo</a>` : ''}
          ${project.github ? `<a href="${project.github}" target="_blank" class="github-link">Learn More</a>` : ''}
        </div>
      </div>
    </div>`;
}

/**
 * Sets up event listeners for project filter buttons
 * Handles the UI state of active filter and triggers project filtering
 */
function setupFilters() {
  /** @type {NodeListOf<HTMLButtonElement>} */
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const filter = button.dataset.filter;
      filterProjects(filter);
    });
  });
}

/**
 * Filters project cards based on selected category
 * @param {string} filter - The category to filter by ('all' or specific category)
 */
function filterProjects(filter) {
  /** @type {NodeListOf<HTMLDivElement>} */
  const projects = document.querySelectorAll('.project-card');

  projects.forEach(project => {
    if (filter === 'all') {
      project.style.display = 'block';
    } else {
      const categories = project.dataset.categories.split(' ');
      project.style.display = categories.includes(filter) ? 'block' : 'none';
    }
  });
}

/**
 * Initializes the projects page by loading project data and setting up filters.
 * Renders all projects and initializes the filtering functionality
 */
function loadProjects() {
  const projectsHTML = projects.map(project => projectTemplate(project)).join('');
  document.getElementById('project-grid').innerHTML = projectsHTML;
  setupFilters();
}

loadProjects();