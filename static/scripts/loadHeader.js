document.addEventListener('DOMContentLoaded', function () {
  fetch('header.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('header').innerHTML = html;
    })
    .catch(err => console.error('Failed to load header: ', err));
});