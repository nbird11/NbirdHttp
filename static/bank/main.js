document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    setup: document.getElementById('setup'),
    round: document.getElementById('round'),
    startGameBtn: document.getElementById('startGameBtn'),
    addPlayerName: document.getElementById('addPlayerName'),
    addPlayerBtn: document.getElementById('addPlayerBtn'),
    playerList: document.getElementById('playerList'),
    roundChips: document.getElementById('roundChips'),
    totalRoundsMeta: document.getElementById('totalRoundsMeta'),
    players: document.getElementById('players'),
    pot: document.getElementById('pot'),
    sumPanel: document.getElementById('sumPanel'),
    newGameBtn: document.getElementById('newGameBtn'),
    roundNumber: document.getElementById('roundNumber'),
  };

  const state = {
    players: [],
    scores: [],
    activePlayerIndices: [],
    currentActiveIndex: 0,
    sharedPot: 0,
    rollCount: 0,
    isRoundActive: false,
    roundNumber: 1,
    totalRounds: 15,
    winnerIndices: [],
    lastTurnPlayerIndex: 0,
    nextStartingPlayerIndex: 0,
  };

  function saveState() {
    localStorage.setItem('bankGameState', JSON.stringify(state));
  }

  function loadState() {
    const raw = localStorage.getItem('bankGameState');
    if (!raw) return false;
    try {
      const saved = JSON.parse(raw);
      Object.assign(state, saved);
      return true;
    } catch { return false; }
  }

  function resetRoundState() {
    state.sharedPot = 0;
    state.rollCount = 0;
    // start from the nextStartingPlayerIndex (carry-over between rounds)
    const startIdx = Number.isInteger(state.nextStartingPlayerIndex) ? state.nextStartingPlayerIndex : 0;
    state.currentActiveIndex = Math.max(0, Math.min(startIdx, Math.max(0, state.players.length - 1)));
    state.activePlayerIndices = state.players.map((_, i) => i);
    state.isRoundActive = true;
    state.winnerIndices = [];
  }

  function setButtonsEnabled(isTurnActive) {
    const buttons = elements.sumPanel.querySelectorAll('.sumBtn, .doubleBtn');
    if (!isTurnActive) {
      buttons.forEach(btn => { btn.disabled = true; });
    } else {
      // When enabling for a turn, re-apply round constraints (Double disabled for first 3 rolls, etc.)
      updatePanelState();
    }
  }

  function renderPlayers() {
    elements.players.innerHTML = '';
    const activeIndex = state.activePlayerIndices[state.currentActiveIndex];
    state.players.forEach((name, idx) => {
      const card = document.createElement('div');
      card.className = 'playerCard' + (idx === activeIndex && state.isRoundActive ? ' active' : '');
      const title = document.createElement('div');
      title.className = 'playerName';
      title.textContent = name;
      const score = document.createElement('div');
      score.className = 'scoreBadge';
      score.textContent = state.scores[idx];
      const bankBtn = document.createElement('button');
      bankBtn.className = 'btn ghost bankBtn';
      bankBtn.textContent = 'Bank';
      bankBtn.style.padding = '0.35rem 0.6rem';
      bankBtn.style.fontSize = '0.9rem';
      const isActiveThisRound = state.activePlayerIndices.includes(idx);
      bankBtn.disabled = !state.isRoundActive || !isActiveThisRound;
      bankBtn.addEventListener('click', () => bankPlayer(idx));
      card.appendChild(title);
      card.appendChild(score);
      card.appendChild(bankBtn);
      elements.players.appendChild(card);
    });
  }

  function renderMeta() {
    elements.pot.textContent = state.sharedPot;
    elements.roundNumber.textContent = state.roundNumber;
    elements.totalRoundsMeta.textContent = state.totalRounds;
  }

  // log removed per spec

  function updatePanelState() {
    const afterThree = state.rollCount >= 3;
    const active = state.isRoundActive;
    const buttons = elements.sumPanel.querySelectorAll('.sumBtn');
    buttons.forEach(btn => {
      const value = parseInt(btn.dataset.sum, 10);
      let disabled = !active;
      if (!disabled) {
        if (afterThree && (value === 2 || value === 12)) disabled = true;
      }
      btn.disabled = disabled;
      // 7 danger only after third roll
      if (value === 7) {
        if (afterThree) btn.classList.add('danger'); else btn.classList.remove('danger');
      }
    });
    const doubleBtn = elements.sumPanel.querySelector('.doubleBtn');
    if (doubleBtn) doubleBtn.disabled = !active || !afterThree;
  }

  function renderPanel() {
    elements.sumPanel.innerHTML = '';
    const rows = [
      [2, 3, 4],
      [5, 6, 7],
      [8, 9, 10],
      [11, 12, 'dbl'],
    ];
    rows.flat().forEach(cell => {
      if (cell === 'dbl') {
        const dbl = document.createElement('button');
        dbl.className = 'doubleBtn';
        dbl.type = 'button';
        dbl.textContent = 'Double';
        dbl.addEventListener('click', () => applyRoll({ sum: 0, isDouble: true }));
        elements.sumPanel.appendChild(dbl);
      } else {
        const s = cell;
        const btn = document.createElement('button');
        btn.className = 'sumBtn';
        btn.type = 'button';
        btn.dataset.sum = String(s);
        btn.textContent = String(s);
        btn.addEventListener('click', () => applyRoll({ sum: s, isDouble: false }));
        elements.sumPanel.appendChild(btn);
      }
    });
    updatePanelState();
  }

  function applyRoll({ sum, isDouble }) {
    if (!state.isRoundActive) return;
    const currentPlayerIndex = state.activePlayerIndices[state.currentActiveIndex];
    state.lastTurnPlayerIndex = currentPlayerIndex;
    state.rollCount += 1;

    if (state.rollCount <= 3) {
      if (sum === 7) {
        state.sharedPot += 70;
      } else {
        state.sharedPot += sum;
      }
    } else {
      if (sum === 7) {
        renderMeta();
        state.nextStartingPlayerIndex = (state.lastTurnPlayerIndex + 1) % state.players.length;
        endRound('');
        return;
      }
      if (isDouble) {
        state.sharedPot *= 2;
      } else {
        state.sharedPot += sum;
      }
    }
    renderMeta();
    updatePanelState();
    nextPlayer();
  }

  function showRound() {
    elements.setup.style.display = 'none';
    elements.round.style.display = 'grid';
    renderPlayers();
    renderMeta();
    renderPanel();
    setButtonsEnabled(true);
    // Round start message removed with log
    // show meta bar in play
    const meta = document.getElementById('metaBar');
    if (meta) meta.style.display = 'flex';
  }

  function endRound(reason) {
    state.isRoundActive = false;
    setButtonsEnabled(false);
    saveState();
    // Auto-advance unless final round reached
    if (state.roundNumber < state.totalRounds) {
      nextRound();
    } else {
      endGame();
    }
  }

  function nextPlayer(keepIndex = false) {
    if (!keepIndex) {
      state.currentActiveIndex = (state.currentActiveIndex + 1) % state.activePlayerIndices.length;
    }
    renderPlayers();
    saveState();
  }

  // dice rolling removed in favor of manual input panel

  function bankPlayer(playerIndex) {
    if (!state.isRoundActive) return;
    const pos = state.activePlayerIndices.indexOf(playerIndex);
    if (pos === -1) return; // already banked this round
    state.scores[playerIndex] += state.sharedPot;
    // Pot remains for remaining players (per rules)
    // Remove player from active
    state.activePlayerIndices.splice(pos, 1);
    state.lastTurnPlayerIndex = playerIndex;
    // Adjust current turn pointer to keep the same player on turn if needed
    if (pos < state.currentActiveIndex) {
      state.currentActiveIndex -= 1;
    } else if (pos === state.currentActiveIndex) {
      // Keep index pointing at the next player now occupying this position
      if (state.currentActiveIndex >= state.activePlayerIndices.length) state.currentActiveIndex = 0;
    }
    renderPlayers();
    renderMeta();
    if (state.activePlayerIndices.length === 0) {
      state.nextStartingPlayerIndex = (state.lastTurnPlayerIndex + 1) % state.players.length;
      endRound('All players have banked.');
      return;
    }
    saveState();
  }

  // Setup players management (pre-game)
  const setupPlayers = [];
  function renderSetupPlayers() {
    elements.playerList.innerHTML = '';
    setupPlayers.forEach((name, idx) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      const label = document.createElement('span');
      label.textContent = name;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'edit';
      edit.setAttribute('aria-label', `Edit ${name}`);
      edit.innerHTML = '<i class="bi bi-pencil-square"></i>';
      edit.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = setupPlayers[idx];
        input.style.border = 'none';
        input.style.outline = 'none';
        input.style.fontFamily = 'var(--heading-font)';
        input.style.fontSize = '0.95rem';
        const commit = () => { const v = input.value.trim(); if (v) setupPlayers[idx] = v; renderSetupPlayers(); };
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(); });
        input.addEventListener('blur', commit);
        chip.replaceChild(input, label);
        input.focus();
        input.select();
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.setAttribute('aria-label', `Remove ${name}`);
      remove.innerHTML = '<i class="bi bi-x-square"></i>';
      remove.addEventListener('click', () => { setupPlayers.splice(idx, 1); renderSetupPlayers(); });
      chip.appendChild(label);
      chip.appendChild(edit);
      chip.appendChild(remove);
      elements.playerList.appendChild(chip);
    });
  }
  function addPlayerFromInput() {
    const name = (elements.addPlayerName.value || '').trim();
    if (!name) return;
    setupPlayers.push(name);
    elements.addPlayerName.value = '';
    renderSetupPlayers();
  }

  function startGame() {
    const num = Math.max(2, setupPlayers.length);
    if (setupPlayers.length < 2) {
      // Seed default players if not enough entered
      while (setupPlayers.length < 2) setupPlayers.push(`Player ${setupPlayers.length + 1}`);
    }
    state.players = setupPlayers.slice(0);
    state.scores = Array(num).fill(0);
    state.roundNumber = 1;
    // totalRounds set via chips; preserve state.totalRounds
    resetRoundState();
    showRound();
    saveState();
  }

  function nextRound() {
    state.roundNumber += 1;
    resetRoundState();
    showRound();
    renderPanel();
    updatePanelState();
    saveState();
  }

  function newGame() {
    Object.assign(state, {
      players: [],
      scores: [],
      activePlayerIndices: [],
      currentActiveIndex: 0,
      sharedPot: 0,
      rollCount: 0,
      isRoundActive: false,
      roundNumber: 1,
      totalRounds: 15,
      winnerIndices: [],
      lastTurnPlayerIndex: 0,
      nextStartingPlayerIndex: 0,
    });
    elements.setup.style.display = 'grid';
    elements.round.style.display = 'none';
    elements.totalRoundsMeta.textContent = state.totalRounds;
    const meta = document.getElementById('metaBar');
    if (meta) meta.style.display = 'none';
    saveState();
  }

  function endGame() {
    const maxScore = Math.max(...state.scores);
    const winners = state.scores
      .map((s, i) => ({ s, i }))
      .filter(o => o.s === maxScore)
      .map(o => o.i);
    state.winnerIndices = winners;
    if (winners.length === 1) {
      // announce winner silently in UI for now
    } else {
      // announce tie silently in UI for now
    }
    // no roll controls now
  }

  // Event listeners
  elements.addPlayerBtn.addEventListener('click', addPlayerFromInput);
  elements.addPlayerName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addPlayerFromInput(); } });
  elements.startGameBtn.addEventListener('click', startGame);
  // no roll button now
  elements.newGameBtn.addEventListener('click', newGame);

  // Attempt to restore previous game
  if (loadState()) {
    const gameEnded = state.roundNumber >= state.totalRounds && !state.isRoundActive;
    if (gameEnded || state.players.length === 0) {
      // Show setup on reload after a finished game
      Object.assign(state, {
        players: [],
        scores: [],
        activePlayerIndices: [],
        currentActiveIndex: 0,
        sharedPot: 0,
        rollCount: 0,
        isRoundActive: false,
        roundNumber: 1,
        // keep chosen totalRounds; default if missing
        totalRounds: state.totalRounds || 15,
        winnerIndices: [],
        lastTurnPlayerIndex: 0,
        nextStartingPlayerIndex: 0,
      });
      elements.setup.style.display = 'grid';
      elements.round.style.display = 'none';
      const meta = document.getElementById('metaBar');
      if (meta) meta.style.display = 'none';
      saveState();
    } else {
      elements.setup.style.display = 'none';
      elements.round.style.display = 'grid';
      renderPlayers();
      renderMeta();
      renderPanel();
      updatePanelState();
    }
  }
  // Default setup view
  if (elements.setup.style.display !== 'none') {
    setupPlayers.push('Player 1', 'Player 2');
    renderSetupPlayers();
  }

  // Rounds chip selection
  elements.roundChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.selectChip');
    if (!chip) return;
    elements.roundChips.querySelectorAll('.selectChip').forEach(el => el.classList.remove('active'));
    chip.classList.add('active');
    const rounds = parseInt(chip.getAttribute('data-rounds') || '15', 10);
    state.totalRounds = rounds;
    elements.totalRoundsMeta.textContent = rounds;
    saveState();
  });
});
