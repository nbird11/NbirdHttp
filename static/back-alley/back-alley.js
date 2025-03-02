// Game state
let players = [];
let rounds = [];
const TOTAL_ROUNDS = 13;

// DOM References
let scoreTable, headerRow, scoreBody, totalRow, playerNameInput;

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  scoreTable = document.getElementById('score-table');
  headerRow = document.getElementById('header-row');
  scoreBody = document.getElementById('score-body');
  totalRow = document.getElementById('total-row');
  playerNameInput = document.getElementById('player-name');
  
  // Add event listeners
  document.getElementById('add-player').addEventListener('click', addPlayer);
  document.getElementById('reset-game').addEventListener('click', resetGame);
  
  // Initialize the game
  initializeGame();
});

// Initialize the game
function initializeGame() {
  // Initialize rounds structure
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    rounds.push({
      cards: TOTAL_ROUNDS - i,
      players: {},
      trump: ''
    });
  }
  
  // Create all round rows
  createRoundRows();
}

// Create all round rows at once
function createRoundRows() {
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const row = document.createElement('tr');
    row.id = `round-${i}`;
    
    // Add round label - use card count as round name
    const roundCell = document.createElement('td');
    roundCell.className = 'round-label';
    
    // Create round label with card count
    const roundLabel = document.createElement('div');
    roundLabel.textContent = TOTAL_ROUNDS - i;
    roundCell.appendChild(roundLabel);
    
    // Create trump suit selector
    const trumpSelector = document.createElement('select');
    trumpSelector.className = 'trump-selector';
    trumpSelector.setAttribute('data-round', i);
    trumpSelector.addEventListener('change', updateTrump);
    
    // Add suit options with just symbols
    const options = [
      { value: '', text: '?' },
      { value: 'spades', text: '♠' },
      { value: 'hearts', text: '♥' },
      { value: 'clubs', text: '♣' },
      { value: 'diamonds', text: '♦' },
      { value: 'nt', text: '🃏' }  // No Trump/Joker
    ];
    
    options.forEach(option => {
      const optElement = document.createElement('option');
      optElement.value = option.value;
      optElement.textContent = option.text;
      trumpSelector.appendChild(optElement);
    });
    
    roundCell.appendChild(trumpSelector);
    row.appendChild(roundCell);
    
    // Add empty cells for future players
    for (let j = 0; j < players.length; j++) {
      addPlayerCellToRow(row, j, i);
    }
    
    scoreBody.appendChild(row);
  }
}

// Update trump suit for a round
function updateTrump(event) {
  const select = event.target;
  const roundIndex = parseInt(select.getAttribute('data-round'));
  const trump = select.value;
  
  // Store trump in the rounds data structure
  rounds[roundIndex].trump = trump;
  
  // Update the selector color based on suit
  select.className = 'trump-selector'; // Reset class
  if (trump === 'hearts' || trump === 'diamonds') {
    select.classList.add('red-suit');
  } else if (trump === 'spades' || trump === 'clubs') {
    select.classList.add('black-suit');
  } else if (trump === 'nt') {
    select.classList.add('blue-suit');
  }
}

// Add a player
function addPlayer() {
  const playerName = playerNameInput.value.trim();
  if (!playerName) {
    alert('Please enter a player name');
    return;
  }
  
  players.push(playerName);
  const playerIndex = players.length - 1;
  
  // Add player column header
  const playerTh = document.createElement('th');
  playerTh.textContent = playerName;
  headerRow.appendChild(playerTh);
  
  // Add player cell to total row
  const totalCell = document.createElement('td');
  totalCell.setAttribute('data-player', playerIndex);
  totalCell.textContent = '0';
  totalRow.appendChild(totalCell);
  
  // Add player cells to all existing round rows
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const row = document.getElementById(`round-${i}`);
    addPlayerCellToRow(row, playerIndex, i);
  }
  
  // Clear the input field after adding the player
  playerNameInput.value = '';
}

// Add player cell to a row
function addPlayerCellToRow(row, playerIndex, roundIndex) {
  const cell = document.createElement('td');
  cell.className = 'player-cell';
  
  // Create a container for the two inputs and score
  const playerScore = document.createElement('div');
  playerScore.className = 'player-score';
  
  // Create bid input
  const bidDiv = document.createElement('div');
  bidDiv.className = 'bid-row';
  bidDiv.textContent = 'Bid:';
  
  // Changed from number to text input to allow "B" for board
  const bidInput = document.createElement('input');
  bidInput.type = 'text'; 
  bidInput.className = 'score-input';
  bidInput.setAttribute('data-round', roundIndex);
  bidInput.setAttribute('data-player', playerIndex);
  bidInput.setAttribute('data-type', 'bid');
  bidInput.setAttribute('maxlength', '1'); // Allow only a single character
  bidInput.addEventListener('change', updateBid);
  bidDiv.appendChild(bidInput);
  
  // Create tricks taken input
  const gotDiv = document.createElement('div');
  gotDiv.className = 'got-row';
  gotDiv.textContent = 'Got:';
  const gotInput = document.createElement('input');
  gotInput.type = 'number';
  gotInput.min = '0';
  gotInput.max = rounds[roundIndex].cards;
  gotInput.className = 'score-input';
  gotInput.setAttribute('data-round', roundIndex);
  gotInput.setAttribute('data-player', playerIndex);
  gotInput.setAttribute('data-type', 'got');
  gotInput.addEventListener('change', updateGot);
  gotDiv.appendChild(gotInput);
  
  // Create score display
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'score-display';
  scoreDiv.id = `score-${roundIndex}-${playerIndex}`;
  
  // Add all elements to the container
  playerScore.appendChild(bidDiv);
  playerScore.appendChild(gotDiv);
  playerScore.appendChild(scoreDiv);
  cell.appendChild(playerScore);
  row.appendChild(cell);
}

// Update a bid
function updateBid(event) {
  const input = event.target;
  const playerIndex = parseInt(input.getAttribute('data-player'));
  const roundIndex = parseInt(input.getAttribute('data-round'));
  const bidValue = input.value.trim().toUpperCase();
  
  // Store bid in the rounds data structure
  if (!rounds[roundIndex].players[playerIndex]) {
    rounds[roundIndex].players[playerIndex] = {};
  }
  
  // Handle numeric bids or "B" for board
  if (bidValue === 'B') {
    rounds[roundIndex].players[playerIndex].bid = 'B';
  } else {
    const bid = parseInt(bidValue) || 0;
    rounds[roundIndex].players[playerIndex].bid = bid;
  }
  
  // Update score if both bid and got values exist
  if (rounds[roundIndex].players[playerIndex].got !== undefined) {
    calculateRoundScore(roundIndex, playerIndex);
  }
}

// Update tricks taken
function updateGot(event) {
  const input = event.target;
  const playerIndex = parseInt(input.getAttribute('data-player'));
  const roundIndex = parseInt(input.getAttribute('data-round'));
  const got = parseInt(input.value) || 0;
  
  // Store got in the rounds data structure
  if (!rounds[roundIndex].players[playerIndex]) {
    rounds[roundIndex].players[playerIndex] = {};
  }
  rounds[roundIndex].players[playerIndex].got = got;
  
  // Update score if both bid and got values exist
  if (rounds[roundIndex].players[playerIndex].bid !== undefined) {
    calculateRoundScore(roundIndex, playerIndex);
  }
}

// Calculate score for a player in a round
function calculateRoundScore(roundIndex, playerIndex) {
  const playerRound = rounds[roundIndex].players[playerIndex];
  const bid = playerRound.bid;
  const got = playerRound.got;
  let score = 0;
  let displayClass = '';
  
  // Handle "board" bid (B)
  if (bid === 'B') {
    // Board bid - all tricks or nothing
    if (got === rounds[roundIndex].cards) {
      // Made board: 10 points per trick
      score = got * 10;
      displayClass = 'made board';
    } else {
      // Missed board: -10 points per trick
      score = -(rounds[roundIndex].cards * 10);
      displayClass = 'set board';
    }
  } else {
    // Regular bid
    if (got >= bid) {
      // Made bid: 3 points per bid + 1 point per extra trick
      score = (bid * 3) + (got - bid);
      displayClass = 'made';
    } else {
      // Set: -3 points per bid
      score = -(bid * 3);
      displayClass = 'set';
    }
  }
  
  // Store the score
  playerRound.score = score;
  
  // Update score display
  const scoreDisplay = document.getElementById(`score-${roundIndex}-${playerIndex}`);
  scoreDisplay.textContent = score;
  scoreDisplay.className = 'score-display ' + displayClass;
  
  // Update totals
  updateTotals();
}

// Update totals for all players
function updateTotals() {
  for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
    let total = 0;
    
    // Sum up all round scores for this player
    for (let roundIndex = 0; roundIndex < TOTAL_ROUNDS; roundIndex++) {
      if (rounds[roundIndex].players[playerIndex] && 
          rounds[roundIndex].players[playerIndex].score !== undefined) {
        total += rounds[roundIndex].players[playerIndex].score;
      }
    }
    
    // Update total display
    const totalCell = totalRow.querySelector(`td[data-player="${playerIndex}"]`);
    totalCell.textContent = total;
  }
}

// Reset the game
function resetGame() {
  if (confirm('Are you sure you want to reset the game? All scores will be lost.')) {
    // Reset data structures
    players = [];
    rounds = [];
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      rounds.push({
        cards: TOTAL_ROUNDS - i,
        players: {},
        trump: ''
      });
    }
    
    // Clear the table
    while (scoreBody.firstChild) {
      scoreBody.removeChild(scoreBody.firstChild);
    }
    
    // Remove player headers
    while (headerRow.children.length > 1) {
      headerRow.removeChild(headerRow.lastChild);
    }
    
    // Reset total row
    while (totalRow.children.length > 1) {
      totalRow.removeChild(totalRow.lastChild);
    }
    
    // Recreate round rows
    createRoundRows();
  }
} 