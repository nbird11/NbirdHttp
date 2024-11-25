document.addEventListener('DOMContentLoaded', function () {
  // In prod, root is from /static/
  const isDev = window.location.pathname.includes('/static/');
  const headerPath = isDev ? '/static/header.html' : '/header.html';
  const pathPrefix = isDev ? '/static/' : '/';

  fetch(headerPath)
    .then(response => response.text())
    .then(html => {
      // Replace relative paths in header content with absolute paths
      html = html.replace(/\.\//g, pathPrefix);
      document.getElementById('header').innerHTML = html;
    })
    .catch(err => console.error('Failed to load header: ', err));
});