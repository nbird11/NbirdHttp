/**
 * @typedef {Object} Sprint
 * @property {number} id
 * @property {string} timestamp
 * @property {number} wordCount
 * @property {number} wpm
 * @property {string} duration
 */

/** @type {Sprint[]} */
let sprints = [];
let sprintId = 0;

// Load sprints from server
async function loadSprints() {
  try {
    const response = await fetch('/api/quick-pen/sprints');
    if (!response.ok) throw new Error('Failed to load sprints');
    
    sprints = await response.json() || [];
    sprintId = sprints.reduce((maxId, sprint) => Math.max(maxId, sprint.id), 0);
    sprints.forEach(sprint => addToHistory(sprint));
  } catch (error) {
    console.error('Error loading sprints:', error);
  }
}

async function startSprint() {
  console.log('Starting new sprint...');
  const durationStr = document.getElementById('duration').value;
  const errorElement = document.getElementById('duration-error');
  
  // Clear any existing error
  if (errorElement) {
    errorElement.remove();
  }
  
  if (!durationStr) {
    showError('duration', 'Please enter a duration');
    return;
  }

  const zeroFormat = /^0+(?::0?0?)?$/;

  if (zeroFormat.test(durationStr)) {
    showError('duration', 'Please enter a non-zero duration');
    return;
  }

  // Check if input is valid format (either MM:SS or just minutes)
  const timeFormat = /^\d+(?::[0-5]\d)?$/;
  if (!timeFormat.test(durationStr)) {
    showError('duration', 'Please enter time as MM:SS (00-59 seconds) or just minutes');
    return;
  }

  try {
    sprintId++;
    console.log(`Sprint ${sprintId} started`);
    document.querySelector('.end-sprint').classList.add('active');
    return sprintId;
  } catch (error) {
    console.error('Error starting sprint:', error);
    showError('duration', 'Failed to start sprint');
  }
}

async function endSprint() {
  console.log('Ending sprint...');
  const wordCount = parseInt(document.getElementById('wordCount').value);
  /** @type {string} */
  const durationStr = document.getElementById('duration').value;

  try {
    let durationMinutes;
    if (durationStr.includes(':')) {
      const [minutes, seconds] = durationStr.split(':').map(Number);
      durationMinutes = minutes + (seconds / 60);
    } else {
      durationMinutes = parseInt(durationStr);
    }

    const wpm = wordCount / durationMinutes;

    const newSprint = {
      id: sprintId,
      timestamp: new Date().toISOString(),
      wordCount: wordCount,
      wpm: wpm,
      duration: durationStr.includes(':') ? durationStr : durationStr + ':00'
    };

    // Save to server
    const response = await fetch('/api/quick-pen/sprint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newSprint)
    });

    if (!response.ok) throw new Error('Failed to save sprint');

    // Update local state
    sprints.push(newSprint);
    addToHistory(newSprint);
    
    // Reset form
    document.getElementById('wordCount').value = '';
    document.querySelector('.end-sprint').classList.remove('active');
  } catch (error) {
    console.error('Error ending sprint:', error);
    alert('Failed to end sprint: ' + error.message);
  }
}

function addToHistory(sprintData) {
  console.log('Updating progress board with sprint:', sprintData);
  const history = document.getElementById('history');
  const entry = document.createElement('div');
  entry.innerHTML = `
        <p>Words: ${sprintData.wordCount}</p>
        <p>WPM: ${sprintData.wpm.toFixed(2)}</p>
        <p>Duration: ${sprintData.duration}</p>
        <p>Time: ${new Date(sprintData.timestamp).toLocaleString()}</p>
        <hr>
    `;
  history.prepend(entry);
  console.log('Progress board updated');
}

// Helper functions for querying
function getHighScores(limit = 5) {
  return sprints
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, limit);
}

function getSprintsByDateRange(startDate, endDate) {
  return sprints.filter(sprint => {
    const sprintDate = new Date(sprint.timestamp);
    return sprintDate >= startDate && sprintDate <= endDate;
  });
}

function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorElement = document.createElement('div');
  errorElement.id = inputId + '-error';
  errorElement.className = 'error-message';
  errorElement.textContent = '⚠️ ' + message;
  
  // For duration input, place error after the button
  if (inputId === 'duration') {
    const button = input.parentNode.querySelector('button');
    button.parentNode.insertBefore(errorElement, button.nextSibling);
  } else {
    input.parentNode.insertBefore(errorElement, input.nextSibling);
  }
  
  input.classList.add('error');

  // Remove error state after user starts typing
  input.addEventListener('input', function() {
    errorElement.remove();
    input.classList.remove('error');
  }, { once: true });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded, loading sprints...');
  loadSprints();
}); 