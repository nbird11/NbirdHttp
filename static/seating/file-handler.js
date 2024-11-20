/** @type {FileSystemFileHandle | null} */
let currentFileHandle = null;

/**
 * @param {Event} e The event object.
 */
async function saveChart(e) {
  e.preventDefault();

  try {
    const chartData = {
      title: document.getElementById('chart-title').textContent,
      seats: seatingChart.map(seat => ({
        x: parseInt(seat.style.left),
        y: parseInt(seat.style.top),
        label: seat.querySelector('span').textContent
      }))
    };

    const jsonString = JSON.stringify(chartData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    /** @type {FileSystemWritableFileStream} */
    let writable;
    if (currentFileHandle) {
      writable = await currentFileHandle.createWritable();
    } else {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${chartData.title}.seat`,
        types: [{
          description: 'Seating Chart',
          accept: {
            'application/json': ['.seat']
          }
        }],
      });
      currentFileHandle = handle;
      writable = await handle.createWritable();
    }

    try {
      await writable.write(blob);
      await writable.close();
      clearUnsavedChanges();
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      if (writable) {
        try {
          await writable.abort();
        } catch (abortError) {
          console.error('Error aborting write:', abortError);
        }
      }
      throw writeError;
    }

  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Failed to save chart:', err);
      alert('Failed to save the chart. Please try again later.', err);
    }
  }
}

async function loadChart() {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Are you sure you want to load a different chart?')) {
      return;
    }
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'Seating Chart',
        accept: {
          'application/json': ['.seat']
        }
      }],
      multiple: false
    });

    const file = await handle.getFile();
    const contents = await file.text();
    const chartData = JSON.parse(contents);

    // Only clear the chart and set the new file handle if we successfully loaded the file
    currentFileHandle = handle;
    seatingChart.forEach(seat => seat.remove());
    seatingChart = [];
    selectedSeat = null;

    document.getElementById('chart-title').textContent = chartData.title;

    chartData.seats.forEach(seatData => {
      const seat = createSeat(seatData.x, seatData.y, seatData.label);
      seatingChart.push(seat);
      chartContainer.appendChild(seat);
    });

    updateGroups();
    clearUnsavedChanges();

  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Failed to load chart:', err);
      alert('Failed to load the chart. Please try again.');
    }
  }
}

async function saveChartAs(e) {
  currentFileHandle = null;
  await saveChart(e);
}

// Add this to the newChart function in seating.js
function newChart() {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Are you sure you want to create a new chart?')) {
      return;
    }
  }
  currentFileHandle = null;  // Clear the file handle when creating a new chart
  seatingChart.forEach(seat => seat.remove());
  seatingChart = [];
  selectedSeat = null;
  document.getElementById('chart-title').textContent = 'Untitled Seating Chart';
  clearUnsavedChanges();
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    if (e.shiftKey) {
      // Ctrl+Shift+s
      e.preventDefault();
      saveChartAs(e);
    } else {
      // Ctrl+s
      e.preventDefault();
      saveChart(e);
    }
  }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
    // Ctrl+o
    e.preventDefault();
    loadChart(e);
  }
});
