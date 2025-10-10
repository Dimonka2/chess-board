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
     data-solution-alternatives="..."            <!-- Alternative solution paths (optional) -->
     data-lang="en"                              <!-- Widget language (default: en) -->
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
├── widget-i18n.js               # NEW: Internationalization system
└── widget-utils.js              # Utility functions
```

Build process will concatenate these files in order during build.

### 2. Alternative Solutions System

#### Puzzle Notation Standard
Following the PGN (Portable Game Notation) convention used by popular puzzle databases like Lichess and Chess.com, we'll support multiple solution paths using the pipe `|` separator:

```html
<!-- Single solution path -->
<div class="chess-puzzle"
     data-fen="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
     data-solution="f1c4,d5c4,d1f3,e8e7">
</div>

<!-- Multiple alternative solutions (mate in 2 with different final moves) -->
<div class="chess-puzzle"
     data-fen="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
     data-solution="f1c4,d5c4,d1f3,e8e7|f1c4,d5c4,d1h5,e8e7">
     <!-- Both paths lead to mate, just different queen moves -->
</div>

<!-- Branching at different points (move 2 has alternatives) -->
<div class="chess-puzzle"
     data-fen="..."
     data-solution="e2e4,e7e5,g1f3|e2e4,e7e5,f1c4">
     <!-- After e2e4 e7e5, both Nf3 and Bc4 are acceptable -->
</div>
```

#### Implementation Class
```javascript
class SolutionValidator {
  constructor(solutionString) {
    this.solutionPaths = this.parseSolutions(solutionString);
    this.currentMoveIndex = 0;
    this.activePaths = [...this.solutionPaths]; // Clone all paths
  }

  parseSolutions(solutionString) {
    // Split by pipe to get alternative paths
    const paths = solutionString.split('|').map(path => path.trim());

    // Convert each path to array of moves
    return paths.map(path => path.split(',').map(move => move.trim()));
  }

  isValidMove(move, moveIndex) {
    // Check if move is valid in ANY active path
    const validPaths = this.activePaths.filter(path => {
      if (moveIndex >= path.length) return false;
      return path[moveIndex] === move;
    });

    if (validPaths.length > 0) {
      // Update active paths to only those that matched
      this.activePaths = validPaths;
      return true;
    }

    return false;
  }

  getExpectedMoves(moveIndex) {
    // Get all possible valid moves at this position
    const expectedMoves = new Set();
    this.activePaths.forEach(path => {
      if (moveIndex < path.length) {
        expectedMoves.add(path[moveIndex]);
      }
    });
    return Array.from(expectedMoves);
  }

  isPuzzleSolved(moveIndex) {
    // Puzzle is solved if we've reached the end of any active path
    return this.activePaths.some(path => moveIndex >= path.length);
  }

  reset() {
    this.currentMoveIndex = 0;
    this.activePaths = [...this.solutionPaths];
  }
}
```

### 3. Internationalization (i18n) System

#### Language Configuration
```html
<div class="chess-puzzle"
     data-fen="..."
     data-solution="..."
     data-lang="de">  <!-- German -->
</div>
```

Supported languages (initial release):
- `en` - English (default)
- `de` - German (Deutsch)

#### Translation Structure
```javascript
class I18n {
  constructor(lang = 'en') {
    this.lang = lang;
    this.translations = {
      en: {
        correct: 'Correct! Keep going...',
        wrong: 'Try again!',
        solved: 'Puzzle solved! Well done!',
        stockfish_counter: 'Stockfish responds: {move}. Try again!',
        loading: 'Thinking...',
        invalid_move: 'Invalid move',
        your_turn: 'Your turn',
        waiting: 'Waiting for opponent...'
      },
      de: {
        correct: 'Richtig! Weiter so...',
        wrong: 'Versuche es noch einmal!',
        solved: 'Puzzle gelöst! Gut gemacht!',
        stockfish_counter: 'Stockfish antwortet: {move}. Versuche es noch einmal!',
        loading: 'Denke nach...',
        invalid_move: 'Ungültiger Zug',
        your_turn: 'Du bist am Zug',
        waiting: 'Warte auf Gegner...'
      }
    };
  }

  t(key, params = {}) {
    // Get translation for current language, fallback to English
    const translation = this.translations[this.lang]?.[key]
                     || this.translations.en[key]
                     || key;

    // Replace placeholders like {move} with actual values
    return translation.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] || match;
    });
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.lang = lang;
      return true;
    }
    console.warn(`Language '${lang}' not supported, falling back to English`);
    return false;
  }

  addLanguage(lang, translations) {
    this.translations[lang] = translations;
  }

  getSupportedLanguages() {
    return Object.keys(this.translations);
  }
}
```

#### Usage in Widget
```javascript
class ChessWidget {
  constructor(element) {
    // ... existing initialization

    // Initialize i18n
    const lang = element.getAttribute('data-lang') || 'en';
    this.i18n = new I18n(lang);
  }

  showFeedback(type, params = {}) {
    const message = this.i18n.t(type, params);
    // Display message in status element
    this.statusElement.textContent = message;
  }
}

// Example usage:
this.showFeedback('correct');
this.showFeedback('stockfish_counter', { move: 'Qh5+' });
```

#### Extending with Custom Languages
Users can add custom languages via JavaScript:

```javascript
// Add Spanish support
ChessWidget.addLanguage('es', {
  correct: '¡Correcto! Sigue así...',
  wrong: '¡Inténtalo de nuevo!',
  solved: '¡Puzzle resuelto! ¡Bien hecho!',
  stockfish_counter: 'Stockfish responde: {move}. ¡Inténtalo de nuevo!',
  loading: 'Pensando...',
  invalid_move: 'Movimiento inválido',
  your_turn: 'Tu turno',
  waiting: 'Esperando al oponente...'
});
```

### 4. Stockfish API Integration

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

### 5. Caching System

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

### 6. Visual Feedback

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

### 7. Integration with Existing Move Validation

Modify `onMove()` in widget-solution.js to use the SolutionValidator:

```javascript
async onMove(orig, dest) {
  const move = this.chess.move({ from: orig, to: dest });

  if (!move) {
    // Invalid move - reject
    this.updateBoard();
    this.showFeedback('invalid_move');
    return;
  }

  // Check if this is the expected solution move using SolutionValidator
  if (this.solutionValidator) {
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
      'src/widget-i18n.js',
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
Add sections:

```markdown
### Alternative Solutions

Puzzles can accept multiple solution paths using the pipe `|` separator:

```html
<!-- Multiple ways to achieve mate -->
<div class="chess-puzzle"
     data-fen="..."
     data-solution="e2e4,e7e5,g1f3|e2e4,e7e5,f1c4">
     <!-- Both Nf3 and Bc4 are correct after e2e4 e7e5 -->
</div>
```

### Internationalization

Set the widget language with `data-lang`:

```html
<div class="chess-puzzle"
     data-fen="..."
     data-solution="..."
     data-lang="de">  <!-- German -->
</div>
```

Supported languages: English (en), German (de)

### Stockfish Integration (Optional)

Enable Stockfish-powered feedback for incorrect moves:

```html
<div class="chess-puzzle"
     data-fen="rnbqkb1r/ppp2ppp/5n2/3pp3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4"
     data-solution="f1c4,d5c4,d1f3,e8e7"
     data-lang="en"
     data-stockfish-enabled="true"
     data-stockfish-depth="12">
</div>
```

When enabled, incorrect moves will trigger Stockfish to show why the move was wrong.
```

### CLAUDE.md
Update project architecture section to reflect modular structure.

## Future Enhancements

### Puzzle Features
1. **Smart branching hints**: Show visual hint when multiple solutions are available
2. **Solution path statistics**: Track which alternative paths users take most often
3. **Progressive difficulty**: Reduce alternative solutions for harder puzzles

### Internationalization
1. **Additional languages**: French, Spanish, Italian, Russian, Chinese
2. **RTL support**: Right-to-left languages (Arabic, Hebrew)
3. **Community translations**: Allow users to submit translations
4. **Dynamic language switching**: Change language without reloading widget

### Stockfish Features
1. **Multiple counter-moves**: Show top 3 moves from Stockfish
2. **Evaluation bar**: Show position evaluation
3. **Hint system**: Use Stockfish to provide hints
4. **Difficulty adjustment**: Adjust Stockfish depth based on puzzle difficulty
5. **Offline mode**: Bundle Stockfish WASM for offline use

## Success Metrics

### Feature Adoption
- Alternative solutions usage: % of puzzles with multiple paths
- Internationalization: % of non-English language usage
- Stockfish integration: % of puzzles using Stockfish

### Performance
- Cache hit rate: Should be >80% for repeated attempts
- Counter-move response: Shown within 2 seconds
- File size: Keep total under 200KB
- API error rate: <1% failures

### User Experience
- Alternative solution success rate: Users find correct path
- Language fallback rate: How often users rely on English fallback
- Feedback clarity: Positive user feedback on messages
