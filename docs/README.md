# Chess Widget Documentation

This directory contains technical specifications and planning documents for the Chess Widget library.

## Documents

### Specifications

| Document | Description | Status |
|----------|-------------|--------|
| [External State Management Specification](./external-state-spec.md) | Technical specification for external state tracking and event system | Draft |
| [Wrong Move Retention Specification](./wrong-move-retention-spec.md) | Technical specification for optional wrong move retention feature | Draft |

### Planning

| Document | Description | Status |
|----------|-------------|--------|
| [Roadmap](./roadmap.md) | Implementation roadmap with phases, tasks, and progress tracking | Planning |

## Feature Overview

### External State Management

**Purpose:** Enable external applications to track puzzle progress and respond to state changes through an event-driven API.

**Key Features:**
- Finite state machine with 4 states: `not_started`, `in_progress`, `wrong_move`, `solved`
- Event system for state change notifications
- State history tracking
- Public API for state queries

**Use Cases:**
- Analytics tracking (puzzle completion rates, time spent)
- Learning management systems (student progress tracking)
- Gamification (badges, achievements, leaderboards)
- Custom UI overlays (progress bars, celebration animations)

**Documentation:** [External State Specification](./external-state-spec.md)

### Wrong Move Retention

**Purpose:** Optionally keep wrong moves visible on the board for analysis instead of automatically reverting them.

**Key Features:**
- Optional retention mode (default: auto-revert)
- Manual revert functionality via button or API
- Question mark visual indicator on wrong move square
- Integration with Stockfish counter-move system
- Dual arrow display (wrong move + counter-move)

**Use Cases:**
- Educational platforms (allow students to analyze mistakes)
- Training applications (deliberate practice on errors)
- Custom difficulty modes (easier mode retains moves)
- Hint systems (reveal correct move after wrong attempt)

**Documentation:** [Wrong Move Retention Specification](./wrong-move-retention-spec.md)

## Implementation Status

**Current Phase:** Not Started
**Overall Progress:** 0%

See [Roadmap](./roadmap.md) for detailed progress tracking.

## Quick Start for Contributors

### Understanding the Architecture

1. **Start with:** [External State Specification](./external-state-spec.md)
   - Read the state machine design
   - Understand event types and payloads
   - Review integration points

2. **Then read:** [Wrong Move Retention Specification](./wrong-move-retention-spec.md)
   - Understand retention vs auto-revert modes
   - Review visual indicator design
   - Study the revert mechanism

3. **Follow:** [Roadmap](./roadmap.md)
   - Check current phase
   - Review task assignments
   - Update progress as you work

### Development Workflow

1. **Choose a Phase:** Select from [Roadmap](./roadmap.md)
2. **Review Specs:** Read relevant sections from specifications
3. **Implement Tasks:** Complete tasks from roadmap checklist
4. **Update Progress:** Check off completed items in roadmap
5. **Test:** Follow testing checklist for the phase
6. **Document:** Update API docs and examples

### File Locations

| Component | File Path | Purpose |
|-----------|-----------|---------|
| State Management | `src/widget-state.js` | New module for state machine |
| Core Integration | `src/widget-core.js` | Widget initialization and config |
| Move Validation | `src/widget-solution.js` | State transitions and wrong move handling |
| Board Controls | `src/widget-board.js` | UI controls and reset functionality |
| Translations | `src/widget-i18n.js` | New messages for retention mode |
| Build System | `build.js` | Module concatenation order |

## API Preview

### State Management

```javascript
// Access widget instance
const widget = document.querySelector('.chess-puzzle').widgetState;

// Get current state
const state = widget.getState(); // 'not_started' | 'in_progress' | 'wrong_move' | 'solved'

// Listen to state changes
widget.on('stateChange', ({ previous, current, metadata }) => {
  console.log(`State changed: ${previous} → ${current}`);
});

// Listen to specific events
widget.on('wrongMove', ({ move }) => {
  console.log(`Wrong move: ${move}`);
});

widget.on('puzzleSolved', () => {
  console.log('Puzzle completed!');
});

// View state history
const history = widget.getStateHistory();
```

### Wrong Move Retention

```javascript
// Access widget instance
const widget = document.querySelector('.chess-puzzle').widgetInstance;

// Check if wrong move is retained
if (widget.hasWrongMove()) {
  // Get wrong move data
  const data = widget.getWrongMoveData();
  console.log('Wrong move:', data.userMove);
  console.log('Counter-move:', data.counterMove);

  // Manually revert the wrong move
  widget.revertWrongMove();
}
```

### HTML Configuration

```html
<!-- Enable external state events -->
<div class="chess-puzzle"
     data-fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
     data-solution="e2e4,e7e5,g1f3"
     data-expose-state-events="true">
</div>

<!-- Enable wrong move retention -->
<div class="chess-puzzle"
     data-fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
     data-solution="e2e4,e7e5,g1f3"
     data-retain-wrong-moves="true"
     data-stockfish-enabled="true"
     data-stockfish-show-arrow="true">
</div>

<!-- Enable both features -->
<div class="chess-puzzle"
     data-fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
     data-solution="e2e4,e7e5,g1f3"
     data-expose-state-events="true"
     data-retain-wrong-moves="true"
     data-stockfish-enabled="true">
</div>
```

## Architecture Diagrams

### State Machine Flow

```
┌─────────────┐
│ not_started │ (Initial)
└─────┬───────┘
      │ First move
      ▼
┌─────────────┐     Wrong move    ┌─────────────┐
│ in_progress ├──────────────────►│ wrong_move  │
└─────┬───────┘                   └──────┬──────┘
      │                                  │
      │                              Revert
      │                                  │
      │ Last move                        │
      │ completed                        │
      ▼                                  ▼
┌─────────────┐                   ┌─────────────┐
│   solved    │                   │ in_progress │
└─────────────┘                   └─────────────┘
```

### Wrong Move Retention Flow

```
User makes wrong move
        │
        ▼
┌───────────────────┐
│  Validate move    │
└────────┬──────────┘
         │
    ┌────┴────┐
    │ Correct │ Wrong
    ▼         ▼
Continue  ┌────────────────────┐
Puzzle    │ Store wrong move   │
          │ data               │
          └─────────┬──────────┘
                    │
         ┌──────────┴───────────┐
         │ Stockfish enabled?   │
         └──┬────────────────┬──┘
           Yes              No
            │                │
            ▼                ▼
    ┌────────────────┐  ┌────────────────┐
    │ Get counter-   │  │ Show question  │
    │ move from API  │  │ mark only      │
    └────────┬───────┘  └────────┬───────┘
             │                   │
             ▼                   │
    ┌────────────────┐           │
    │ Animate counter│           │
    │ Show arrows    │           │
    │ Show question  │           │
    │ mark           │           │
    └────────┬───────┘           │
             │                   │
             └────────┬──────────┘
                      │
                      ▼
             ┌────────────────┐
             │ Disable board  │
             │ Show revert    │
             │ button         │
             └────────┬───────┘
                      │
                      ▼
             ┌────────────────┐
             │ Wait for user  │
             │ to click Undo  │
             └────────┬───────┘
                      │
                      ▼
             ┌────────────────┐
             │ Undo moves     │
             │ Clear visuals  │
             │ Re-enable board│
             └────────────────┘
```

## Contributing

When implementing features:

1. **Follow Specifications:** Adhere to design decisions in spec documents
2. **Update Roadmap:** Check off completed tasks as you finish them
3. **Write Tests:** Add tests according to phase testing checklists
4. **Document Changes:** Update API docs and examples
5. **Maintain Compatibility:** Ensure backward compatibility with existing widgets

## Testing Strategy

### Phase-Based Testing

Each phase includes:
- **Unit Tests:** Test individual functions and methods
- **Integration Tests:** Test feature interactions
- **Visual Tests:** Verify UI appearance and behavior
- **Edge Case Tests:** Handle unusual scenarios

### Continuous Testing

- Run tests after each task completion
- Test across multiple browsers before phase completion
- Verify backward compatibility continuously

## Release Checklist

Before marking implementation complete:

- [ ] All roadmap phases completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Demo page updated with examples
- [ ] API documentation complete
- [ ] README.md updated
- [ ] CLAUDE.md updated
- [ ] Cross-browser testing complete
- [ ] Performance benchmarks acceptable
- [ ] No breaking changes to existing API

## Questions?

For questions about:
- **Architecture decisions:** See specification documents
- **Implementation progress:** See roadmap
- **API usage:** See API preview above or specification documents
- **Contributing:** Follow roadmap phases

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-27 | Initial documentation structure |

---

**Related Documents:**
- [Project README](../README.md) - User-facing documentation
- [CLAUDE.md](../CLAUDE.md) - Project architecture and guidelines
