/* Toggle dropdown menu */
function fileDropdown(e) {
  e.preventDefault();
  document.getElementById("file-dropdown").classList.toggle("show");
  document.getElementById("edit-dropdown").classList.remove("show");
  document.getElementById("view-dropdown").classList.remove("show");
  document.getElementById("help-dropdown").classList.remove("show");
}
function editDropdown(e) {
  e.preventDefault();
  document.getElementById("file-dropdown").classList.remove("show");
  document.getElementById("edit-dropdown").classList.toggle("show");
  document.getElementById("view-dropdown").classList.remove("show");
  document.getElementById("help-dropdown").classList.remove("show");
}
function viewDropdown(e) {
  e.preventDefault();
  document.getElementById("file-dropdown").classList.remove("show");
  document.getElementById("edit-dropdown").classList.remove("show");
  document.getElementById("view-dropdown").classList.toggle("show");
  document.getElementById("help-dropdown").classList.remove("show");
}
function helpDropdown(e) {
  e.preventDefault();
  document.getElementById("file-dropdown").classList.remove("show");
  document.getElementById("edit-dropdown").classList.remove("show");
  document.getElementById("view-dropdown").classList.remove("show");
  document.getElementById("help-dropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (e) {
  if (!e.target.matches('.dropbtn')) {
    e.preventDefault();
    var dropdowns = document.querySelectorAll(".dropdown-content");
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("show");
    })
  }
}
