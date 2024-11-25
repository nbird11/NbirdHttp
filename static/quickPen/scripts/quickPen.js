// State management (replacing Go's global variables)
let sprints = [];
let sprintId = 0;

// Load sprints from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedSprints = localStorage.getItem('sprints');
  if (savedSprints) {
    sprints = JSON.parse(savedSprints);
    // Update sprintId to be the highest ID + 1
    sprintId = Math.max(...sprints.map(s => s.id), 0) + 1;
    // Display existing sprints
    sprints.forEach(sprint => updateProgressBoard(sprint));
    }
});

async function startSprint() {
  try {
    sprintId++;
    document.getElementById('sprintResult').style.display = 'block';
    return sprintId;
  } catch (error) {
    console.error('Error starting sprint:', error);
    alert('Failed to start sprint');
  }
}

async function endSprint() {
  const wordCount = parseInt(document.getElementById('wordCount').value);
  const durationStr = document.getElementById('duration').value;

  try {
    // Parse duration string (e.g., "10:00") into minutes
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

    // Add to sprints array and save to localStorage
    sprints.push(newSprint);
    localStorage.setItem('sprints', JSON.stringify(sprints));

    // Update UI
    updateProgressBoard(newSprint);

    // Reset form
    document.getElementById('wordCount').value = '';
    document.getElementById('sprintResult').style.display = 'none';
  } catch (error) {
    console.error('Error ending sprint:', error);
    alert('Failed to end sprint');
  }
}

function updateProgressBoard(sprintData) {
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
}

// Helper function to get all sprints (replacing Go's getSprints handler)
function getAllSprints() {
  return sprints;
} 