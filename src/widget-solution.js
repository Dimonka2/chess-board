/**
 * Solution Validation and Move Handling
 * Handles move validation, automatic moves, and puzzle feedback
 */

/**
 * Handle a move made by the user
 * @param {string} orig - Origin square
 * @param {string} dest - Destination square
 */
ChessWidget.prototype.onMove = function(orig, dest) {
  // Emit move attempted event (Phase 5)
  if (this.puzzleState) {
    this.puzzleState.emitEvent('moveAttempted', { from: orig, to: dest });
  }

  let move = null;

  // Try to make the move - chess.js may throw an error for invalid moves
  try {
    move = this.chess.move({ from: orig, to: dest });
  } catch (error) {
    // Invalid move - chess.js threw an error
    console.warn('Invalid move attempted:', { from: orig, to: dest }, error.message);
  }

  if (!move) {
    // Invalid move - reject and reset board
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
    this.showFeedback('invalid_move');
    return;
  }

  // Transition from not_started to in_progress on first move (Phase 5)
  if (this.puzzleState && this.puzzleState.isNotStarted()) {
    this.puzzleState.setState('in_progress', { firstMove: move });
  }

  // Check if this is the expected solution move using SolutionValidator
  if (this.solutionValidator && this.solutionValidator.hasSolution()) {
    const moveNotation = move.from + move.to + (move.promotion || '');
    const isCorrect = this.solutionValidator.isValidMove(moveNotation, this.currentMoveIndex)
                   || this.solutionValidator.isValidMove(move.san, this.currentMoveIndex);

    if (isCorrect) {
      // Emit correct move event (Phase 5)
      if (this.puzzleState) {
        this.puzzleState.emitEvent('correctMove', { move: moveNotation });
      }

      // Correct move
      this.currentMoveIndex++;

      // Check if puzzle is solved
      if (this.solutionValidator.isPuzzleSolved(this.currentMoveIndex)) {
        this.handlePuzzleSolved();
      } else {
        this.handleCorrectMove();
      }
    } else {
      // Wrong move - transition to wrong_move state (Phase 5)
      if (this.puzzleState) {
        this.puzzleState.setState('wrong_move', { wrongMove: moveNotation });
        this.puzzleState.emitEvent('wrongMove', { move: moveNotation });
      }

      this.handleWrongMove();
    }
  } else {
    // Free play mode (no solution defined)
    this.updateBoard();
  }
};

/**
 * Handle a correct move
 */
ChessWidget.prototype.handleCorrectMove = function() {
  this.showFeedback('correct');

  // Check if there's an opponent's response to play automatically
  const expectedMoves = this.solutionValidator.getExpectedMoves(this.currentMoveIndex);

  if (expectedMoves.length > 0) {
    const nextMove = expectedMoves[0]; // Take first expected move (could be only one)

    // Play opponent's response after a short delay for better UX
    setTimeout(() => {
      this.playAutomaticMove(nextMove);
    }, 500);
  } else {
    this.updateBoard();
  }
};

/**
 * Handle a wrong move
 */
ChessWidget.prototype.handleWrongMove = async function() {
  // Check if Stockfish feedback is enabled
  if (this.stockfish && this.stockfishEnabled) {
    await this.handleWrongMoveWithStockfish();
  } else {
    this.handleWrongMoveBasic();
  }
};

/**
 * Handle wrong move with basic feedback (no Stockfish)
 */
ChessWidget.prototype.handleWrongMoveBasic = function() {
  this.showFeedback('wrong');
  this.chess.undo();
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
 * Handle wrong move with Stockfish counter-move feedback
 */
ChessWidget.prototype.handleWrongMoveWithStockfish = async function() {
  this.showFeedback('loading');

  // Get current position after user's wrong move (before undo)
  const currentFen = this.chess.fen();

  try {
    // Check cache first
    let counterMoveData = null;
    if (this.cache) {
      counterMoveData = this.cache.getCachedMove(currentFen, this.stockfishDepth);
    }

    // If not in cache, request from API
    if (!counterMoveData) {
      counterMoveData = await this.stockfish.getBestMove(currentFen);

      // Store in cache
      if (this.cache && counterMoveData) {
        this.cache.setCachedMove(currentFen, this.stockfishDepth, counterMoveData);
      }
    }

    // Show the counter-move
    if (counterMoveData && counterMoveData.move) {
      await this.showStockfishCounterMove(counterMoveData);
    } else {
      // Fallback to basic feedback if no counter-move
      this.handleWrongMoveBasic();
    }

  } catch (error) {
    console.warn('Stockfish request failed, falling back to basic feedback:', error);
    this.handleWrongMoveBasic();
  }
};

/**
 * Show Stockfish's counter-move as feedback
 * @param {object} counterMoveData - Counter-move data from Stockfish
 */
ChessWidget.prototype.showStockfishCounterMove = async function(counterMoveData) {
  const move = counterMoveData.move;

  // Parse the UCI move (e.g., "e2e4" or "e7e8q")
  const from = move.substring(0, 2);
  const to = move.substring(2, 4);
  const promotion = move.length > 4 ? move[4] : undefined;

  // Make the counter-move on the chess.js board
  const chessMove = this.chess.move({ from, to, promotion });

  if (chessMove) {
    // Animate the counter-move on the board
    this.chessground.move(from, to);

    // Update board state to reflect the counter-move
    const currentTurn = this.chess.turn();
    const configUpdate = {
      fen: this.chess.fen(),
      orientation: this.getOrientation(),
      turnColor: currentTurn === 'w' ? 'white' : 'black',
      movable: {
        color: undefined  // Disable moves during feedback
      }
    };

    // Add arrow if enabled (Phase 3 feature)
    if (this.stockfishShowArrow) {
      configUpdate.drawable = {
        enabled: false,  // Disable manual drawing
        visible: true,
        autoShapes: [
          {
            orig: from,
            dest: to,
            brush: 'red'  // Red arrow for counter-move
          }
        ]
      };
    }

    this.chessground.set(configUpdate);

    // Show feedback message with the counter-move
    this.showFeedback('stockfish_counter', { move: move });

    // Wait 2 seconds, then undo both moves
    await delay(2000);

    // Undo Stockfish's move and user's wrong move
    this.chess.undo();  // Undo Stockfish's counter-move
    this.chess.undo();  // Undo user's wrong move

    // Reset board to position before wrong move
    const resetTurn = this.chess.turn();
    this.chessground.set({
      fen: this.chess.fen(),
      orientation: this.getOrientation(),
      turnColor: resetTurn === 'w' ? 'white' : 'black',
      lastMove: undefined,
      movable: {
        color: resetTurn === 'w' ? 'white' : 'black',
        dests: this.getDests()
      },
      drawable: {
        autoShapes: []  // Clear arrows
      }
    });

    // Show "try again" message
    this.showFeedback('wrong');

  } else {
    // Failed to make counter-move, fall back to basic feedback
    this.handleWrongMoveBasic();
  }
};

/**
 * Handle puzzle completion
 */
ChessWidget.prototype.handlePuzzleSolved = function() {
  // Transition to solved state and emit event (Phase 5)
  if (this.puzzleState) {
    this.puzzleState.setState('solved');
    this.puzzleState.emitEvent('puzzleSolved');
  }

  this.showFeedback('solved');
  this.chessground.set({ movable: { color: undefined } });
};

/**
 * Play an automatic move (opponent's response)
 * @param {string} moveNotation - Move in UCI or SAN notation
 */
ChessWidget.prototype.playAutomaticMove = function(moveNotation) {
  // Try to parse and play the move (supports both UCI and SAN notation)
  let move = null;

  // Try SAN notation first (e.g., Nf3, e4)
  try {
    move = this.chess.move(moveNotation);
  } catch (e) {
    // SAN failed, try UCI notation
  }

  // If SAN failed, try UCI notation (e.g., e2e4)
  if (!move && moveNotation.length >= 4) {
    const from = moveNotation.substring(0, 2);
    const to = moveNotation.substring(2, 4);
    const promotion = moveNotation.length > 4 ? moveNotation[4] : undefined;
    move = this.chess.move({ from, to, promotion });
  }

  if (move) {
    // Animate the move on the board for smooth visual effect
    this.chessground.move(move.from, move.to);

    // Increment move index
    this.currentMoveIndex++;

    // Check if puzzle is complete
    if (this.solutionValidator.isPuzzleSolved(this.currentMoveIndex)) {
      this.handlePuzzleSolved();
    } else {
      // Update board state for next user move
      this.updateBoard();
    }
  }
};

/**
 * Show feedback message to user
 * @param {string} type - Feedback type (correct, wrong, solved, etc.)
 * @param {object} params - Optional parameters for message interpolation
 */
ChessWidget.prototype.showFeedback = function(type, params = {}) {
  const message = this.i18n.t(type, params);

  this.statusElement.textContent = message;
  this.statusElement.className = `chess-widget-status ${type}`;

  if (type !== 'solved' && type !== 'invalid_move') {
    setTimeout(() => {
      this.statusElement.textContent = this.i18n.t('make_your_move');
      this.statusElement.className = 'chess-widget-status';
    }, 2000);
  }
};

/**
 * Play the premove (opponent's setup move)
 * This is called automatically when premoveEnabled is true
 */
ChessWidget.prototype.playPremove = function() {
  if (!this.solutionValidator || !this.solutionValidator.hasSolution()) {
    return;
  }

  // Get the first move from solution (this is the opponent's premove)
  const expectedMoves = this.solutionValidator.getExpectedMoves(0);

  if (expectedMoves.length > 0) {
    const premoveNotation = expectedMoves[0];

    // Parse and play the premove directly (bypass validation)
    let move = null;

    // Try SAN notation first
    try {
      move = this.chess.move(premoveNotation);
    } catch (e) {
      // SAN failed, try UCI notation
    }

    // If SAN failed, try UCI notation
    if (!move && premoveNotation.length >= 4) {
      const from = premoveNotation.substring(0, 2);
      const to = premoveNotation.substring(2, 4);
      const promotion = premoveNotation.length > 4 ? premoveNotation[4] : undefined;

      try {
        move = this.chess.move({ from, to, promotion });
      } catch (e) {
        console.error('Failed to play premove:', e);
      }
    }

    if (move) {
      // Update board state with the premove (don't trigger move validation)
      const currentTurn = this.chess.turn();

      this.chessground.set({
        fen: this.chess.fen(),
        orientation: this.getOrientation(),
        turnColor: currentTurn === 'w' ? 'white' : 'black',
        lastMove: [move.from, move.to],
        movable: {
          color: currentTurn === 'w' ? 'white' : 'black',
          dests: this.getDests()
        }
      });

      // Increment move index to skip the premove in solution validation
      this.currentMoveIndex++;

      // Show status message
      this.statusElement.textContent = this.i18n.t('make_your_move');
      this.statusElement.className = 'chess-widget-status';
    }
  }
};
