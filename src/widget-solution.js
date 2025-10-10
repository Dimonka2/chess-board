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
  const move = this.chess.move({ from: orig, to: dest });

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

  // Check if this is the expected solution move using SolutionValidator
  if (this.solutionValidator && this.solutionValidator.hasSolution()) {
    const moveNotation = move.from + move.to + (move.promotion || '');
    const isCorrect = this.solutionValidator.isValidMove(moveNotation, this.currentMoveIndex)
                   || this.solutionValidator.isValidMove(move.san, this.currentMoveIndex);

    if (isCorrect) {
      // Correct move
      this.currentMoveIndex++;

      // Check if puzzle is solved
      if (this.solutionValidator.isPuzzleSolved(this.currentMoveIndex)) {
        this.handlePuzzleSolved();
      } else {
        this.handleCorrectMove();
      }
    } else {
      // Wrong move
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
ChessWidget.prototype.handleWrongMove = function() {
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
 * Handle puzzle completion
 */
ChessWidget.prototype.handlePuzzleSolved = function() {
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
