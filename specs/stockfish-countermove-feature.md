# Stockfish Counter-Move Feature Specification

## Overview
Add optional Stockfish integration to show counter-moves when users make incorrect moves in puzzle mode, helping them understand why their move was wrong.

## Feature Description

### Core Functionality
When a user makes an incorrect move in puzzle mode:
1. Keep the incorrect move on the board
2. Request Stockfish's best response via stockfish.online API
3. Show the counter-move visually (animated move + arrow)
4. Display a message like "Stockfish responds with [move]. Try again!"
5. After showing the counter-move, undo both moves and let user retry

### Configuration Options
New data attributes for the widget:
```html
<div class="chess-puzzle"
     data-fen="..."
     data-solution="..."
     data-stockfish-enabled="true"              <!-- Enable Stockfish feedback -->
     data-stockfish-depth="12"                   <!-- Stockfish depth (default: 12) -->
     data-stockfish-timeout="2000"               <!-- Max wait time in ms (default: 2000) -->
     data-stockfish-show-arrow="true"            <!-- Show arrow for counter-move (default: true) -->
     data-stockfish-show-animation="true"        <!-- Animate counter-move (default: true) -->
     data-stockfish-cache-enabled="true">        <!-- Enable response caching (default: true) -->
</div>
```

## Technical Architecture

### 1. Code Organization (Modular Structure)

Split `chess-widget.js` into multiple source files, bundled into one output file:

```
src/
├── chess-widget.js              # Main entry point
├── widget-core.js               # ChessWidget class core functionality
├── widget-board.js              # Board rendering and interaction
├── widget-solution.js           # Solution validation and move handling
├── widget-stockfish.js          # NEW: Stockfish API integration
├── widget-cache.js              # NEW: Move caching system
└── widget-utils.js              # Utility functions
```

Build process will concatenate these files in order during build.

### 2. Stockfish API Integration

#### API Endpoint
```
POST https://stockfish.online/api/s/v2.php
Content-Type: application/x-www-form-urlencoded

fen=<position>&depth=<depth>&mode=bestmove
```

#### Response Format
```json
{
  "success": true,
  "bestmove": "e2e4",
  "evaluation": 0.5,
  "mate": null,
  "continuation": "e2e4 e7e5 g1f3"
}
```

#### Implementation Class
```javascript
class StockfishClient {
  constructor(config) {
    this.depth = config.depth || 12;
    this.timeout = config.timeout || 2000;
    this.apiUrl = 'https://stockfish.online/api/s/v2.php';
  }

  async getBestMove(fen) {
    // Make API request
    // Handle timeout
    // Parse response
    // Return { move: 'e2e4', evaluation: 0.5 }
  }
}
```

### 3. Caching System

#### Cache Structure
```javascript
class MoveCache {
  constructor(puzzleFen) {
    this.puzzleId = this.generatePuzzleId(puzzleFen);
    this.cache = this.loadFromStorage() || {};
  }

  generatePuzzleId(fen) {
    // Simple hash of starting FEN for cache key
    return btoa(fen).substring(0, 16);
  }

  getCachedMove(fen, depth) {
    const key = `${fen}:${depth}`;
    return this.cache[key];
  }

  setCachedMove(fen, depth, moveData) {
    const key = `${fen}:${depth}`;
    this.cache[key] = {
      move: moveData.move,
      evaluation: moveData.evaluation,
      timestamp: Date.now()
    };
    this.saveToStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(`sf-cache-${this.puzzleId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(`sf-cache-${this.puzzleId}`, JSON.stringify(this.cache));
    } catch (e) {
      console.warn('Failed to save Stockfish cache:', e);
    }
  }
}
```

### 4. Visual Feedback

#### Move Animation
```javascript
async showStockfishCounterMove(move) {
  // 1. Animate the counter-move
  const from = move.substring(0, 2);
  const to = move.substring(2, 4);

  if (this.config.showAnimation) {
    await this.animateMove(from, to, 500); // 500ms animation
  }

  // 2. Show arrow overlay
  if (this.config.showArrow) {
    this.drawMoveArrow(from, to, 'red');
  }

  // 3. Update status message
  this.showFeedback('stockfish-counter', move);

  // 4. Wait 2 seconds, then undo both moves
  await this.delay(2000);
  this.undoLastTwoMoves();
  this.clearArrows();
}
```

#### Status Messages
Add new feedback type:
```javascript
showFeedback(type, moveData) {
  const messages = {
    correct: 'Correct! Keep going...',
    wrong: 'Try again!',
    solved: 'Puzzle solved! Well done!',
    'stockfish-counter': `Stockfish responds: ${this.formatMove(moveData)}. Try again!`
  };
  // ... existing feedback logic
}
```

### 5. Integration with Existing Move Validation

Modify `onMove()` in widget-solution.js:

```javascript
async onMove(orig, dest) {
  const move = this.chess.move({ from: orig, to: dest });

  if (!move) {
    // Invalid move - reject
    this.updateBoard();
    return;
  }

  // Check if this is the expected solution move
  if (this.solution.length > 0) {
    const expectedMove = this.solution[this.currentMoveIndex];
    const moveNotation = move.from + move.to + (move.promotion || '');

    if (moveNotation === expectedMove || move.san === expectedMove) {
      // Correct move
      this.handleCorrectMove();
    } else {
      // Wrong move - NEW: Show Stockfish counter-move if enabled
      if (this.stockfish && this.config.stockfishEnabled) {
        await this.handleWrongMoveWithStockfish(move);
      } else {
        this.handleWrongMove();
      }
    }
  }
}

async handleWrongMoveWithStockfish(userMove) {
  this.showFeedback('wrong');

  // Get current position after user's wrong move
  const currentFen = this.chess.fen();

  // Request Stockfish counter-move (with caching)
  let counterMoveData = this.cache?.getCachedMove(currentFen, this.config.stockfishDepth);

  if (!counterMoveData) {
    try {
      counterMoveData = await this.stockfish.getBestMove(currentFen);
      if (this.cache) {
        this.cache.setCachedMove(currentFen, this.config.stockfishDepth, counterMoveData);
      }
    } catch (error) {
      console.warn('Stockfish request failed, falling back to basic feedback:', error);
      this.handleWrongMove(); // Fallback to existing behavior
      return;
    }
  }

  // Show the counter-move
  await this.showStockfishCounterMove(counterMoveData.move);
}
```

## Build System Updates

### Update build.js

Add support for concatenating multiple source files:

```javascript
// Build JavaScript with bundled dependencies
async function buildJS() {
  console.log('Building JavaScript with bundled dependencies...');

  try {
    // Read dependency files
    let chessJS = fs.readFileSync('node_modules/chess.js/dist/cjs/chess.js', 'utf8');
    let chessgroundJS = fs.readFileSync('node_modules/chessground/dist/chessground.min.js', 'utf8');

    // Read widget source files in order
    const widgetFiles = [
      'src/widget-utils.js',
      'src/widget-cache.js',
      'src/widget-stockfish.js',
      'src/widget-board.js',
      'src/widget-solution.js',
      'src/widget-core.js',
      'src/chess-widget.js'  // Main entry point last
    ];

    let widgetJS = '';
    for (const file of widgetFiles) {
      if (fs.existsSync(file)) {
        widgetJS += fs.readFileSync(file, 'utf8') + '\n\n';
      }
    }

    // ... rest of build process
  }
}
```

## Implementation Plan

### Phase 1: Code Refactoring (Week 1)
1. Split chess-widget.js into modular files
2. Update build.js to concatenate files
3. Test that existing functionality still works
4. Update documentation

### Phase 2: Stockfish Integration (Week 1-2)
1. Implement StockfishClient class
2. Implement MoveCache class
3. Add configuration parsing for new data attributes
4. Test API integration independently

### Phase 3: Visual Feedback (Week 2)
1. Implement arrow drawing for counter-moves
2. Implement move animation
3. Add new status message types
4. Test visual feedback

### Phase 4: Integration (Week 2-3)
1. Integrate Stockfish logic into move validation
2. Add error handling and fallbacks
3. Test with various puzzles
4. Performance testing

### Phase 5: Polish & Documentation (Week 3)
1. Add examples to demo page
2. Update README with Stockfish feature documentation
3. Add configuration guide
4. Test across browsers

## File Size Considerations

### Estimated Size Impact
- **Current widget size**: ~150KB (with all dependencies)
- **Stockfish integration**: ~5-8KB additional
- **Caching system**: ~2-3KB additional
- **Total estimated**: ~160KB (6-7% increase)

### Optimization Strategies
1. **Lazy loading**: Only load Stockfish code if `data-stockfish-enabled="true"`
2. **Minification**: Ensure proper minification of new code
3. **Tree shaking**: Remove unused Stockfish features
4. **Code splitting**: Consider separate build for "stockfish-enabled" version

## Testing Requirements

### Unit Tests
- StockfishClient API requests
- MoveCache storage and retrieval
- Move validation with Stockfish enabled/disabled

### Integration Tests
- Wrong move → counter-move → retry flow
- Cache hit vs cache miss scenarios
- API timeout handling
- Fallback behavior when API fails

### Browser Compatibility
- Test localStorage in private/incognito mode
- Test CORS handling for stockfish.online API
- Test across Chrome, Firefox, Safari, Edge

## Security & Privacy

### API Usage
- No authentication required for stockfish.online
- Rate limiting: Consider throttling requests
- No user data sent (only FEN positions)

### Caching
- Cache stored in localStorage (per-domain)
- No sensitive data stored
- Cache can be cleared by user

## Documentation Updates

### README.md
Add section:
```markdown
### Stockfish Integration (Optional)

Enable Stockfish-powered feedback for incorrect moves:

```html
<div class="chess-puzzle"
     data-fen="rnbqkb1r/ppp2ppp/5n2/3pp3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4"
     data-solution="f1c4,d5c4,d1f3,e8e7"
     data-stockfish-enabled="true"
     data-stockfish-depth="12">
</div>
```

When enabled, incorrect moves will trigger Stockfish to show why the move was wrong.
```

### CLAUDE.md
Update project architecture section to reflect modular structure.

## Future Enhancements

1. **Multiple counter-moves**: Show top 3 moves from Stockfish
2. **Evaluation bar**: Show position evaluation
3. **Hint system**: Use Stockfish to provide hints
4. **Difficulty adjustment**: Adjust Stockfish depth based on puzzle difficulty
5. **Offline mode**: Bundle Stockfish WASM for offline use

## Success Metrics

- Feature adoption: % of puzzles using Stockfish
- Cache hit rate: Should be >80% for repeated attempts
- Performance: Counter-move shown within 2 seconds
- File size: Keep total under 200KB
- Error rate: <1% API failures
