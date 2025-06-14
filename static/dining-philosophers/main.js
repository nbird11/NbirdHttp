const N = 5; // Number of philosophers
const PHILOSOPHER_COLORS = ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'];
const STOP_EATING_WHEN_FULL = false;
/** @type {HTMLElement} */
const table = document.getElementById('table');
/** @type {Philosopher[]} */
const philosophers = [];
/** @type {Chopstick[]} */
const chopsticks = [];

/** @type {number} */
let hungerIntervalId;
/** @type {Date} */
let startTime;
/** @type {boolean} */
let isSimulationRunning = true;

// --- Visualization ---
function setupTable() {
  for (let i = 0; i < N; i++) {
    // Create philosopher element
    const philosopherEl = document.createElement('div');
    philosopherEl.className = 'philosopher';
    philosopherEl.id = `p-${i}`;
    philosopherEl.textContent = `Phil ${i}`;
    const angle = (i * 360) / N;
    const x = 200 + 160 * Math.cos((angle * Math.PI) / 180) - 40;
    const y = 200 + 160 * Math.sin((angle * Math.PI) / 180) - 40;
    philosopherEl.style.left = `${x}px`;
    philosopherEl.style.top = `${y}px`;

    const hungerContainer = document.createElement('div');
    hungerContainer.className = 'hunger-bar-container';
    const hungerBar = document.createElement('div');
    hungerBar.className = 'hunger-bar';
    hungerContainer.appendChild(hungerBar);
    philosopherEl.appendChild(hungerContainer);

    table.appendChild(philosopherEl);

    // Create chopstick element
    const chopstickEl = document.createElement('div');
    chopstickEl.className = 'chopstick';
    chopstickEl.id = `c-${i}`;
    const chopstickAngle = angle + 360 / (2 * N);
    const cx = 200 + 100 * Math.cos((chopstickAngle * Math.PI) / 180) - 5;
    const cy = 200 + 100 * Math.sin((chopstickAngle * Math.PI) / 180) - 30;
    chopstickEl.style.left = `${cx}px`;
    chopstickEl.style.top = `${cy}px`;
    chopstickEl.style.transform = `rotate(${chopstickAngle + 90}deg)`;
    table.appendChild(chopstickEl);
  }
}

// --- Logic ---
class Chopstick {
  /**
   * @param {number} id
  */
  constructor(id) {
    /** @type {number} */
    this.id = id;
    /** @type {boolean} */
    this.isTaken = false;
    /** @type {HTMLElement} */
    this.element = document.getElementById(`c-${id}`);
    /** @type {string} */
    this.originalLeft = this.element.style.left;
    /** @type {string} */
    this.originalTop = this.element.style.top;
    /** @type {string} */
    this.originalTransform = this.element.style.transform;

    /** @type {RegExpMatchArray} */
    const transformMatch = this.originalTransform.match(/rotate\((.+?)deg\)/);
    /** @type {number} */
    this.originalRotation = transformMatch ? parseFloat(transformMatch[1]) : 0;
    /** @type {number} */
    this.currentRotation = this.originalRotation;
  }

  async take() {
    while (this.isTaken) {
      if (!isSimulationRunning) return false;
      await new Promise(resolve => setTimeout(resolve, 100)); // wait if taken
    }
    if (!isSimulationRunning) return false;
    this.isTaken = true;
    return true;
  }

  release() {
    this.isTaken = false;
    this.element.style.left = this.originalLeft;
    this.element.style.top = this.originalTop;

    const targetRotation = this.originalRotation;
    const newRotation = this.currentRotation + (((targetRotation - this.currentRotation) % 360 + 540) % 360 - 180);
    this.element.style.transform = `rotate(${newRotation}deg)`;
    this.currentRotation = newRotation;

    this.element.style.backgroundColor = '#8B4513';
    this.element.style.zIndex = 0;
  }
}

class Philosopher {
  /**
   * @param {number} id
   * @param {Chopstick} leftChopstick
   * @param {Chopstick} rightChopstick
  */
  constructor(id, leftChopstick, rightChopstick) {
    /** @type {number} */
    this.id = id;
    this.leftChopstick = leftChopstick;
    this.rightChopstick = rightChopstick;
    this.state = 'thinking'; // thinking, hungry, eating
    this.color = PHILOSOPHER_COLORS[id % PHILOSOPHER_COLORS.length];
    this.element = document.getElementById(`p-${this.id}`);
    this.hunger = 100;
    this.hungerBar = this.element.querySelector('.hunger-bar');
    this.updateUI();
  }

  updateUI() {
    this.element.childNodes[0].nodeValue = `Phil ${this.id}`;
    this.element.style.backgroundColor = this.color;
    this.hungerBar.style.width = `${this.hunger}%`;
    if (this.hunger < 20) {
      this.hungerBar.style.backgroundColor = 'red';
    } else if (this.hunger < 50) {
      this.hungerBar.style.backgroundColor = 'yellow';
    } else {
      this.hungerBar.style.backgroundColor = '#4CAF50';
    }
    switch (this.state) {
      case 'thinking':
        this.element.style.border = '2px solid #000';
        break;
      case 'hungry':
        this.element.style.border = '4px solid orange';
        break;
      case 'eating':
        this.element.style.border = '4px solid green';
        break;
    }
  }

  async think() {
    this.state = 'thinking';
    this.updateUI();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
  }

  /** @param {Chopstick} chopstick */
  moveChopstick(chopstick) {
    const pAngle = (this.id * 360) / N;

    // Determine if it's left or right chopstick to adjust position
    const isLeft = chopstick.id === this.leftChopstick.id;

    // Move chopstick closer to philosopher
    const offsetAngle = 360 / (2 * N) / 2; // Move it halfway angularly
    const newAngle = isLeft ? pAngle - offsetAngle : pAngle + offsetAngle;
    const newAngleRad = (newAngle * Math.PI) / 180;

    const newRadius = 130;
    const cx = 200 + newRadius * Math.cos(newAngleRad) - 5;
    const cy = 200 + newRadius * Math.sin(newAngleRad) - 30;

    chopstick.element.style.left = `${cx}px`;
    chopstick.element.style.top = `${cy}px`;

    const targetRotation = newAngle + 90;
    const newRotation = chopstick.currentRotation + (((targetRotation - chopstick.currentRotation) % 360 + 540) % 360 - 180);
    chopstick.element.style.transform = `rotate(${newRotation}deg)`;
    chopstick.currentRotation = newRotation;

    chopstick.element.style.zIndex = 1; // Bring to front
    // chopstick.element.style.backgroundColor = this.color;
  }

  async eat() {
    this.state = 'hungry';
    this.updateUI();

    // Deadlock prevention: always take the lower-id chopstick first
    const firstChopstick = this.leftChopstick.id < this.rightChopstick.id ? this.leftChopstick : this.rightChopstick;
    const secondChopstick = this.leftChopstick.id < this.rightChopstick.id ? this.rightChopstick : this.leftChopstick;

    if (!await firstChopstick.take()) return;
    this.moveChopstick(firstChopstick);

    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay to see one chopstick picked up

    if (!await secondChopstick.take()) {
      firstChopstick.release(); // release first if can't get second
      return;
    }
    this.moveChopstick(secondChopstick);

    this.state = 'eating';
    this.updateUI();

    // Eat until full or a max time has passed
    // const maxEatingTime = new Date().getTime() + Math.random() * 3000 + 1000;
    // while (new Date().getTime() < maxEatingTime && this.hunger < 100 && isSimulationRunning) {
    //   await new Promise(resolve => setTimeout(resolve, 100));
    // }
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));

    firstChopstick.release();
    secondChopstick.release();
  }

  async run() {
    while (isSimulationRunning) {
      await this.think();
      await this.eat();
    }
  }
}

// --- Initialization ---
function main() {
  startTime = new Date();
  setupTable();

  for (let i = 0; i < N; i++) {
    chopsticks.push(new Chopstick(i));
  }

  for (let i = 0; i < N; i++) {
    const leftChopstick = chopsticks[(i + N - 1) % N];
    const rightChopstick = chopsticks[i];
    philosophers.push(new Philosopher(i, leftChopstick, rightChopstick));
  }

  philosophers.forEach(p => p.run());

  const hungerIntervalId = setInterval(() => {
    let starvedPhilosopher = null;
    philosophers.forEach(p => {
      if (p.state === 'eating') {
        p.hunger = Math.min(100, p.hunger + 2);
      } else {
        p.hunger = Math.max(0, p.hunger - .8);
        if (p.hunger <= 0) {
          starvedPhilosopher = p;
        }
      }
      p.updateUI();
    });

    if (starvedPhilosopher) {
      isSimulationRunning = false;
      clearInterval(hungerIntervalId);

      const elapsedTime = new Date() - startTime;
      const elapsedSeconds = (elapsedTime / 1000).toFixed(2);

      const gameOverEl = document.createElement('div');
      gameOverEl.id = 'game-over';
      gameOverEl.innerHTML = `Game Over.<br>Philosopher ${starvedPhilosopher.id} has starved!<br>Survived for ${elapsedSeconds} seconds.`;

      const resetBtn = document.createElement('button');
      resetBtn.id = 'reset-btn';
      resetBtn.textContent = 'Reset';
      resetBtn.addEventListener('click', resetSimulation);

      gameOverEl.appendChild(document.createElement("br"))
      gameOverEl.appendChild(resetBtn);
      table.appendChild(gameOverEl);
    }
  }, 100);
}

function resetSimulation() {
  isSimulationRunning = true;
  philosophers.length = 0;
  chopsticks.length = 0;
  table.innerHTML = '';
  if (hungerIntervalId) {
    clearInterval(hungerIntervalId);
  }

  main();
}

document.addEventListener('DOMContentLoaded', main);
