let seatingChart = [];
const chartContainer = document.getElementById('seating-chart');
let selectedSeat = null;
let draggedSeat = null;
let offsetX, offsetY;
let contextMenu = null;
let contextMenuX = 0;
let contextMenuY = 0;
const SNAP_THRESHOLD = 20;    // Distance in pixels when seats will snap together
const SEAT_SIZE = 100;        // Total size including borders
const GRID_SIZE = 10;         // Grid size
const TOUCH_THRESHOLD = 5;    // Threshold for detecting touching seats
let seatGroups = [];      // Array of arrays, each inner array is a group of seats
let hasUnsavedChanges = false;

// Create a draggable seat element
function createSeat(x, y, label = 'Seat') {
	const seat = document.createElement('div');
	seat.classList.add('seat');

	// Create a span for the text
	const textSpan = document.createElement('span');
	textSpan.textContent = label;
	textSpan.contentEditable = false; // Start as non-editable
	textSpan.spellcheck = false;

	// Add mousedown event to the span as well
	textSpan.addEventListener('mousedown', startDrag);

	// Handle when text editing is complete
	textSpan.addEventListener('blur', () => {
		textSpan.contentEditable = false;
	});

	// Handle enter key to finish editing
	textSpan.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			textSpan.blur();
		}
	});

	seat.appendChild(textSpan);
	seat.style.left = `${x}px`;
	seat.style.top = `${y}px`;

	seat.addEventListener('mousedown', startDrag);
	seat.addEventListener('click', selectSeat);
	seat.addEventListener('dblclick', (e) => {
		const textSpan = e.target.querySelector('span') || e.target;
		textSpan.contentEditable = true;
		textSpan.focus();
		// Select all text in the span
		const selection = window.getSelection();
		const range = document.createRange();
		range.selectNodeContents(textSpan);
		selection.removeAllRanges();
		selection.addRange(range);
		e.stopPropagation(); // Prevent dragging when double-clicking to edit
	});
	seat.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		if (selectedSeat) {
			selectedSeat.classList.remove('selected');
		}
		selectedSeat = seat;
		seat.classList.add('selected');

		showContextMenu(e.pageX, e.pageY);
	});

	return seat;
}

// Handle dragging the seat
function startDrag(event) {
	// Only handle left mouse button
	if (event.button !== 0) return;

	// Get the seat element whether we clicked the seat div or the span
	draggedSeat = event.target.closest('.seat');
	if (!draggedSeat) return;

	// Calculate the offset between the mouse position and the seat's top-left corner
	const rect = draggedSeat.getBoundingClientRect();
	offsetX = event.clientX - rect.left;
	offsetY = event.clientY - rect.top;

	document.addEventListener('mousemove', drag);
	document.addEventListener('mouseup', stopDrag);

	// Prevent text selection during drag
	event.preventDefault();
}

// Drag the seat with the mouse
function drag(event) {
	if (!draggedSeat) return;

	const containerRect = chartContainer.getBoundingClientRect();
	let newX = event.clientX - containerRect.left - offsetX;
	let newY = event.clientY - containerRect.top - offsetY;

	// Get potential snap positions
	const snapPosition = getSnapPosition(newX, newY);

	if (snapPosition) {
		newX = snapPosition.x;
		newY = snapPosition.y;
	} else {
		// Snap to grid
		newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
		newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
	}

	// Bounds checking
	const maxX = containerRect.width - SEAT_SIZE;
	const maxY = containerRect.height - SEAT_SIZE;

	draggedSeat.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
	draggedSeat.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
}

// Stop dragging the seat
function stopDrag() {
	if (draggedSeat) {
		updateGroups();
		markUnsavedChanges();
	}
	draggedSeat = null;
	document.removeEventListener('mousemove', drag);
	document.removeEventListener('mouseup', stopDrag);
}

function selectSeat(event) {
	// Get the seat element whether we clicked the seat div or the span
	const clickedSeat = event.target.closest('.seat');
	if (!clickedSeat) return;

	// If the clicked seat is already selected, unselect it
	if (selectedSeat === clickedSeat) {
		clickedSeat.classList.remove('selected');
		selectedSeat = null;
	} else {
		// If a different seat was selected before, unselect it
		if (selectedSeat) {
			selectedSeat.classList.remove('selected');
		}
		// Select the new seat
		selectedSeat = clickedSeat;
		clickedSeat.classList.add('selected');
	}
}

// Rename the seat when double-clicked
function renameSeat(event) {
	const textSpan = event.target.querySelector('span') || event.target;
	textSpan.contentEditable = true;
	textSpan.focus();
	// Select all text in the span
	const selection = window.getSelection();
	const range = document.createRange();
	range.selectNodeContents(textSpan);
	selection.removeAllRanges();
	selection.addRange(range);
}

// Function to add a new seat
function addSeat(x = null, y = null) {
	let newX, newY;

	if (x === null || y === null) {
		// Random position, snapped to grid
		newX = Math.round((Math.random() * (chartContainer.offsetWidth - SEAT_SIZE)) / GRID_SIZE) * GRID_SIZE;
		newY = Math.round((Math.random() * (chartContainer.offsetHeight - SEAT_SIZE)) / GRID_SIZE) * GRID_SIZE;
	} else {
		// Provided position, snapped to grid
		newX = Math.round(x / GRID_SIZE) * GRID_SIZE;
		newY = Math.round(y / GRID_SIZE) * GRID_SIZE;
	}

	const newSeat = createSeat(newX, newY);
	seatingChart.push(newSeat);
	chartContainer.appendChild(newSeat);
	markUnsavedChanges();
}

// Function to remove a selected seat
function removeSeat() {
	if (selectedSeat) {
		selectedSeat.remove();
		seatingChart = seatingChart.filter(seat => seat !== selectedSeat);
		selectedSeat = null;
		updateGroups();
		markUnsavedChanges();
	} else {
		alert("No seat selected.");
	}
}

// Function to create a new chart (clears current chart)
function newChart() {
	if (hasUnsavedChanges) {
		if (!confirm('You have unsaved changes. Are you sure you want to create a new chart?')) {
			return;
		}
	}
	seatingChart.forEach(seat => seat.remove());
	seatingChart = [];
	selectedSeat = null;
	document.getElementById('chart-title').textContent = 'Untitled Seating Chart';
	clearUnsavedChanges();
}

// Add this function to create the context menu
function createContextMenu(type = 'seat') {
	const menu = document.createElement('div');
	menu.className = 'context-menu';

	if (type === 'seat') {
		menu.innerHTML = `
			<div class="context-menu-item" data-action="rename">Rename Student</div>
			<div class="context-menu-separator"></div>
			<div class="context-menu-item" data-action="remove">Remove Student</div>
		`;
	} else if (type === 'canvas') {
		menu.innerHTML = `
			<div class="context-menu-item" data-action="addStudent">Add Student</div>
			<div class="context-menu-separator"></div>
			<div class="context-menu-item" data-action="clearAll">Clear All</div>
		`;
	}

	// Add event listeners for menu items
	menu.addEventListener('click', (e) => {
		const action = e.target.dataset.action;
		switch (action) {
			case 'rename':
				renameSeat({ target: selectedSeat });
				break;
			case 'remove':
				removeSeat();
				break;
			case 'addStudent':
				// Use the stored coordinates for precise placement
				addSeat(contextMenuX, contextMenuY);
				break;
			case 'clearAll':
				newChart();
				break;
		}
		hideContextMenu();
	});

	document.body.appendChild(menu);
	return menu;
}

function showContextMenu(x, y, type = 'seat') {
	// Store the coordinates relative to the chart container
	const containerRect = chartContainer.getBoundingClientRect();
	contextMenuX = x - containerRect.left;
	contextMenuY = y - containerRect.top;

	// Remove existing context menu if it exists
	if (contextMenu) {
		contextMenu.remove();
	}

	// Create new context menu of specified type
	contextMenu = createContextMenu(type);

	// Position and show the menu
	contextMenu.style.display = 'block';
	contextMenu.style.left = `${x}px`;
	contextMenu.style.top = `${y}px`;
}

function hideContextMenu() {
	if (contextMenu) {
		contextMenu.style.display = 'none';
	}
}

// Add document-level click handler to hide context menu
document.addEventListener('click', (e) => {
	if (!e.target.closest('.context-menu')) {
		hideContextMenu();
	}
});

// Prevents the default browser context menu everywhere except seats
document.addEventListener('contextmenu', (e) => {
	if (!e.target.closest('.seat') && !e.target.closest('#seating-chart')) {
		hideContextMenu();
	}
});

// Add context menu event listener to the chart container
chartContainer.addEventListener('contextmenu', (e) => {
	e.preventDefault();

	// If clicked on empty space (not on a seat)
	if (e.target === chartContainer) {
		// Deselect any selected seat
		if (selectedSeat) {
			selectedSeat.classList.remove('selected');
			selectedSeat = null;
		}
		showContextMenu(e.pageX, e.pageY, 'canvas');
	}
});

// Add this function to calculate snap positions
function getSnapPosition(x, y) {
	const otherSeats = seatingChart.filter(seat => seat !== draggedSeat);
	const HALF_SEAT = SEAT_SIZE / 2;

	for (const seat of otherSeats) {
		const seatRect = seat.getBoundingClientRect();
		const chartRect = chartContainer.getBoundingClientRect();
		const seatX = Math.round(seatRect.left - chartRect.left);
		const seatY = Math.round(seatRect.top - chartRect.top);

		let snapPos = null;

		// Right edge snapping
		if (Math.abs((x + SEAT_SIZE) - seatX) < SNAP_THRESHOLD) {
			if (Math.abs(y - seatY) < SNAP_THRESHOLD) {
				snapPos = { x: seatX - SEAT_SIZE, y: seatY }; // Align with top
			}
			if (Math.abs(y - (seatY + HALF_SEAT)) < SNAP_THRESHOLD) {
				snapPos = { x: seatX - SEAT_SIZE, y: seatY + HALF_SEAT }; // Align with middle
			}
			if (Math.abs(y - (seatY - HALF_SEAT)) < SNAP_THRESHOLD) {
				snapPos = { x: seatX - SEAT_SIZE, y: seatY - HALF_SEAT }; // Align with bottom
			}
		}

		// Left edge snapping
		if (Math.abs(x - (seatX + SEAT_SIZE)) < SNAP_THRESHOLD) {
			if (Math.abs(y - seatY) < SNAP_THRESHOLD) {
				snapPos = { x: seatX + SEAT_SIZE, y: seatY }; // Align with top
			}
			if (Math.abs(y - (seatY + HALF_SEAT)) < SNAP_THRESHOLD) {
				snapPos = { x: seatX + SEAT_SIZE, y: seatY + HALF_SEAT }; // Align with middle
			}
			if (Math.abs(y - (seatY - HALF_SEAT)) < SNAP_THRESHOLD) {
				snapPos = { x: seatX + SEAT_SIZE, y: seatY - HALF_SEAT }; // Align with bottom
			}
		}

		// Bottom edge snapping
		if (Math.abs((y + SEAT_SIZE) - seatY) < SNAP_THRESHOLD) {
			if (Math.abs(x - seatX) < SNAP_THRESHOLD) {
				snapPos = { x: seatX, y: seatY - SEAT_SIZE }; // Align with left
			}
			if (Math.abs(x - (seatX + HALF_SEAT)) < SNAP_THRESHOLD) {
				snapPos = { x: seatX + HALF_SEAT, y: seatY - SEAT_SIZE }; // Align with middle
			}
			if (Math.abs(x - (seatX - HALF_SEAT)) < SNAP_THRESHOLD) {
				snapPos = { x: seatX - HALF_SEAT, y: seatY - SEAT_SIZE }; // Align with right
			}
		}

		// Top edge snapping
		if (Math.abs(y - (seatY + SEAT_SIZE)) < SNAP_THRESHOLD) {
			if (Math.abs(x - seatX) < SNAP_THRESHOLD) {
				snapPos = { x: seatX, y: seatY + SEAT_SIZE }; // Align with left
			}
			if (Math.abs(x - (seatX + HALF_SEAT)) < SNAP_THRESHOLD) {
				snapPos = { x: seatX + HALF_SEAT, y: seatY + SEAT_SIZE }; // Align with middle
			}
			if (Math.abs(x - (seatX - HALF_SEAT)) < SNAP_THRESHOLD) {
				snapPos = { x: seatX - HALF_SEAT, y: seatY + SEAT_SIZE }; // Align with right
			}
		}

		if (snapPos) {
			snapPos.x = Math.round(snapPos.x / GRID_SIZE) * GRID_SIZE;
			snapPos.y = Math.round(snapPos.y / GRID_SIZE) * GRID_SIZE;
			return snapPos;
		}
	}
	return null;
}

// Add this function to update groups after dragging
function updateGroups() {
	seatGroups = [];
	const processedSeats = new Set();

	for (const seat of seatingChart) {
		if (processedSeats.has(seat)) continue;

		const group = findConnectedSeats(seat);
		if (group.length > 1) {
			seatGroups.push(group);
		}
		group.forEach(s => processedSeats.add(s));
	}

	console.log('Current groups:', seatGroups);
}

// Add this function to find connected seats
function findConnectedSeats(startSeat) {
	const group = [startSeat];
	const processed = new Set([startSeat]);
	const toProcess = [startSeat];

	while (toProcess.length > 0) {
		const seat = toProcess.pop();
		const neighbors = findNeighbors(seat);

		for (const neighbor of neighbors) {
			if (!processed.has(neighbor)) {
				group.push(neighbor);
				processed.add(neighbor);
				toProcess.push(neighbor);
			}
		}
	}

	return group;
}

// Add this function to find neighboring seats
function findNeighbors(seat) {
	const neighbors = [];
	const seatRect = seat.getBoundingClientRect();
	const chartRect = chartContainer.getBoundingClientRect();

	// Get seat positions relative to the chart
	const seatLeft = seatRect.left - chartRect.left;
	const seatRight = seatLeft + SEAT_SIZE;
	const seatTop = seatRect.top - chartRect.top;
	const seatBottom = seatTop + SEAT_SIZE;

	for (const otherSeat of seatingChart) {
		if (otherSeat === seat) continue;

		const otherRect = otherSeat.getBoundingClientRect();
		const otherLeft = otherRect.left - chartRect.left;
		const otherRight = otherLeft + SEAT_SIZE;
		const otherTop = otherRect.top - chartRect.top;
		const otherBottom = otherTop + SEAT_SIZE;

		// Check horizontal touching (left/right edges close AND vertical overlap)
		const horizontalTouch =
			(Math.abs(seatRight - otherLeft) < TOUCH_THRESHOLD || Math.abs(seatLeft - otherRight) < TOUCH_THRESHOLD) && // Edges close
			!(seatBottom < otherTop || seatTop > otherBottom); // Vertical overlap

		// Check vertical touching (top/bottom edges close AND horizontal overlap)
		const verticalTouch =
			(Math.abs(seatBottom - otherTop) < TOUCH_THRESHOLD || Math.abs(seatTop - otherBottom) < TOUCH_THRESHOLD) && // Edges close
			!(seatRight < otherLeft || seatLeft > otherRight); // Horizontal overlap

		if (horizontalTouch || verticalTouch) {
			neighbors.push(otherSeat);
		}
	}

	return neighbors;
}

function randomizeAllSeatNames(e) {
	// Collect seat labels and previous groupings
	const seatLabels = seatingChart.map(seat => seat.querySelector('span').textContent);
	const currentGroupAssignments = generateCurrentGroupMap();

	// Shuffle the seat labels
	let shuffledNames = shuffleArray(seatLabels);

	// Retry shuffle until no two previous group members are adjacent, or give up after a few tries
	let attempt = 0;
	const maxAttempts = 10;
	while (attempt < maxAttempts && !isValidShuffle(shuffledNames, currentGroupAssignments)) {
			shuffledNames = shuffleArray(seatLabels);
			attempt++;
	}

	// Assign new shuffled names to seats
	seatingChart.forEach((seat, index) => {
			seat.querySelector('span').textContent = shuffledNames[index];
	});

	console.log(`Randomized seat names after ${attempt + 1} attempt(s).`);
}

function generateCurrentGroupMap() {
	const groupMap = new Map();
	seatGroups.forEach(group => {
			group.forEach(seat => {
					groupMap.set(seat.querySelector('span').textContent, group);
			});
	});
	return groupMap;
}

function isValidShuffle(shuffledNames, groupMap) {
	for (let i = 0; i < shuffledNames.length - 1; i++) {
			const currentName = shuffledNames[i];
			const nextName = shuffledNames[i + 1];

			const currentGroup = groupMap.get(currentName);
			const nextGroup = groupMap.get(nextName);

			if (currentGroup && nextGroup && currentGroup === nextGroup) {
					return false; // Two members of the same previous group are adjacent
			}
	}
	return true;
}

// Fisher-Yates Shuffle
function shuffleArray(array) {
	let currentIndex = array.length, randomIndex;

	while (currentIndex != 0) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}

// Update the markUnsavedChanges function
function markUnsavedChanges() {
	hasUnsavedChanges = true;
	document.title = '* ' + document.getElementById('chart-title').textContent;
	document.querySelector('.unsaved-indicator').classList.add('show');
}

// Update the clearUnsavedChanges function
function clearUnsavedChanges() {
	hasUnsavedChanges = false;
	document.title = document.getElementById('chart-title').textContent;
	document.querySelector('.unsaved-indicator').classList.remove('show');
}

// Update the window close handler
window.addEventListener('beforeunload', (e) => {
	if (hasUnsavedChanges) {
		const message = 'You have unsaved changes. Are you sure you want to leave?';
		e.preventDefault();
		return message;  // Modern browsers will show their own message regardless
	}
});

// Add click handler to chart container for unselecting seats
chartContainer.addEventListener('click', (e) => {
	// Only unselect if clicking directly on the container (not on a seat)
	if (e.target === chartContainer && selectedSeat) {
		selectedSeat.classList.remove('selected');
		selectedSeat = null;
	}
});

// Update title editing
document.getElementById('chart-title').addEventListener('input', () => {
	markUnsavedChanges();
});
