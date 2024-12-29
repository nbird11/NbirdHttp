const AUTH_EVENT = 'AuthChangeEvent';

function authTemplate() {
  return `
  <h2>Authentication</h2>
  <form id="registerForm">
    <h3>Register</h3>
    <input type="text" id="regUsername" placeholder="Username" required>
    <input type="password" id="regPassword" placeholder="Password" required>
    <div class="button-container">
      <button type="submit">Register</button>
      <span class="toggle-form">
        <p>Already have an account?</p>
        <button type="button" id="goToLogin">Login</button>
      </span>
    </div>
  </form>

  <form id="loginForm">
    <h3>Login</h3>
    <input type="text" id="loginUsername" placeholder="Username" required>
    <input type="password" id="loginPassword" placeholder="Password" required>
    <div class="button-container">
      <button type="submit">Login</button>
      <span class="toggle-form">
        <p>Don't have an account?</p>
        <button type="button" id="goToRegister">Create One</button>
      </span>
    </div>
  </form>

  <style>
    #logout {
      margin: 1rem;
      margin-bottom: 0;
    }

    #auth {
      background-color: var(--background-color-light);
      border: 1px solid var(--accent2-color);
      border-radius: 16px;
      padding: 1rem;
      margin: 2rem auto;
      margin-top: auto;
      max-width: 600px;
    }

    .button-container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-around;
      align-items: end;
    }

    .toggle-form {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .toggle-form p {
      margin-bottom: 0;
    }

    .toggle-form button {
      background-color: var(--accent1-color);
    }

    .toggle-form button:hover {
      background-color: var(--secondary-color);
    }
  </style>
  `;
}

function createAuthElement() {
  const authElement = document.createElement('div');
  authElement.id = 'auth';
  authElement.innerHTML = authTemplate();

  /** @type {HTMLFormElement} */
  const registerForm = authElement.querySelector('#registerForm');
  registerForm.style.display = 'none';

  return authElement;
}

function createLogoutButton() {
  const logoutButton = document.querySelector('header').appendChild(document.createElement('button'));
  logoutButton.id = 'logout';
  logoutButton.textContent = 'Logout';
  return logoutButton;
}

function setupListeners() {
  document.getElementById('logout').onclick = logoutUser;

  document.getElementById('registerForm').onsubmit = async function (event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    document.getElementById('regUsername').value = '';
    const password = document.getElementById('regPassword').value;
    document.getElementById('regPassword').value = '';
    await registerUser(username, password);
  };

  document.getElementById('loginForm').onsubmit = async function (event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    await loginUser(username, password);
  };

  document.getElementById('goToRegister').onclick = toggleRegister;
  document.getElementById('goToLogin').onclick = toggleRegister;
}

function init() {
  document.body.insertBefore(createAuthElement(), document.querySelector('main'));
  document.body.insertBefore(createLogoutButton(), document.querySelector('#auth'));

  setupListeners();

  if (getLoggedInUser()) {
    setContentVisible(true);
  } else {
    setContentVisible(false);
  }
}

async function registerUser(username, password) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password })
  });

  const message = await response.text();
  alert(message);
}

async function loginUser(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password })
  });

  if (response.ok) {
    localStorage.setItem('loggedInUser', username);
    setContentVisible(true);
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, {
      detail: { user: username, action: 'login' }
    }));
  } else {
    const message = await response.text();
    alert(message);
  }
}

function logoutUser() {
  const user = getLoggedInUser();
  localStorage.removeItem('loggedInUser');
  setContentVisible(false);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, {
    detail: { user, action: 'logout' }
  }));
}

function setContentVisible(contentVisible) {
  document.querySelector('#auth').style.display = contentVisible ? 'none' : 'block';
  document.querySelector('main').style.display = contentVisible ? 'block' : 'none';
  document.querySelector('#logout').style.display = contentVisible ? 'block' : 'none';
}

function toggleRegister() {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
}

/**
 * @returns {string} The username of the logged in user, or null if no user is logged in.
 */
function getLoggedInUser() {
  return localStorage.getItem('loggedInUser');
}

document.addEventListener("DOMContentLoaded", init);

export { getLoggedInUser, AUTH_EVENT };