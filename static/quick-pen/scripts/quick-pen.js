let sprints = [];
let sprintId = 0;

// Load sprints from server
async function loadSprints() {
  try {
    const response = await fetch('/api/quick-pen/sprints');
    if (!response.ok) throw new Error('Failed to load sprints');
    
    sprints = await response.json();
    sprintId = Math.max(...sprints.map(s => s.id), 0);
    sprints.forEach(sprint => updateProgressBoard(sprint));
  } catch (error) {
    console.error('Error loading sprints:', error);
  }
}

async function startSprint() {
  console.log('Starting new sprint...');
  try {
    sprintId++;
    console.log(`Sprint ${sprintId} started`);
    document.getElementById('sprintResult').style.display = 'block';
    return sprintId;
  } catch (error) {
    console.error('Error starting sprint:', error);
    alert('Failed to start sprint');
  }
}

async function endSprint() {
  console.log('Ending sprint...');
  const wordCount = parseInt(document.getElementById('wordCount').value);
  const durationStr = document.getElementById('duration').value;

  try {
    const [minutes, seconds] = durationStr.split(':').map(Number);
    const durationMinutes = minutes + (seconds / 60);
    const wpm = wordCount / durationMinutes;

    const newSprint = {
      id: sprintId,
      timestamp: new Date().toISOString(),
      wordCount: wordCount,
      wpm: wpm,
      duration: durationStr
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
    updateProgressBoard(newSprint);
    
    // Reset form
    document.getElementById('wordCount').value = '';
    document.getElementById('sprintResult').style.display = 'none';
  } catch (error) {
    console.error('Error ending sprint:', error);
    alert('Failed to end sprint: ' + error.message);
  }
}

function updateProgressBoard(sprintData) {
  console.log('Updating progress board with sprint:', sprintData);
  const progressBoard = document.getElementById('progressBoard');
  const entry = document.createElement('div');
  entry.innerHTML = `
        <p>Words: ${sprintData.wordCount}</p>
        <p>WPM: ${sprintData.wpm.toFixed(2)}</p>
        <p>Duration: ${sprintData.duration}</p>
        <p>Time: ${new Date(sprintData.timestamp).toLocaleString()}</p>
        <hr>
    `;
  progressBoard.prepend(entry);
  console.log('Progress board updated');
}

// Helper functions for querying
function getHighScores(limit = 10) {
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded, loading sprints...');
  loadSprints();
}); 