/**
 * Chess Widget - Easy-to-install chess puzzle widget
 * Uses chessground and chess.js for interactive chess puzzles
 * All dependencies bundled - no external CDN calls
 */

class ChessWidget {
  constructor(element) {
    this.element = element;
    this.fen = element.dataset.fen;
    this.solution = element.dataset.solution ? element.dataset.solution.split(',') : [];
    this.width = element.dataset.width || 400;
    this.theme = element.dataset.theme || 'blue';
    this.autoFlip = element.dataset.autoFlip === 'true';
    
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
  
  initChessground() {
    console.log('initChessground called with FEN:', this.fen);
    
    // Determine board orientation
    const currentTurn = this.chess.turn();
    const orientation = this.autoFlip && currentTurn === 'b' ? 'black' : 'white';
    
    const config = {
      fen: this.fen,
      orientation: orientation,
      turnColor: currentTurn === 'w' ? 'white' : 'black',
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
      this.chessground.set({
        fen: this.chess.fen()
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
          this.updateBoard();
        }
      } else {
        // Wrong move
        this.showFeedback('wrong');
        this.chess.undo();
        const currentTurn = this.chess.turn();
        const orientation = this.autoFlip && currentTurn === 'b' ? 'black' : 'white';
        
        this.chessground.set({
          fen: this.chess.fen(),
          orientation: orientation,
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
    const orientation = this.autoFlip && currentTurn === 'b' ? 'black' : 'white';
    
    this.chessground.set({
      fen: this.chess.fen(),
      orientation: orientation,
      turnColor: currentTurn === 'w' ? 'white' : 'black',
      movable: {
        color: currentTurn === 'w' ? 'white' : 'black',
        dests: this.getDests()
      }
    });
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
    const orientation = this.autoFlip && currentTurn === 'b' ? 'black' : 'white';
    
    this.chessground.set({
      fen: this.fen,
      orientation: orientation,
      turnColor: currentTurn === 'w' ? 'white' : 'black',
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

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ChessWidget.init());
} else {
  ChessWidget.init();
}

// Export for manual initialization
window.ChessWidget = ChessWidget;