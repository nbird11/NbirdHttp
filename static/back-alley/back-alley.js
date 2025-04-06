// Game state
let players = [];
let rounds = [];
let frameCount = 1;
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
  document.getElementById('player-name').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      addPlayer();
    }
  });
  document.getElementById('add-player').addEventListener('click', addPlayer);
  document.getElementById('reset-game').addEventListener('click', resetGame);
  document.querySelector('.add-frame-button').addEventListener('click', addFrame);
  
  // Initialize the game
  initializeGame();
});

// Initialize the game
function initializeGame() {
  // Initialize rounds structure for first frame
  initializeFrame(true);
  
  // Create all round rows
  createRoundRows(0, true);
}

// Initialize a new frame
function initializeFrame(isDescending) {
  const startIndex = (frameCount - 1) * TOTAL_ROUNDS;
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const cardCount = isDescending ? TOTAL_ROUNDS - i : i + 1;
    rounds.push({
      cards: cardCount,
      players: {},
      trump: '',
      frameIndex: frameCount - 1
    });
  }
}

// Create round rows for a frame
function createRoundRows(startIndex, isDescending) {
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const row = document.createElement('tr');
    const roundIndex = startIndex + i;
    row.id = `round-${roundIndex}`;
    
    // Add round label - use card count as round name
    const roundCell = document.createElement('td');
    roundCell.className = 'round-label';
    
    // Create round label with card count
    const roundLabel = document.createElement('div');
    roundLabel.textContent = isDescending ? TOTAL_ROUNDS - i : i + 1;
    roundCell.appendChild(roundLabel);
    
    // Create trump suit selector
    const trumpSelector = document.createElement('select');
    trumpSelector.className = 'trump-selector';
    trumpSelector.setAttribute('data-round', roundIndex);
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
      addPlayerCellToRow(row, j, roundIndex);
    }
    
    scoreBody.appendChild(row);
  }

  // Add intermediate total row if this isn't the first frame
  if (startIndex > 0) {
    addIntermediateTotalRow(startIndex - 1);
  }
}

// Add intermediate total row
function addIntermediateTotalRow(lastRoundIndex) {
  const intermediateRow = document.createElement('tr');
  intermediateRow.className = 'intermediate-total-row';
  intermediateRow.id = `intermediate-total-${lastRoundIndex}`;
  
  // Add "Frame Total" label
  const labelCell = document.createElement('td');
  labelCell.textContent = `Frame ${Math.floor(lastRoundIndex / TOTAL_ROUNDS) + 1} Total`;
  intermediateRow.appendChild(labelCell);
  
  // Add total cells for each player
  for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
    const totalCell = document.createElement('td');
    totalCell.setAttribute('data-player', playerIndex);
    totalCell.setAttribute('data-frame', Math.floor(lastRoundIndex / TOTAL_ROUNDS));
    intermediateRow.appendChild(totalCell);
  }
  
  // Insert before the next frame's first row or the final total row
  const nextRow = document.getElementById(`round-${lastRoundIndex + 1}`) || totalRow;
  scoreBody.insertBefore(intermediateRow, nextRow);
  
  // Update the totals
  updateTotals();
}

// Add a new frame
function addFrame() {
  frameCount++;
  const startIndex = (frameCount - 1) * TOTAL_ROUNDS;
  const isDescending = frameCount % 2 !== 0;
  
  // Initialize new frame data
  initializeFrame(isDescending);
  
  // Create new round rows
  createRoundRows(startIndex, isDescending);
  
  // Move total row to the end
  scoreBody.appendChild(totalRow.parentElement.removeChild(totalRow));
  
  // Update all totals
  updateTotals();
}

// Update totals for all players
function updateTotals() {
  // Update intermediate totals
  for (let frame = 0; frame < frameCount; frame++) {
    const frameStartIndex = frame * TOTAL_ROUNDS;
    const frameEndIndex = frameStartIndex + TOTAL_ROUNDS - 1;
    
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
      let frameTotal = 0;
      
      // Sum up all round scores for this player in this frame
      for (let roundIndex = frameStartIndex; roundIndex <= frameEndIndex; roundIndex++) {
        if (rounds[roundIndex]?.players[playerIndex]?.score !== undefined) {
          frameTotal += rounds[roundIndex].players[playerIndex].score;
        }
      }
      
      // Update intermediate total if it exists
      const intermediateRow = document.getElementById(`intermediate-total-${frameEndIndex}`);
      if (intermediateRow) {
        const totalCell = intermediateRow.querySelector(`td[data-player="${playerIndex}"][data-frame="${frame}"]`);
        if (totalCell) {
          totalCell.textContent = frameTotal;
        }
      }
    }
  }
  
  // Update final total
  for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
    let total = 0;
    
    // Sum up all round scores for this player across all frames
    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      if (rounds[roundIndex]?.players[playerIndex]?.score !== undefined) {
        total += rounds[roundIndex].players[playerIndex].score;
      }
    }
    
    // Update total display
    const totalCell = totalRow.querySelector(`td[data-player="${playerIndex}"]`);
    totalCell.textContent = total;
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
  
  // Add player cells to all existing round rows across all frames
  const totalRounds = frameCount * TOTAL_ROUNDS;
  for (let i = 0; i < totalRounds; i++) {
    const row = document.getElementById(`round-${i}`);
    if (row) {
      addPlayerCellToRow(row, playerIndex, i);
    }
  }

  // Add player cell to all intermediate total rows
  for (let frame = 0; frame < frameCount - 1; frame++) {
    const frameEndIndex = (frame + 1) * TOTAL_ROUNDS - 1;
    const intermediateRow = document.getElementById(`intermediate-total-${frameEndIndex}`);
    if (intermediateRow) {
      const totalCell = document.createElement('td');
      totalCell.setAttribute('data-player', playerIndex);
      totalCell.setAttribute('data-frame', frame);
      intermediateRow.appendChild(totalCell);
    }
  }
  
  // Add player cell to final total row
  const totalCell = document.createElement('td');
  totalCell.setAttribute('data-player', playerIndex);
  totalCell.textContent = '0';
  totalRow.appendChild(totalCell);
  
  // Clear the input field after adding the player
  playerNameInput.value = '';
  
  // Update all totals to include the new player
  updateTotals();
}

// Add player cell to a row
function addPlayerCellToRow(row, playerIndex, roundIndex) {
  const cell = document.createElement('td');
  cell.className = 'player-cell';
  
  // Create a container for the inputs and score
  const playerScore = document.createElement('div');
  playerScore.className = 'player-score';
  
  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  
  // Create bid input
  const bidInput = document.createElement('input');
  bidInput.type = 'text';
  bidInput.className = 'score-input';
  bidInput.setAttribute('data-round', roundIndex);
  bidInput.setAttribute('data-player', playerIndex);
  bidInput.setAttribute('data-type', 'bid');
  bidInput.setAttribute('data-tooltip', 'Enter bid');
  bidInput.addEventListener('change', updateBid);
  bidInput.addEventListener('input', handleBidInput);
  
  // Create tricks taken input
  const gotInput = document.createElement('input');
  // gotInput.type = 'number';
  // gotInput.min = '0';
  // gotInput.max = rounds[roundIndex].cards;
  gotInput.className = 'score-input';
  gotInput.setAttribute('data-round', roundIndex);
  gotInput.setAttribute('data-player', playerIndex);
  gotInput.setAttribute('data-type', 'got');
  gotInput.setAttribute('data-tooltip', 'Enter tricks taken');
  gotInput.addEventListener('change', updateGot);
  
  // Create score display
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'score-display';
  scoreDiv.id = `score-${roundIndex}-${playerIndex}`;
  
  // Add inputs to input container
  inputContainer.appendChild(bidInput);
  inputContainer.appendChild(gotInput);
  
  // Add all elements to the player score container
  playerScore.appendChild(inputContainer);
  playerScore.appendChild(scoreDiv);
  cell.appendChild(playerScore);
  row.appendChild(cell);
}

// Handle bid input to adjust width for board bids
function handleBidInput(event) {
  const input = event.target;
  const value = input.value.trim().toUpperCase();
  
  if (value.match(/^B+$/)) {
    input.classList.add('board-bid');
  } else {
    input.classList.remove('board-bid');
  }
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
  
  // Handle board bids (B, BB, BBB, BBBB) or numeric bids
  if (bidValue.match(/^B+$/)) {
    // Store both the fact that it's a board bid and how many B's (multiplier)
    rounds[roundIndex].players[playerIndex].bid = 'B';
    rounds[roundIndex].players[playerIndex].boardMultiplier = bidValue.length;
  } else {
    // Regular numeric bid
    const bid = parseInt(bidValue) || 0;
    rounds[roundIndex].players[playerIndex].bid = bid;
    // Clear any board multiplier
    delete rounds[roundIndex].players[playerIndex].boardMultiplier;
  }
  
  // Update score if both bid and got values exist
  if (rounds[roundIndex].players[playerIndex].got !== undefined) {
    calculateRoundScore(roundIndex, playerIndex);
  }
  
  // If this is a board bid or changed from a board bid, recalculate scores for all players 
  // in this round who have board bids, as the multiplier may have changed
  updateAllBoardScoresInRound(roundIndex);
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
  
  // Count the total board multiplier in this round
  const totalBoardMultiplier = countTotalBoardMultiplier(roundIndex);
  
  // Handle "board" bid (B)
  if (bid === 'B') {
    // Get this player's specific board multiplier (how many B's they entered)
    const playerMultiplier = playerRound.boardMultiplier || 1;
    
    // Base points per trick for a board is 10
    const pointsPerTrick = 10 * playerMultiplier;
    
    // Board bid - all tricks or nothing
    if (got === rounds[roundIndex].cards) {
      // Made board: points per trick × number of tricks
      score = got * pointsPerTrick;
      displayClass = 'made board';
    } else {
      // Missed board: -points per trick × number of tricks
      score = -(rounds[roundIndex].cards * pointsPerTrick);
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
  
  // Add data attribute for board multiplier if this is a board bid
  if (bid === 'B' && playerRound.boardMultiplier > 1) {
    scoreDisplay.setAttribute('data-board-count', playerRound.boardMultiplier);
  } else {
    scoreDisplay.removeAttribute('data-board-count');
  }
  
  // Update totals
  updateTotals();
}

// Count the total board multiplier across all players in a round
function countTotalBoardMultiplier(roundIndex) {
  let total = 0;
  
  // Loop through all players in this round
  for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
    const playerData = rounds[roundIndex].players[playerIndex];
    if (playerData && playerData.bid === 'B') {
      total += playerData.boardMultiplier || 1;
    }
  }
  
  return total;
}

// Count how many players bid "B" in a specific round
function countBoardBidsInRound(roundIndex) {
  let count = 0;
  
  // Loop through all players in this round
  for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
    const playerData = rounds[roundIndex].players[playerIndex];
    if (playerData && playerData.bid === 'B') {
      count++;
    }
  }
  
  return count;
}

// Update scores for all players with board bids in a round
function updateAllBoardScoresInRound(roundIndex) {
  for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
    const playerData = rounds[roundIndex].players[playerIndex];
    if (playerData && playerData.bid === 'B' && playerData.got !== undefined) {
      calculateRoundScore(roundIndex, playerIndex);
    }
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
        trump: '',
        frameIndex: 0
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
    createRoundRows(0, true);
  }
} 