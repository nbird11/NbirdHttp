/**
 * @typedef {Object} Sprint
 * @property {number} id
 * @property {string} timestamp
 * @property {number} wordCount
 * @property {number} wpm
 * @property {string} duration
 * @property {string} content
 * @property {boolean} completed
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

class SprintTimer {
  constructor() {
    this.timeRemaining = 0;
    this.totalDuration = 0;
    this.timerInterval = null;
    this.isPaused = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Timer setup elements
    this.timerSetup = document.getElementById('timerSetup');
    this.durationInput = document.getElementById('duration');
    this.startButton = document.getElementById('startButton');

    // Active sprint elements
    this.activeSprint = document.getElementById('activeSprint');
    this.timeRemainingDisplay = document.getElementById('timeRemaining');
    this.progressFill = document.getElementById('progressFill');
    this.pauseButton = document.getElementById('pauseButton');
    this.discardButton = document.getElementById('discardButton');
    this.sprintText = document.getElementById('sprintText');
    this.wordCountDisplay = document.getElementById('wordCount');

    // Bind event listeners
    this.startButton.addEventListener('click', () => this.startSprint());
    this.pauseButton.addEventListener('click', () => this.togglePause());
    this.discardButton.addEventListener('click', () => this.discardSprint());
    this.sprintText.addEventListener('input', () => this.updateWordCount());
  }

  startSprint() {
    const durationStr = this.durationInput.value;
    
    if (!this.validateDuration(durationStr)) {
      return;
    }

    // Convert duration to seconds
    this.totalDuration = this.durationToSeconds(durationStr);
    this.timeRemaining = this.totalDuration;

    // Show active sprint interface
    this.timerSetup.style.display = 'none';
    this.activeSprint.classList.remove('hidden');
    this.sprintText.disabled = false;
    this.sprintText.focus();

    // Start the timer
    this.startTimer();
  }

  validateDuration(durationStr) {
    if (!durationStr) {
      this.showError('duration', 'Please enter a duration');
      return false;
    }

    const zeroFormat = /^0+(?::0?0?)?$/;
    if (zeroFormat.test(durationStr)) {
      this.showError('duration', 'Please enter a non-zero duration');
      return false;
    }

    const timeFormat = /^\d+(?::[0-5]\d)?$/;
    if (!timeFormat.test(durationStr)) {
      this.showError('duration', 'Please enter time as MM:SS (00-59 seconds) or just minutes');
      return false;
    }

    return true;
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining <= 0) {
        this.completeSprint();
      } else {
        this.timeRemaining--;
        this.updateTimerDisplay();
      }
    }, 1000);
  }

  togglePause() {
    if (this.isPaused) {
      this.startTimer();
      this.sprintText.disabled = false;
      this.pauseButton.textContent = 'Pause';
    } else {
      clearInterval(this.timerInterval);
      this.sprintText.disabled = true;
      this.pauseButton.textContent = 'Resume';
    }
    this.isPaused = !this.isPaused;
  }

  async discardSprint() {
    if (confirm('Are you sure you want to discard this sprint? All progress will be lost.')) {
      this.resetInterface();
    }
  }

  async completeSprint() {
    clearInterval(this.timerInterval);
    this.sprintText.disabled = true;

    const wordCount = this.countWords(this.sprintText.value);
    const durationMinutes = this.totalDuration / 60;
    const wpm = wordCount / durationMinutes;

    const sprintData = {
      id: ++sprintId, // Global variable from previous implementation
      timestamp: new Date().toISOString(),
      wordCount: wordCount,
      wpm: wpm,
      duration: this.durationInput.value,
      content: this.sprintText.value,
      completed: true
    };

    try {
      const response = await fetch('/api/quick-pen/sprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sprintData)
      });

      if (!response.ok) throw new Error('Failed to save sprint');

      sprints.push(sprintData); // Global variable from previous implementation
      addToHistory(sprintData);
      this.resetInterface();
    } catch (error) {
      console.error('Error saving sprint:', error);
      alert('Failed to save sprint: ' + error.message);
    }
  }

  resetInterface() {
    clearInterval(this.timerInterval);
    this.timerSetup.style.display = 'block';
    this.activeSprint.classList.add('hidden');
    this.durationInput.value = '';
    this.sprintText.value = '';
    this.updateWordCount();
    this.isPaused = false;
    this.pauseButton.textContent = 'Pause';
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timeRemainingDisplay.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const progress = (this.timeRemaining / this.totalDuration) * 100;
    this.progressFill.style.width = `calc(100% - ${progress}%)`;
  }

  updateWordCount() {
    const wordCount = this.countWords(this.sprintText.value);
    this.wordCountDisplay.textContent = wordCount;
  }

  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  durationToSeconds(durationStr) {
    if (durationStr.includes(':')) {
      const [minutes, seconds] = durationStr.split(':').map(Number);
      return (minutes * 60) + seconds;
    }
    return parseInt(durationStr) * 60;
  }

  showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorElement = document.createElement('div');
    errorElement.id = inputId + '-error';
    errorElement.className = 'error-message';
    errorElement.textContent = '⚠️ ' + message;
    
    const existingError = document.getElementById(inputId + '-error');
    if (existingError) existingError.remove();
    
    input.parentNode.insertBefore(errorElement, input.nextSibling);
    input.classList.add('error');

    input.addEventListener('input', function() {
      errorElement.remove();
      input.classList.remove('error');
    }, { once: true });
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded, initializing sprint timer...');
  window.sprintTimer = new SprintTimer();
  loadSprints();
});