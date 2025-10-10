/**
 * Chess Widget - Easy-to-install chess puzzle widget
 * Uses chessground and chess.js for interactive chess puzzles
 * All dependencies bundled - no external CDN calls
 */

class ChessWidget {
  constructor(element) {
    this.element = element;
    this.fen = element.dataset.fen;
    this.solution = element.dataset.solution
      ? element.dataset.solution.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    this.width = element.dataset.width || 400;
    this.theme = element.dataset.theme || 'blue';
    this.autoFlip = element.dataset.autoFlip === 'true';
    this.fixedOrientation = element.dataset.orientation || null; // 'white', 'black', or null for auto

    this.currentMoveIndex = 0;
    this.chess = null;
    this.chessground = null;

    this.init();
  }
  
  init() {
    try {
      // Create chess instance
      this.chess = new Chess(this.fen);
      
      // Create board container
      this.createBoardContainer();
      
      // Initialize chessground
      this.initChessground();
      
      // Create controls
      this.createControls();
      
      console.log('Chess widget initialized successfully');
    } catch (error) {
      console.error('Error initializing chess widget:', error);
    }
  }
  
  createBoardContainer() {
    this.element.innerHTML = `
      <div class="chess-widget-container">
        <div class="chess-widget-board" style="width: ${this.width}px; height: ${this.width}px;"></div>
        <div class="chess-widget-controls">
          <button class="chess-widget-reset">Reset</button>
          <div class="chess-widget-status">Make your move</div>
        </div>
      </div>
    `;
    
    this.boardElement = this.element.querySelector('.chess-widget-board');
    this.statusElement = this.element.querySelector('.chess-widget-status');
    this.resetButton = this.element.querySelector('.chess-widget-reset');
  }
  
  getOrientation() {
    // If fixedOrientation is set, always use it
    if (this.fixedOrientation) {
      return this.fixedOrientation;
    }
    // Otherwise, use autoFlip logic
    const currentTurn = this.chess.turn();
    return this.autoFlip && currentTurn === 'b' ? 'black' : 'white';
  }

  initChessground() {
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
  }
  
  createControls() {
    // Add reset button handler
    this.resetButton.addEventListener('click', () => this.reset());
  }
  
  getDests() {
    const dests = new Map();
    const moves = this.chess.moves({ verbose: true });
    
    moves.forEach(move => {
      if (!dests.has(move.from)) {
        dests.set(move.from, []);
      }
      dests.get(move.from).push(move.to);
    });
    
    return dests;
  }
  
  onMove(orig, dest) {
    const move = this.chess.move({ from: orig, to: dest });

    if (!move) {
      // Invalid move
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
      return;
    }
    
    // Check if this is the expected solution move
    if (this.solution.length > 0) {
      const expectedMove = this.solution[this.currentMoveIndex];
      const moveNotation = move.from + move.to + (move.promotion || '');
      
      if (moveNotation === expectedMove || move.san === expectedMove) {
        // Correct move
        this.currentMoveIndex++;
        this.showFeedback('correct');

        if (this.currentMoveIndex >= this.solution.length) {
          this.showFeedback('solved');
          this.chessground.set({ movable: { color: undefined } });
        } else {
          // Check if there's an opponent's response to play automatically
          const nextMove = this.solution[this.currentMoveIndex];
          if (nextMove) {
            // Play opponent's response after a short delay for better UX
            setTimeout(() => {
              this.playAutomaticMove(nextMove);
            }, 500);
          } else {
            this.updateBoard();
          }
        }
      } else {
        // Wrong move
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
      }
    } else {
      // Free play mode
      this.updateBoard();
    }
  }
  
  updateBoard() {
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
  }

  playAutomaticMove(moveNotation) {
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
      if (this.currentMoveIndex >= this.solution.length) {
        this.showFeedback('solved');
        this.chessground.set({ movable: { color: undefined } });
      } else {
        // Update board state for next user move
        this.updateBoard();
      }
    }
  }
  
  showFeedback(type) {
    const messages = {
      correct: 'Correct! Keep going...',
      wrong: 'Try again!',
      solved: 'Puzzle solved! Well done!'
    };
    
    this.statusElement.textContent = messages[type];
    this.statusElement.className = `chess-widget-status ${type}`;
    
    if (type !== 'solved') {
      setTimeout(() => {
        this.statusElement.textContent = 'Make your move';
        this.statusElement.className = 'chess-widget-status';
      }, 2000);
    }
  }
  
  reset() {
    this.chess = new Chess(this.fen);
    this.currentMoveIndex = 0;

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
    
    this.statusElement.textContent = 'Make your move';
    this.statusElement.className = 'chess-widget-status';
  }
  
  static init() {
    // Initialize all chess widgets on the page
    const widgets = document.querySelectorAll('.chess-puzzle');
    widgets.forEach(widget => new ChessWidget(widget));
  }
}

// Make available on window early so other scripts can reference it
try { window.ChessWidget = ChessWidget; } catch (_) {}

// Auto-initialize if DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChessWidget.init());
  } else {
    ChessWidget.init();
  }
}
