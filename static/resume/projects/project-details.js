import projects from './load-projects.js';

/**
 * Renders the project details on the page
 * @param {import('./load-projects.js').Project} project The project to render
 */
function renderProjectDetails(project) {
  const container = document.getElementById('project-details-container');
  if (!project) {
    container.innerHTML = '<h1>Project not found</h1><p>The project you are looking for does not exist.</p>';
    return;
  }

  document.title = project.title;

  let description = project.longDescription || project.description;
  const descriptionInnerHTML = description.replace(/\n/g, '<br /><br />');

  const techStack = project.technologies.map(tech =>
    `<span class="tech-badge">${tech}</span>`
  ).join('');

  container.innerHTML = `
    <h1>${project.title}</h1>
    <div class="project-header">
      <span class="project-date">${project.date}</span>
    </div>
    <img src="${project.image || './assets/project-default.png'}" alt="${project.title} screenshot" class="project-image" onerror="this.src='./assets/project-default.png'">
    <div class="tech-stack">
      ${techStack}
    </div>
    <p>${descriptionInnerHTML}</p>
    <div class="project-links">
      ${project.demo ? `<a href="${project.demo}" target="_blank" class="demo-link">Demo</a>` : ''}
      ${project.github ? `<a href="${project.github}" target="_blank" class="github-link">Source Code</a>` : ''}
    </div>
    `;
}

/**
 * Initializes the page by reading the project ID from the URL and loading the project details.
 */
function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const project = projects.find(p => p.id === projectId);
  renderProjectDetails(project);
}

document.getElementById('back-button').addEventListener('click', () => {
    window.location.href = './';
});

init(); 