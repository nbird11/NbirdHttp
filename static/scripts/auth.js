function authTemplate() {
  return `
  <h2>Authentication</h2>
  <form id="registerForm">
    <h3>Register</h3>
    <input type="text" id="regUsername" placeholder="Username" required>
    <input type="password" id="regPassword" placeholder="Password" required>
    <button type="submit">Register</button>
  </form>

  <form id="loginForm">
    <h3>Login</h3>
    <input type="text" id="loginUsername" placeholder="Username" required>
    <input type="password" id="loginPassword" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>`;
}

function createAuthElement() {
  const authElement = document.createElement('div');
  authElement.id = 'auth';
  authElement.innerHTML = authTemplate();
  return authElement;
}

function createLogoutButton() {
  const logoutButton = document.createElement('button');
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
  } else {
    const message = await response.text();
    alert(message);
  }
}

function logoutUser() {
  localStorage.removeItem('loggedInUser');
  setContentVisible(false);
}

function setContentVisible(contentVisible) {
  document.querySelector('#auth').style.display = contentVisible ? 'none' : 'block';
  document.querySelector('main').style.display = contentVisible ? 'block' : 'none';
  document.querySelector('#logout').style.display = contentVisible ? 'block' : 'none';
}

/**
 * @returns {string} The username of the logged in user, or null if no user is logged in.
 */
function getLoggedInUser() {
  return localStorage.getItem('loggedInUser');
}

document.addEventListener("DOMContentLoaded", init);

export { getLoggedInUser };