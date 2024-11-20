g_loggedInUser = null;

document.addEventListener("DOMContentLoaded", function () {
  if (g_loggedInUser) {
    return;
  }

  fetch('auth.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('auth').innerHTML = html;

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
    })
    .catch(err => console.error('Failed to load auth: ', err));
});

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
    g_loggedInUser = username;

    document.getElementById('auth').style.display = 'none';
    document.getElementById('app').style.display = 'grid';
  } else {
    const message = await response.text();
    alert(message);
  }
}
