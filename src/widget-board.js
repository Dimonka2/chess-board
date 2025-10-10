/**
 * Board Management Methods for ChessWidget
 * Handles board rendering, orientation, and Chessground integration
 */

/**
 * Create the DOM structure for the board and controls
 */
ChessWidget.prototype.createBoardContainer = function() {
  this.element.innerHTML = `
    <div class="chess-widget-container">
      <div class="chess-widget-board" style="width: ${this.width}px; height: ${this.width}px;"></div>
      <div class="chess-widget-controls">
        <button class="chess-widget-reset">Reset</button>
        <div class="chess-widget-status">${this.i18n.t('make_your_move')}</div>
      </div>
    </div>
  `;

  this.boardElement = this.element.querySelector('.chess-widget-board');
  this.statusElement = this.element.querySelector('.chess-widget-status');
  this.resetButton = this.element.querySelector('.chess-widget-reset');
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
};
