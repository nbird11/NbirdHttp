let seatingChart = [];
const chartContainer = document.getElementById('seating-chart');
let selectedSeat = null;
let offsetX, offsetY; // To store the offset between the mouse and the seat's top-left corner

// Create a draggable seat element
function createSeat(x, y, label = 'Seat') {
  const seat = document.createElement('div');
  seat.classList.add('seat');
  seat.textContent = label;
  seat.style.left = `${x}px`;
  seat.style.top = `${y}px`;

  // Add event listeners for dragging
  seat.onmousedown = startDrag;
  seat.onclick = selectSeat;
  seat.ondblclick = renameSeat;
  return seat;
}

// Handle dragging the seat
function startDrag(event) {
  if (!selectedSeat) return;

  // Calculate the offset between the mouse position and the seat's top-left corner
  const rect = selectedSeat.getBoundingClientRect();
  offsetX = event.clientX - rect.left;
  offsetY = event.clientY - rect.top;

  document.onmousemove = drag;
  document.onmouseup = stopDrag;
}

// Drag the seat with the mouse
function drag(event) {
  // Calculate the new position relative to the chart container
  const containerRect = chartContainer.getBoundingClientRect();
  const newX = event.clientX - containerRect.left - offsetX;
  const newY = event.clientY - containerRect.top - offsetY;

  selectedSeat.style.left = `${newX}px`;
  selectedSeat.style.top = `${newY}px`;
}

// Stop dragging the seat
function stopDrag() {
  document.onmousemove = null;
  document.onmouseup = null;
}

function selectSeat(event) {
  const clickedSeat = event.target;

  // If the clicked seat is already selected, unselect it
  if (selectedSeat === clickedSeat) {
    clickedSeat.classList.remove('selected');
    selectedSeat = null;
    console.log('unselect');
  } else {
    // If a different seat was selected before, unselect it
    if (selectedSeat) {
      selectedSeat.classList.remove('selected');
    }
    // Select the new seat
    selectedSeat = clickedSeat;
    clickedSeat.classList.add('selected');
    console.log('select', selectedSeat);
  }
}

// Rename the seat when double-clicked
function renameSeat(event) {
  const newName = prompt("Enter a new name for the seat:", event.target.textContent);
  if (newName) {
    event.target.textContent = newName;
  }
}

// Function to add a new seat
function addSeat() {
  const x = Math.random() * (chartContainer.offsetWidth - 100);
  const y = Math.random() * (chartContainer.offsetHeight - 100);
  const newSeat = createSeat(x, y);
  seatingChart.push(newSeat);
  chartContainer.appendChild(newSeat);
}

// Function to remove a selected seat
function removeSeat() {
  if (!selectedSeat) {
    alert("No seat selected to remove.");
    return;
  }
  chartContainer.removeChild(selectedSeat);
  seatingChart = seatingChart.filter(seat => seat !== selectedSeat);
  selectedSeat = null;
}

// Function to create a new chart (clears current chart)
function newChart() {
  seatingChart.forEach(seat => chartContainer.removeChild(seat));
  seatingChart = [];
}

// Initialize the main functionality
function main() {
  // Event listeners for menu items
  document.querySelector('.dropdown-content a[href="#"]').addEventListener('click', (event) => {
    event.preventDefault();
    const action = event.target.textContent;
    switch (action) {
      case 'New Chart':
        newChart();
        break;
      case 'Add Student':
        addSeat();
        break;
      case 'Remove Student':
        removeSeat();
        break;
      default:
        alert('Feature not yet implemented.');
    }
  });
}

main();
