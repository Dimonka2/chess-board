# Wrong Move Retention Specification

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2025-10-27

## Overview

This specification defines the optional wrong move retention feature that allows puzzles to keep incorrect moves visible on the board until manually reverted, providing users with additional time to analyze their mistakes.

## Goals

1. **Pause on Wrong Moves**: Keep wrong moves visible instead of auto-reverting
2. **Visual Feedback**: Add question mark indicator on wrong move square
3. **Manual Revert**: Provide user control to undo wrong moves
4. **Stockfish Integration**: Show counter-move with arrows when enabled
5. **Flexible UX**: Support both auto-revert (default) and manual-revert modes

## User Experience Flow

### Default Behavior (Auto-Revert)

```
User makes wrong move
  ↓
Show "Wrong!" feedback
  ↓
Undo move immediately
  ↓
Board resets to previous position
  ↓
User can try again
```

### Retained Behavior (Manual-Revert)

```
User makes wrong move
  ↓
[Stockfish enabled] Request counter-move
  ↓
Animate counter-move on board
  ↓
Show question mark on user's wrong move square
  ↓
Show arrows: red (counter) + yellow (user's wrong move)
  ↓
Disable board interaction
  ↓
Display "Click 'Undo' to try again" message
  ↓
[User clicks Undo button]
  ↓
Undo both moves (user + counter)
  ↓
Remove visual indicators
  ↓
Re-enable board, user can try again
```

## Visual Indicators

### Question Mark Overlay

**Purpose:** Clearly mark the square where user made wrong move

**Design Specifications:**

```css
.wrong-move-indicator {
  /* Positioning */
  position: absolute;
  z-index: 100;
  pointer-events: none;

  /* Size & Shape */
  width: 50px;
  height: 50px;
  border-radius: 50%;

  /* Appearance */
  background: rgba(255, 193, 7, 0.8);  /* Amber/warning color */
  color: white;
  font-size: 32px;
  font-weight: bold;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);

  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Content:** Single character "?"

**Positioning:** Centered on the destination square of wrong move

**Lifecycle:**
- Created when wrong move is validated
- Removed when user clicks "Undo" button
- Removed when puzzle is reset

### Arrow Indicators (Stockfish Mode)

When Stockfish is enabled, two arrows are displayed:

| Arrow | Color | Purpose | From | To |
|-------|-------|---------|------|-----|
| Counter-move | Red | Show Stockfish's response | Counter-move origin | Counter-move destination |
| Wrong move | Yellow | Highlight user's mistake | Wrong move origin | Wrong move destination |

**Arrow Configuration:**
```javascript
drawable: {
  enabled: false,
  visible: true,
  autoShapes: [
    {
      orig: counterMoveFrom,
      dest: counterMoveTo,
      brush: 'red'
    },
    {
      orig: wrongMoveFrom,
      dest: wrongMoveTo,
      brush: 'yellow',
      modifiers: { hilite: true }
    }
  ]
}
```

## State Management

### Wrong Move Data Structure

```javascript
this.wrongMoveData = {
  userMove: {
    from: 'e2',
    to: 'e5',
    san: 'e5',
    promotion: null
  },
  counterMove: 'e7e5',           // UCI notation
  fenBeforeWrongMove: '...',     // FEN string
  timestamp: 1234567890
};
```

### State Tracking

- `wrongMoveData` is `null` when no wrong move is retained
- `wrongMoveData` is populated when wrong move occurs in retention mode
- `wrongMoveData` is cleared when move is reverted or puzzle is reset

## API Methods

### Public Methods

```javascript
// Revert the current wrong move
widget.revertWrongMove()

// Check if wrong move is currently retained
widget.hasWrongMove() // Returns: boolean

// Get wrong move data
widget.getWrongMoveData() // Returns: WrongMoveData | null
```

### Internal Methods

```javascript
// Store wrong move data (called during validation)
widget.storeWrongMove(userMove, counterMove, fen)

// Clear wrong move data
widget.clearWrongMove()

// Show wrong move with retention
widget.showStockfishCounterMoveRetained(counterMoveData)

// Add question mark indicator
widget.addQuestionMarkIndicator(square)

// Remove question mark indicator
widget.removeQuestionMarkIndicator()

// Find square element by coordinates
widget.findSquareByCoordinates(square)
```

## Implementation Details

### Module Updates

#### `widget-core.js`

**Constructor:**
```javascript
constructor(element) {
  // ... existing code

  // Wrong move retention state
  this.wrongMoveData = null;
  this.questionMarkIndicator = null;
}
```

**Configuration:**
```javascript
parseConfiguration(element) {
  // ... existing code

  this.retainWrongMoves = parseBoolean(element.dataset.retainWrongMoves, false);
}
```

#### `widget-solution.js`

**Wrong Move Handler Update:**
```javascript
ChessWidget.prototype.handleWrongMoveWithStockfish = async function() {
  this.showFeedback('loading');
  const currentFen = this.chess.fen();

  // Store wrong move
  const wrongMove = this.chess.history({ verbose: true }).pop();
  this.wrongMoveData = {
    userMove: wrongMove,
    fenBeforeWrongMove: this.chess.fen()
  };

  try {
    // Get counter-move from cache or API
    let counterMoveData = await this.getCounterMove(currentFen);

    if (counterMoveData?.move) {
      this.wrongMoveData.counterMove = counterMoveData.move;

      // Use retention or auto-revert based on config
      if (this.retainWrongMoves) {
        await this.showStockfishCounterMoveRetained(counterMoveData);
      } else {
        await this.showStockfishCounterMove(counterMoveData);
      }
    }
  } catch (error) {
    this.handleWrongMoveBasic();
  }
};
```

**Retained Counter-Move Handler:**
```javascript
ChessWidget.prototype.showStockfishCounterMoveRetained = async function(counterMoveData) {
  const move = counterMoveData.move;
  const [from, to, promotion] = this.parseUCIMove(move);

  // Make counter-move
  const chessMove = this.chess.move({ from, to, promotion });

  if (chessMove) {
    // Animate counter-move
    this.chessground.move(from, to);

    // Update board with disabled interaction
    this.updateBoardForRetainedWrongMove(from, to);

    // Add question mark indicator
    this.addQuestionMarkIndicator(this.wrongMoveData.userMove.to);

    // Show feedback with retention message
    this.showFeedback('stockfish_counter_retained', { move });

    // Show undo button
    if (this.revertButton) {
      this.revertButton.style.display = 'inline-block';
    }
  }
};
```

**Revert Method:**
```javascript
ChessWidget.prototype.revertWrongMove = function() {
  if (!this.wrongMoveData) {
    console.warn('No wrong move to revert');
    return;
  }

  // Count moves to undo
  const movesToUndo = this.wrongMoveData.counterMove ? 2 : 1;

  // Undo moves
  for (let i = 0; i < movesToUndo; i++) {
    this.chess.undo();
  }

  // Clear wrong move data
  this.wrongMoveData = null;

  // Remove visual indicators
  this.removeQuestionMarkIndicator();

  // Hide undo button
  if (this.revertButton) {
    this.revertButton.style.display = 'none';
  }

  // Transition back to in_progress state
  this.puzzleState.setState('in_progress');

  // Reset board
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
      autoShapes: []
    }
  });

  // Show try again message
  this.showFeedback('try_again');
};
```

#### `widget-board.js`

**Control Creation:**
```javascript
ChessWidget.prototype.createBoardContainer = function() {
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
```

**Control Event Handlers:**
```javascript
ChessWidget.prototype.createControls = function() {
  this.resetButton.addEventListener('click', () => this.reset());

  if (this.retainWrongMoves && this.revertButton) {
    this.revertButton.addEventListener('click', () => this.revertWrongMove());
  }
};
```

**Reset Updates:**
```javascript
ChessWidget.prototype.reset = function() {
  // Clear wrong move data
  this.wrongMoveData = null;
  this.removeQuestionMarkIndicator();

  // Hide revert button
  if (this.revertButton) {
    this.revertButton.style.display = 'none';
  }

  // ... existing reset logic
};
```

#### `widget-i18n.js`

**New Translations:**
```javascript
en: {
  // ... existing
  stockfish_counter_retained: "Opponent plays {move}. Click 'Undo' to try again.",
  try_again: "Try again!",
  undo_wrong_move: "Undo Wrong Move"
},

de: {
  // ... existing
  stockfish_counter_retained: "Gegner spielt {move}. Klicke 'Rückgängig' um es erneut zu versuchen.",
  try_again: "Versuche es erneut!",
  undo_wrong_move: "Falschen Zug rückgängig machen"
}
```

## CSS Requirements

```css
/* Wrong move indicator */
.wrong-move-indicator {
  position: absolute;
  background: rgba(255, 193, 7, 0.8);
  color: white;
  font-size: 32px;
  font-weight: bold;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 100;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: opacity 0.3s ease;
}

/* Revert button styling */
.chess-widget-revert {
  background-color: #f0ad4e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.chess-widget-revert:hover {
  background-color: #ec971f;
}

.chess-widget-revert:active {
  background-color: #d58512;
}
```

## Configuration

### HTML Example

```html
<!-- Example 1: Retained wrong moves with Stockfish -->
<div class="chess-puzzle"
     data-fen="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
     data-solution="f3e5,f6e4,e1g1"
     data-retain-wrong-moves="true"
     data-stockfish-enabled="true"
     data-stockfish-show-arrow="true">
</div>

<!-- Example 2: Retained wrong moves without Stockfish -->
<div class="chess-puzzle"
     data-fen="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
     data-solution="f3e5,f6e4,e1g1"
     data-retain-wrong-moves="true">
</div>
```

## Edge Cases

### Scenario: User Clicks Reset During Retained Wrong Move

**Expected Behavior:**
- Clear `wrongMoveData`
- Remove question mark indicator
- Hide revert button
- Reset puzzle to initial state
- Transition to `not_started` state

### Scenario: Multiple Rapid Wrong Moves

**Expected Behavior:**
- Only most recent wrong move is retained
- Previous wrong move data is overwritten
- Only one question mark indicator visible

### Scenario: Wrong Move Without Stockfish

**Expected Behavior:**
- Store wrong move data
- Show question mark indicator
- No counter-move animation
- Show "Wrong move!" message
- Revert button available
- Only user's move is undone (1 move instead of 2)

### Scenario: Stockfish API Failure

**Expected Behavior:**
- Fallback to basic wrong move handling
- If `retainWrongMoves=true`, still show question mark
- No counter-move shown
- Graceful degradation

## Testing Requirements

### Unit Tests

- [ ] `storeWrongMove()` stores data correctly
- [ ] `revertWrongMove()` undos correct number of moves
- [ ] `hasWrongMove()` returns correct boolean
- [ ] Question mark positioning calculation
- [ ] Revert button show/hide logic

### Integration Tests

- [ ] Retained wrong move with Stockfish enabled
- [ ] Retained wrong move without Stockfish
- [ ] Revert button click functionality
- [ ] Reset clears wrong move data
- [ ] Question mark appears/disappears correctly
- [ ] Arrows display correctly
- [ ] Works with board orientation changes
- [ ] Works with different board sizes

### Visual Tests

- [ ] Question mark centers on square
- [ ] Question mark scales with board size
- [ ] Arrows don't overlap question mark
- [ ] Question mark visible on all piece themes
- [ ] Revert button styling matches design

## Accessibility

- **Keyboard Support**: Undo button accessible via keyboard
- **Screen Readers**: Announce wrong move and revert option
- **Focus Management**: Focus revert button after wrong move (optional)

## Performance

- **Memory**: Wrong move data ~100 bytes per instance
- **DOM Operations**: 1 element added/removed per wrong move
- **No Performance Impact**: Feature is opt-in

## Compatibility

- **Backward Compatible**: Default behavior unchanged
- **Progressive Enhancement**: Works with/without Stockfish
- **Browser Support**: Same as base widget

## Future Enhancements

- Keyboard shortcut for undo (e.g., Ctrl+Z)
- Hint system (show correct move after N wrong attempts)
- Wrong move counter/statistics
- Animation for question mark appearance
- Custom indicator styles via configuration

## References

- Related: [External State Management Specification](./external-state-spec.md)
- Related: [Roadmap](./roadmap.md)
- Chessground Drawable API: https://github.com/lichess-org/chessground
