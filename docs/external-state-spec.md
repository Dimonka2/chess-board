# External State Management Specification

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2025-10-27

## Overview

This specification defines the implementation of external state management for the Chess Widget library, enabling applications to track puzzle progress, respond to state changes through events, and optionally retain wrong moves for manual correction.

## Goals

1. **External State Tracking**: Expose puzzle state externally with clear state definitions
2. **Event System**: Provide event-driven architecture for state change notifications
3. **Wrong Move Retention**: Optionally keep wrong moves visible with manual revert capability
4. **Visual Feedback**: Add question mark indicators for wrong moves
5. **Backward Compatibility**: Maintain full compatibility with existing widget implementations

## State Definitions

### State Machine

The puzzle state follows a finite state machine with four distinct states:

```
not_started → in_progress → solved
                ↓
           wrong_move
                ↓
           in_progress
```

### States

| State | Description | Entry Condition | Exit Condition |
|-------|-------------|----------------|----------------|
| `not_started` | Initial state, no user moves made | Widget initialization | User makes first move |
| `in_progress` | User has made at least one correct move | First correct move OR revert from wrong_move | Wrong move OR puzzle solved |
| `wrong_move` | User made an incorrect move (transitional) | Incorrect move validation | Auto-revert OR manual revert |
| `solved` | Puzzle completed successfully | All solution moves completed | Reset button |

### State Metadata

Each state transition includes metadata:

```typescript
interface StateTransition {
  previous: State;
  current: State;
  timestamp: number;
  metadata: {
    move?: string;        // Move that triggered transition (UCI notation)
    firstMove?: object;   // First move data (in_progress only)
    wrongMove?: string;   // Wrong move data (wrong_move only)
  };
}
```

## Event System

### Event Types

| Event Name | Trigger | Data Payload |
|------------|---------|--------------|
| `stateChange` | Any state transition | `{ previous, current, metadata }` |
| `moveAttempted` | Before move validation | `{ from, to }` |
| `correctMove` | Correct move validated | `{ move }` |
| `wrongMove` | Wrong move detected | `{ move }` |
| `puzzleSolved` | All moves completed | `{}` |
| `puzzleReset` | Reset button clicked | `{}` |

### Event API

```javascript
// Subscribe to events
widget.on(eventName, callback);

// Unsubscribe from events
widget.off(eventName, callback);

// Get current state
widget.getState(); // Returns: 'not_started' | 'in_progress' | 'wrong_move' | 'solved'

// Get state history
widget.getStateHistory(); // Returns: StateTransition[]
```

### Usage Example

```javascript
const puzzleElement = document.querySelector('.chess-puzzle');
const widget = puzzleElement.widgetState;

// Listen to all state changes
widget.on('stateChange', ({ previous, current, metadata }) => {
  console.log(`State: ${previous} → ${current}`);

  if (current === 'solved') {
    // Track completion, show celebration, etc.
    analytics.track('puzzle_solved');
  }
});

// Listen to specific events
widget.on('wrongMove', ({ move }) => {
  console.warn(`Wrong move: ${move}`);
  // Custom error handling, sound effects, etc.
});

widget.on('correctMove', ({ move }) => {
  console.log(`Correct: ${move}`);
  // Progress tracking, encouragement messages, etc.
});
```

## Architecture

### New Module: `widget-state.js`

**Location:** `src/widget-state.js`

**Responsibilities:**
- State machine management
- Event listener registration/deregistration
- Event emission
- State history tracking

**Class Definition:**

```javascript
class PuzzleState {
  constructor() {
    this.currentState = 'not_started';
    this.eventListeners = {};
    this.stateHistory = [];
  }

  // State management
  setState(newState, metadata = {})
  getState()
  getStateHistory()

  // Event system
  on(eventName, callback)
  off(eventName, callback)
  emitEvent(eventName, data)
}
```

### Integration Points

#### `widget-core.js`

**Constructor Updates:**
```javascript
constructor(element) {
  // ... existing code

  // Initialize state manager
  this.puzzleState = new PuzzleState();

  // Expose state to external consumers
  element.widgetState = this.puzzleState;
  element.widgetInstance = this; // Full widget access
}
```

**Configuration Updates:**
```javascript
parseConfiguration(element) {
  // ... existing code

  // State management configuration
  this.exposeStateEvents = parseBoolean(element.dataset.exposeStateEvents, true);
  this.retainWrongMoves = parseBoolean(element.dataset.retainWrongMoves, false);
}
```

#### `widget-solution.js`

**State Transitions in Move Validation:**

```javascript
ChessWidget.prototype.onMove = function(orig, dest) {
  // Emit move attempted
  this.puzzleState.emitEvent('moveAttempted', { from: orig, to: dest });

  // ... move validation logic

  // Transition from not_started to in_progress
  if (this.puzzleState.getState() === 'not_started') {
    this.puzzleState.setState('in_progress', { firstMove: move });
  }

  // Handle correct/wrong moves with state transitions
  if (isCorrect) {
    this.puzzleState.emitEvent('correctMove', { move: moveNotation });
    // ... existing logic

    if (isPuzzleSolved) {
      this.puzzleState.setState('solved');
      this.puzzleState.emitEvent('puzzleSolved');
    }
  } else {
    this.puzzleState.setState('wrong_move', { wrongMove: moveNotation });
    this.puzzleState.emitEvent('wrongMove', { move: moveNotation });
  }
};
```

### Build System Updates

**Update `build.js`:**

Add `widget-state.js` to module concatenation order:

```javascript
const widgetModules = [
  'widget-utils.js',
  'widget-i18n.js',
  'widget-solution-validator.js',
  'widget-cache.js',
  'widget-stockfish.js',
  'widget-state.js',        // NEW
  'widget-core.js',
  'widget-board.js',
  'widget-solution.js',
  'chess-widget.js'
];
```

## Configuration

### HTML Data Attributes

```html
<div class="chess-puzzle"
     data-fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
     data-solution="e2e4,e7e5,g1f3"

     <!-- State Management -->
     data-expose-state-events="true"    <!-- Enable external events (default: true) -->
     data-retain-wrong-moves="false"    <!-- Keep wrong moves visible (default: false) -->
>
</div>
```

### Configuration Options

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-expose-state-events` | boolean | `true` | Enable external state event system |
| `data-retain-wrong-moves` | boolean | `false` | Keep wrong moves visible until manual revert |

## Compatibility

### Backward Compatibility

- **No Breaking Changes**: All changes are additive
- **Opt-in Features**: State events enabled by default but can be disabled
- **Default Behavior**: Wrong moves auto-revert (existing behavior)
- **Progressive Enhancement**: Widgets work identically if state API is not used

### Browser Support

- Modern browsers with ES6 support
- No additional browser requirements beyond existing widget

## Testing Requirements

### Unit Tests

- [ ] State machine transitions work correctly
- [ ] Events fire in correct order
- [ ] Multiple event listeners receive events
- [ ] Event unsubscription works
- [ ] State history tracks correctly

### Integration Tests

- [ ] State transitions during puzzle solving
- [ ] State persists across board orientations
- [ ] State resets correctly
- [ ] Works with alternative solutions
- [ ] Works with Stockfish integration
- [ ] Works with premove feature

### Edge Cases

- [ ] Multiple widgets on same page (isolated states)
- [ ] Rapid move attempts
- [ ] Reset during wrong_move state
- [ ] Event listener memory leaks (unsubscribe)

## Performance Considerations

- **Event Emission**: O(n) where n = number of listeners (typically < 10)
- **State History**: Unbounded growth - consider max size limit or pruning
- **Memory**: Minimal overhead (~1KB per widget instance)

## Security Considerations

- No external data injection
- Events are read-only notifications
- No XSS risk (no HTML in event data)

## Future Enhancements

- State persistence (localStorage)
- Undo/redo history
- Time tracking per state
- Analytics integration helpers
- State machine visualization (dev mode)

## References

- Related: [Wrong Move Retention Specification](./wrong-move-retention-spec.md)
- Related: [Roadmap](./roadmap.md)
