import { getLoggedInUser } from '/scripts/auth.js';

/**
 * @typedef {Object} Sprint
 * @property {number} id
 * @property {string} timestamp
 * @property {number} wordCount
 * @property {number} wpm
 * @property {string} duration
 * @property {string} content
 * @property {string[]} tags
 */

/** @type {Sprint[]} */
let sprints = [];
let sprintId = 0;

// Load sprints from server
async function loadSprints() {
  try {
    const response = await fetch('/api/quick-pen/sprints', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getLoggedInUser()}`
      }
    });
    if (!response.ok) throw new Error('Failed to load sprints');

    sprints = await response.json() || [];
    sprintId = sprints.reduce((maxId, sprint) => Math.max(maxId, sprint.id), 0);
    console.log('sprints', sprints);
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
    this.currentSprintId = null;
    this.sprints = [];
    this.sprintId = 0;

    this.setupEventListeners();
    this.setupTagsEditor();
    this.loadSprints();
  }

  setupEventListeners() {
    // Timer setup elements
    this.timerSetup = document.getElementById('timerSetup');
    /** @type {HTMLInputElement} */
    this.durationInput = document.getElementById('duration');
    this.startButton = document.getElementById('startButton');

    // Active sprint elements
    this.activeSprint = document.getElementById('activeSprint');
    this.timeRemainingDisplay = document.getElementById('timeRemaining');
    this.progressFill = document.getElementById('progressFill');
    this.pauseButton = document.getElementById('pauseButton');
    this.discardButton = document.getElementById('discardButton');
    this.endButton = document.getElementById('endButton');
    this.sprintText = document.getElementById('sprintText');
    this.wordCountDisplay = document.getElementById('wordCount');

    // Bind event listeners
    this.startButton.addEventListener('click', () => this.startSprint());
    this.pauseButton.addEventListener('click', () => this.togglePause());
    this.discardButton.addEventListener('click', () => this.discardSprint());
    this.sprintText.addEventListener('input', () => this.updateWordCount());
    this.endButton.addEventListener('click', () => this.endSprint());
  }

  setupTagsEditor() {
    this.tagsList = document.getElementById('tagsList');
    this.newTagInput = document.getElementById('newTag');
    this.addTagButton = document.getElementById('addTagButton');

    this.addTagButton.addEventListener('click', () => this.addTag());
    this.newTagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addTag();
      }
    });
  }

  async addTag() {
    const tag = this.newTagInput.value.trim();
    if (!tag || !this.currentSprintId) return;

    try {
      const currentTags = Array.from(this.tagsList.children)
        .map(tag => tag.dataset.value);

      const newTags = [...new Set([...currentTags, tag])]; // Ensure uniqueness

      await this.updateSprintTags(this.currentSprintId, newTags);
      this.renderTags(newTags);
      this.newTagInput.value = '';
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('Failed to add tag: ' + error.message);
    }
  }

  async removeTag(tagToRemove) {
    if (!this.currentSprintId) return;

    try {
      const newTags = Array.from(this.tagsList.children)
        .map(tag => tag.dataset.value)
        .filter(tag => tag !== tagToRemove);

      await this.updateSprintTags(this.currentSprintId, newTags);
      this.renderTags(newTags);
    } catch (error) {
      console.error('Error removing tag:', error);
      alert('Failed to remove tag: ' + error.message);
    }
  }

  async updateSprintTags(sprintId, tags) {
    const response = await fetch(`/api/quick-pen/sprint/${sprintId}/tags`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getLoggedInUser()}`
      },
      body: JSON.stringify(tags)
    });

    if (!response.ok) throw new Error('Failed to update tags');

    // Update local sprint data after successful PATCH
    const index = this.sprints.findIndex(s => s.id === sprintId);
    if (index !== -1) {
      this.sprints[index].tags = tags;
    }
  }

  renderTags(tags) {
    this.tagsList.innerHTML = '';
    tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.dataset.value = tag;
      tagElement.innerHTML = `
        ${tag}
        <span class="tag-remove" onclick="window.sprintTimer.removeTag('${tag}')">&times;</span>
      `;
      this.tagsList.appendChild(tagElement);
    });
  }

  startSprint() {
    const durationStr = this.durationInput.value;

    if (!this.validateDuration(durationStr)) {
      return;
    }

    // Convert duration to seconds
    /** seconds */
    this.totalDuration = this.durationToSeconds(durationStr);
    /** seconds */
    this.timeRemaining = this.totalDuration;

    // Show active sprint interface
    this.timerSetup.style.display = 'none';
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timeRemainingDisplay.textContent =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

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
        this.endSprint(false);
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

  async endSprint() {
    // If early end, confirm with user
    if (this.timeRemaining > 0) {
      if (this.sprintText.value.trim().length === 0) {
        if (confirm('No content was written. Discard this sprint?')) {
          this.resetInterface();
          return;
        }
      } else if (!confirm('Are you sure you want to end this sprint early?')) {
        return;
      }
    }

    // Calculate time spent and WPM
    const timeSpent = this.totalDuration - this.timeRemaining;
    const timeSpentMinutes = timeSpent / 60;

    clearInterval(this.timerInterval);
    this.sprintText.disabled = true;

    const wordCount = this.countWords(this.sprintText.value);
    const durationMinutes = timeSpent / 60;
    console.assert(durationMinutes > 0, 'Duration should be guaranteed to be greater than 0 in duration input validation.');
    const wpm = wordCount / durationMinutes;

    // Format duration
    let duration;
    if (this.timeRemaining > 0) {
      const minutes = Math.floor(timeSpent / 60);
      const seconds = timeSpent % 60;
      duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      if (this.durationInput.value.includes(':')) {
        const [minutes, seconds] = this.durationInput.value.split(':');
        duration = `${parseInt(minutes)}:${seconds}`;
      } else {
        duration = `${parseInt(this.durationInput.value)}:00`;
      }
    }

    const sprintData = {
      id: ++this.sprintId,
      timestamp: new Date().toISOString(),
      wordCount: wordCount,
      wpm: wpm,
      duration: duration,
      content: this.sprintText.value,
      tags: []
    };

    try {
      const response = await fetch('/api/quick-pen/sprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLoggedInUser()}`
        },
        body: JSON.stringify(sprintData),
      });

      if (!response.ok) throw new Error('Failed to save sprint');

      this.sprints.push(sprintData);
      this.addToHistory(sprintData);
      this.resetInterface();
    } catch (error) {
      this.sprintId--;
      console.error('Error saving sprint:', error);
      alert('Failed to save sprint: ' + error.message);
    }
  }

  async loadSprintContent(id) {
    const response = await fetch(`/api/quick-pen/sprint/${id}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getLoggedInUser()}`
      }
    });
    if (!response.ok) throw new Error('Failed to load sprint content');
    return await response.text();
  }

  resetInterface() {
    clearInterval(this.timerInterval);
    this.timeRemainingDisplay.textContent = '00:00';
    this.progressFill.style.width = '0%';
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

    input.addEventListener('input', function () {
      errorElement.remove();
      input.classList.remove('error');
    }, { once: true });
  }

  async loadSprints() {
    try {
      const response = await fetch('/api/quick-pen/sprints', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getLoggedInUser()}`
        }
      });
      if (!response.ok) throw new Error('Failed to load sprints');

      this.sprints = await response.json() || [];
      this.sprintId = this.sprints.reduce((maxId, sprint) => Math.max(maxId, sprint.id), 0);
      console.log('sprints', this.sprints);
      this.sprints.forEach(sprint => this.addToHistory(sprint));
    } catch (error) {
      console.error('Error loading sprints:', error);
    }
  }

  addToHistory(sprintData) {
    console.log('Updating progress board with sprint:', sprintData);
    const history = document.getElementById('history');
    const entry = document.createElement('div');
    const time = new Date(sprintData.timestamp).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    entry.innerHTML = `
      <p>Time: ${time}</p>
      <p>Words: ${sprintData.wordCount}</p>
      <p>WPM: ${sprintData.wpm.toFixed(2)}</p>
      <p>Duration: ${sprintData.duration}</p>
      <hr>
    `;
    history.prepend(entry);
    entry.addEventListener('click', () => this.showSprintContent(sprintData));
  }

  async showSprintContent(sprintData) {
    const contentViewer = document.getElementById('contentViewer');
    this.currentSprintId = sprintData.id;

    try {
      const response = await fetch(`/api/quick-pen/sprint/${sprintData.id}/content`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getLoggedInUser()}`
        }
      });
      if (!response.ok) throw new Error('Failed to load sprint content');
      const content = await response.text();
      contentViewer.value = content;

      // Use the updated local sprint data
      const sprint = this.sprints.find(s => s.id === sprintData.id);
      this.renderTags(sprint?.tags || []);
    } catch (error) {
      console.error('Error loading sprint content:', error);
      contentViewer.value = 'Failed to load sprint content: ' + error.message;
    }
  }

  getHighScores(limit = 5) {
    return this.sprints
      .sort((a, b) => b.wpm - a.wpm)
      .slice(0, limit);
  }

  getSprintsByDateRange(startDate, endDate) {
    return this.sprints.filter(sprint => {
      const sprintDate = new Date(sprint.timestamp);
      return sprintDate >= startDate && sprintDate <= endDate;
    });
  }
}

// Simplified initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded, initializing sprint timer...');
  window.sprintTimer = new SprintTimer();
}); 