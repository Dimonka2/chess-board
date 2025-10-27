/**
 * Board Management Methods for ChessWidget
 * Handles board rendering, orientation, and Chessground integration
 */

/**
 * Create the DOM structure for the board and controls
 */
ChessWidget.prototype.createBoardContainer = function() {
  // Conditionally add revert button if wrong move retention is enabled (Phase 5)
  const revertButton = this.retainWrongMoves
    ? '<button class="chess-widget-revert" style="display:none;">Undo Wrong Move</button>'
    : '';

  this.element.innerHTML = `
    <div class="chess-widget-container">
      <div class="chess-widget-board" style="width: ${this.width}px; height: ${this.width}px;"></div>
      <div class="chess-widget-controls">
        <button class="chess-widget-reset">Reset</button>
        ${revertButton}
        <div class="chess-widget-status">${this.i18n.t('make_your_move')}</div>
      </div>
    </div>
  `;

  this.boardElement = this.element.querySelector('.chess-widget-board');
  this.statusElement = this.element.querySelector('.chess-widget-status');
  this.resetButton = this.element.querySelector('.chess-widget-reset');
  this.revertButton = this.element.querySelector('.chess-widget-revert');
};

/**
 * Determine board orientation based on settings
 * @returns {string} 'white' or 'black'
 */
ChessWidget.prototype.getOrientation = function() {
  // If fixedOrientation is set, always use it
  if (this.fixedOrientation) {
    return this.fixedOrientation;
  }
  // Otherwise, use autoFlip logic
  const currentTurn = this.chess.turn();
  return this.autoFlip && currentTurn === 'b' ? 'black' : 'white';
};

/**
 * Initialize Chessground board
 */
ChessWidget.prototype.initChessground = function() {
  console.log('initChessground called with FEN:', this.fen);

  // Determine board orientation
  const currentTurn = this.chess.turn();
  const orientation = this.getOrientation();

  const config = {
    fen: this.fen,
    orientation: orientation,
    turnColor: currentTurn === 'w' ? 'white' : 'black',
    coordinates: true,
    ranksPosition: 'right', // Show rank numbers on right side (Lichess style)
    movable: {
      color: currentTurn === 'w' ? 'white' : 'black',
      free: false,
      dests: this.getDests()
    },
    events: {
      move: (orig, dest) => this.onMove(orig, dest)
    }
  };

  console.log('Chessground config:', config);

  try {
    // Initialize Chessground (available globally)
    if (typeof Chessground === 'function') {
      this.chessground = Chessground(this.boardElement, config);
      console.log('Chessground instance created:', this.chessground);

      // Force set the position
      if (this.chessground && this.chessground.set) {
        console.log('Setting FEN position manually:', this.fen);
        this.chessground.set({ fen: this.fen });
      }
    } else {
      console.error('Chessground not available');
      return;
    }
  } catch (error) {
    console.error('Error creating chessground:', error);
  }
};

/**
 * Get legal destinations for all pieces
 * @returns {Map} Map of square -> legal destinations
 */
ChessWidget.prototype.getDests = function() {
  const dests = new Map();
  const moves = this.chess.moves({ verbose: true });

  moves.forEach(move => {
    if (!dests.has(move.from)) {
      dests.set(move.from, []);
    }
    dests.get(move.from).push(move.to);
  });

  return dests;
};

/**
 * Update board state after a move
 */
ChessWidget.prototype.updateBoard = function() {
  const currentTurn = this.chess.turn();

  this.chessground.set({
    fen: this.chess.fen(),
    orientation: this.getOrientation(),
    turnColor: currentTurn === 'w' ? 'white' : 'black',
    movable: {
      color: currentTurn === 'w' ? 'white' : 'black',
      dests: this.getDests()
    }
  });
};

/**
 * Create control buttons and event handlers
 */
ChessWidget.prototype.createControls = function() {
  // Add reset button handler
  this.resetButton.addEventListener('click', () => this.reset());

  // Add revert button handler if wrong move retention is enabled (Phase 5)
  if (this.retainWrongMoves && this.revertButton) {
    this.revertButton.addEventListener('click', () => this.revertWrongMove());
  }
};

/**
 * Reset the puzzle to initial state
 */
ChessWidget.prototype.reset = function() {
  this.chess = new Chess(this.fen);
  this.currentMoveIndex = 0;

  // Reset solution validator if it exists
  if (this.solutionValidator) {
    this.solutionValidator.reset();
  }

  // Clear wrong move data and hide revert button (Phase 5)
  this.wrongMoveData = null;
  if (this.revertButton) {
    this.revertButton.style.display = 'none';
  }

  // Remove question mark indicator (Phase 3)
  if (this.removeQuestionMarkIndicator) {
    this.removeQuestionMarkIndicator();
  }

  // Reset puzzle state and emit event (Phase 5)
  if (this.puzzleState) {
    this.puzzleState.reset();
    this.puzzleState.emitEvent('puzzleReset');
  }

  // Determine initial orientation after reset
  const currentTurn = this.chess.turn();

  this.chessground.set({
    fen: this.fen,
    orientation: this.getOrientation(),
    turnColor: currentTurn === 'w' ? 'white' : 'black',
    lastMove: undefined,
    movable: {
      color: currentTurn === 'w' ? 'white' : 'black',
      dests: this.getDests()
    }
  });

  this.statusElement.textContent = this.i18n.t('make_your_move');
  this.statusElement.className = 'chess-widget-status';

  // If premove is enabled, replay it after reset
  if (this.premoveEnabled && this.solutionValidator && this.solutionValidator.hasSolution()) {
    setTimeout(() => {
      this.playPremove();
    }, 500);
  }
};
