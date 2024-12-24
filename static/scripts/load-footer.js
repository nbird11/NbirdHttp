/**
 * Generates the HTML template for the footer
 * @returns {string} HTML string containing footer content and modal templates
 */
function footerTemplate() {
  return `
    <div>
      <a href="#" id="about-link">About</a> | <a href="#" id="contact-link">Contact</a>
    </div>
    <p>&copy; ${new Date().getFullYear()} Nathan Bird</p>
    <div class="social-icons">
      <a href="https://www.youtube.com/@NathanBird" target="_blank">
        <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/youtube.svg" alt="YouTube">
      </a>
      <a href="https://github.com/nbird11" target="_blank">
        <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg" alt="GitHub">
      </a>
      <a href="https://www.linkedin.com/in/nathanabird/" target="_blank">
        <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linkedin.svg" alt="LinkedIn">
      </a>
    </div>

    <!-- About Modal -->
    <div id="about-modal" class="modal">
      <div class="modal-content">
        <span class="close-modal" data-modal="about-modal">&times;</span>
        <h2>About This Site</h2>
        <p>This webserver was created to serve as a personal website for Nathan Bird. It is built with a Go backend and uses HTML templates to display the content. It also acts as a playground for me to experiment with new technologies and host my hobby projects.</p>
      </div>
    </div>

    <!-- Contact Modal -->
    <div id="contact-modal" class="modal">
      <div class="modal-content">
        <span class="close-modal" data-modal="contact-modal">&times;</span>
        <h2>Contact Me</h2>
        <p>Feel free to reach out through any of the following methods:</p>
        <ul>
          <li>Email: <a href="mailto:nathanbirdka@gmail.com">nathanbirdka@gmail.com</a></li>
          <li>Text: <a href="tel:+13853925995">(385) 392-5995</a></li>
        </ul>
        <p>You can also connect with me on:</p>
        <ul>
          <li>
            <a href="https://www.linkedin.com/in/nathanabird/" target="_blank">LinkedIn</a>
          </li>
          <li>
            <a href="https://github.com/nbird11" target="_blank">GitHub</a>
          </li>
        </ul>
      </div>
    </div>
  `;
}

/**
 * Sets up event listeners for modal functionality
 * Handles opening and closing of modals through various user interactions
 */
function setupModals() {
  // Open modals
  document.getElementById('about-link').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('about-modal').style.display = 'block';
  });

  document.getElementById('contact-link').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('contact-modal').style.display = 'block';
  });

  // Close modals
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
      const modalId = button.dataset.modal;
      document.getElementById(modalId).style.display = 'none';
    });
  });

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });
}

/**
 * Initializes the footer by loading the template and setting up modal functionality
 */
function loadFooter() {
  const footer = footerTemplate();
  document.querySelector('footer').innerHTML = footer;
  setupModals();
}

document.addEventListener('DOMContentLoaded', loadFooter);