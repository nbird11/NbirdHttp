/* Toggle dropdown menu */
function fileDropdown() {
  document.getElementById("file-dropdown").classList.toggle("show");
  document.getElementById("edit-dropdown").classList.remove("show");
  document.getElementById("view-dropdown").classList.remove("show");
  document.getElementById("help-dropdown").classList.remove("show");
}
function editDropdown() {
  document.getElementById("file-dropdown").classList.remove("show");
  document.getElementById("edit-dropdown").classList.toggle("show");
  document.getElementById("view-dropdown").classList.remove("show");
  document.getElementById("help-dropdown").classList.remove("show");
}
function viewDropdown() {
  document.getElementById("file-dropdown").classList.remove("show");
  document.getElementById("edit-dropdown").classList.remove("show");
  document.getElementById("view-dropdown").classList.toggle("show");
  document.getElementById("help-dropdown").classList.remove("show");
}
function helpDropdown() {
  document.getElementById("file-dropdown").classList.remove("show");
  document.getElementById("edit-dropdown").classList.remove("show");
  document.getElementById("view-dropdown").classList.remove("show");
  document.getElementById("help-dropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (e) {
  if (!e.target.matches('.dropbtn')) {
    var dropdowns = document.querySelectorAll(".dropdown-content");
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("show");
    })
  }
}
