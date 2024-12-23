/**
 * Generates the HTML template for the footer
 * @returns {string} HTML string containing footer content and modal templates
 */
function footerTemplate() {
  return `
    <div class="footer-content">
      <div class="footer-links">
        <a href="#" id="about-link">About</a> | <a href="#" id="contact-link">Contact</a>
      </div>
      <p>&copy; ${new Date().getFullYear()} Nathan Bird</p>
      <div class="social-icons">
        <a href="https://github.com/nbird11" target="_blank">
          <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg" alt="GitHub">
        </a>
        <a href="https://www.linkedin.com/in/nathanabird/" target="_blank">
          <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linkedin.svg" alt="LinkedIn">
        </a>
      </div>
    </div>

    <!-- About Modal -->
    <div id="about-modal" class="modal">
      <div class="modal-content">
        <span class="close-modal" data-modal="about-modal">&times;</span>
        <h2>About This Site</h2>
        <p>This website showcases my projects and experience as a software developer. Built with vanilla JavaScript and modern CSS, it demonstrates my commitment to clean, efficient code and responsive design.</p>
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
      </div>
    </div>
  `;
}

/**
 * Sets up event listeners for modal functionality
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('footer').innerHTML = footerTemplate();
  setupModals();
}); 