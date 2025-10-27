# External State Management & Wrong Move Retention - Roadmap

**Version:** 1.0
**Status:** Planning
**Start Date:** 2025-10-27
**Target Completion:** TBD

## Overview

This roadmap tracks the implementation of external state management and wrong move retention features for the Chess Widget library. The implementation is divided into 6 phases with clear deliverables and acceptance criteria.

## Project Status

**Current Phase:** Not Started
**Overall Progress:** 0%

| Phase | Status | Progress | Estimated Hours | Actual Hours |
|-------|--------|----------|-----------------|--------------|
| Phase 1: State Management System | Not Started | 0% | 3-4 | - |
| Phase 2: Wrong Move Retention | Not Started | 0% | 3-4 | - |
| Phase 3: Visual Indicators | Not Started | 0% | 2-3 | - |
| Phase 4: Internationalization | Not Started | 0% | 1 | - |
| Phase 5: API & Documentation | Not Started | 0% | 2 | - |
| Phase 6: Testing & Integration | Not Started | 0% | 2-3 | - |

**Total Estimated Time:** 13-17 hours

---

## Phase 1: State Management System

**Status:** Not Started
**Priority:** High
**Dependencies:** None
**Estimated Time:** 3-4 hours

### Objectives

- Implement PuzzleState class with state machine logic
- Integrate state tracking into widget lifecycle
- Implement event system for state changes
- Expose state API to external consumers

### Tasks

- [ ] **1.1** Create `src/widget-state.js` module
  - [ ] Define PuzzleState class
  - [ ] Implement state machine (not_started → in_progress → wrong_move/solved)
  - [ ] Implement event listener system (on/off/emit)
  - [ ] Implement state history tracking
  - [ ] Add metadata support for state transitions

- [ ] **1.2** Update `src/widget-core.js`
  - [ ] Initialize PuzzleState in constructor
  - [ ] Add configuration parsing for `data-expose-state-events`
  - [ ] Expose state to element (`element.widgetState`)
  - [ ] Expose widget instance (`element.widgetInstance`)

- [ ] **1.3** Update `src/widget-solution.js`
  - [ ] Emit `moveAttempted` event before validation
  - [ ] Transition to `in_progress` on first move
  - [ ] Emit `correctMove` event on valid moves
  - [ ] Emit `wrongMove` event on invalid moves
  - [ ] Transition to `solved` on puzzle completion
  - [ ] Emit `puzzleSolved` event

- [ ] **1.4** Update `src/widget-board.js`
  - [ ] Emit `puzzleReset` event on reset
  - [ ] Reset state to `not_started` on puzzle reset

- [ ] **1.5** Update `build.js`
  - [ ] Add `widget-state.js` to module concatenation order
  - [ ] Verify build produces correct output

### Acceptance Criteria

- [ ] PuzzleState class correctly manages state transitions
- [ ] Events fire at appropriate times during puzzle solving
- [ ] Multiple event listeners can be registered for same event
- [ ] Event unsubscription works correctly
- [ ] State history tracks all transitions with metadata
- [ ] External code can access state via `element.widgetState`
- [ ] Build system includes new module in correct order

### Testing Checklist

- [ ] Unit test: State transitions (not_started → in_progress → solved)
- [ ] Unit test: State transitions with wrong moves
- [ ] Unit test: Event registration and emission
- [ ] Unit test: Event unsubscription
- [ ] Integration test: State tracking during complete puzzle solve
- [ ] Integration test: Multiple widgets have isolated states

### Deliverables

- `src/widget-state.js` - New state management module
- Updated `src/widget-core.js` - State initialization
- Updated `src/widget-solution.js` - State transitions
- Updated `src/widget-board.js` - Reset handling
- Updated `build.js` - Build configuration

---

## Phase 2: Wrong Move Retention

**Status:** Not Started
**Priority:** High
**Dependencies:** Phase 1 (for state transitions)
**Estimated Time:** 3-4 hours

### Objectives

- Implement optional wrong move retention mode
- Add manual revert functionality
- Integrate with Stockfish counter-move system
- Add UI controls for reverting moves

### Tasks

- [ ] **2.1** Update `src/widget-core.js`
  - [ ] Add `wrongMoveData` property to store wrong move state
  - [ ] Add `questionMarkIndicator` property for DOM reference
  - [ ] Parse `data-retain-wrong-moves` configuration attribute

- [ ] **2.2** Update `src/widget-solution.js`
  - [ ] Modify `handleWrongMoveWithStockfish()` to store wrong move data
  - [ ] Create `showStockfishCounterMoveRetained()` method
  - [ ] Implement conditional behavior (retain vs auto-revert)
  - [ ] Create `revertWrongMove()` public method
  - [ ] Create `hasWrongMove()` public method
  - [ ] Update board config to disable moves during retention
  - [ ] Add yellow arrow for user's wrong move
  - [ ] Implement 2-move undo (user + counter) logic

- [ ] **2.3** Update `src/widget-board.js`
  - [ ] Add "Undo Wrong Move" button to controls (conditional)
  - [ ] Add click handler for revert button
  - [ ] Update `reset()` to clear wrong move data
  - [ ] Show/hide revert button based on state

- [ ] **2.4** Wrong Move Handling
  - [ ] Handle wrong move without Stockfish (1 move undo)
  - [ ] Handle wrong move with Stockfish (2 move undo)
  - [ ] Clear wrong move data on reset
  - [ ] Clear wrong move data on successful revert

### Acceptance Criteria

- [ ] Wrong moves are retained when `data-retain-wrong-moves="true"`
- [ ] Wrong moves auto-revert when `data-retain-wrong-moves="false"` (default)
- [ ] Revert button appears only in retention mode
- [ ] Revert button shows/hides at appropriate times
- [ ] `revertWrongMove()` correctly undos 1 move (no Stockfish) or 2 moves (with Stockfish)
- [ ] Board is disabled during wrong move retention
- [ ] State transitions from `wrong_move` back to `in_progress` on revert
- [ ] Counter-move animation plays before retention
- [ ] Arrows display for both wrong move (yellow) and counter-move (red)

### Testing Checklist

- [ ] Unit test: `revertWrongMove()` undos correct number of moves
- [ ] Unit test: `hasWrongMove()` returns correct boolean
- [ ] Integration test: Retained wrong move with Stockfish enabled
- [ ] Integration test: Retained wrong move without Stockfish
- [ ] Integration test: Auto-revert behavior (default)
- [ ] Integration test: Revert button click functionality
- [ ] Integration test: Reset during retained wrong move
- [ ] Edge case: Multiple rapid wrong moves

### Deliverables

- Updated `src/widget-core.js` - Configuration and state
- Updated `src/widget-solution.js` - Retention logic and revert method
- Updated `src/widget-board.js` - Revert button UI

---

## Phase 3: Visual Indicators

**Status:** Not Started
**Priority:** Medium
**Dependencies:** Phase 2 (wrong move retention)
**Estimated Time:** 2-3 hours

### Objectives

- Add question mark indicator for wrong moves
- Implement indicator positioning for all board sizes
- Handle board orientation changes
- Style indicator to match design specifications

### Tasks

- [ ] **3.1** Update CSS (bundled styles)
  - [ ] Create `.wrong-move-indicator` styles
  - [ ] Style question mark appearance (amber background, white text)
  - [ ] Add shadow and border styles
  - [ ] Ensure z-index layering is correct
  - [ ] Add transition animations

- [ ] **3.2** Update `src/widget-solution.js`
  - [ ] Create `addQuestionMarkIndicator(square)` method
  - [ ] Create `removeQuestionMarkIndicator()` method
  - [ ] Create `findSquareByCoordinates(square)` helper
  - [ ] Calculate indicator position based on square and orientation
  - [ ] Handle board size variations
  - [ ] Call indicator methods at appropriate times

- [ ] **3.3** Indicator Positioning
  - [ ] Calculate position for white-oriented board
  - [ ] Calculate position for black-oriented board
  - [ ] Scale indicator with board size
  - [ ] Center indicator on square

- [ ] **3.4** Lifecycle Management
  - [ ] Add indicator when wrong move is retained
  - [ ] Remove indicator when move is reverted
  - [ ] Remove indicator when puzzle is reset
  - [ ] Ensure only one indicator exists at a time

### Acceptance Criteria

- [ ] Question mark appears centered on wrong move square
- [ ] Indicator scales proportionally with board size
- [ ] Indicator positions correctly on white-oriented boards
- [ ] Indicator positions correctly on black-oriented boards
- [ ] Indicator has amber background with white "?" text
- [ ] Indicator has shadow and border for visibility
- [ ] Indicator is removed on revert
- [ ] Indicator is removed on reset
- [ ] Only one indicator exists at a time

### Testing Checklist

- [ ] Visual test: Indicator on various board sizes (300px, 400px, 500px, 600px)
- [ ] Visual test: Indicator on white-oriented board
- [ ] Visual test: Indicator on black-oriented board
- [ ] Visual test: Indicator with different piece themes
- [ ] Integration test: Indicator appears on wrong move
- [ ] Integration test: Indicator removed on revert
- [ ] Integration test: Indicator removed on reset
- [ ] Edge case: Board orientation change during retained wrong move

### Deliverables

- Updated CSS - Question mark indicator styles
- Updated `src/widget-solution.js` - Indicator creation and positioning methods

---

## Phase 4: Internationalization

**Status:** Not Started
**Priority:** Low
**Dependencies:** Phase 2 (wrong move retention)
**Estimated Time:** 1 hour

### Objectives

- Add translations for new feedback messages
- Support retention-specific messages
- Maintain consistency with existing i18n system

### Tasks

- [ ] **4.1** Update `src/widget-i18n.js`
  - [ ] Add `stockfish_counter_retained` message (English)
  - [ ] Add `stockfish_counter_retained` message (German)
  - [ ] Add `try_again` message (English)
  - [ ] Add `try_again` message (German)
  - [ ] Add `undo_wrong_move` button label (English)
  - [ ] Add `undo_wrong_move` button label (German)

- [ ] **4.2** Update `src/widget-board.js`
  - [ ] Use i18n for revert button label
  - [ ] Ensure button label updates with language changes

### Acceptance Criteria

- [ ] New messages translate correctly in English
- [ ] New messages translate correctly in German
- [ ] Messages support parameter interpolation (e.g., `{move}`)
- [ ] Revert button label uses i18n system
- [ ] No untranslated strings in retention mode

### Testing Checklist

- [ ] Manual test: English retention messages
- [ ] Manual test: German retention messages
- [ ] Integration test: Language switching with retention active

### Deliverables

- Updated `src/widget-i18n.js` - New translations

---

## Phase 5: API & Documentation

**Status:** Not Started
**Priority:** Medium
**Dependencies:** Phases 1-4 (all features complete)
**Estimated Time:** 2 hours

### Objectives

- Document public API methods
- Create usage examples
- Update README with new features
- Update CLAUDE.md with implementation details

### Tasks

- [ ] **5.1** API Documentation
  - [ ] Document `widget.getState()` method
  - [ ] Document `widget.on(event, callback)` method
  - [ ] Document `widget.off(event, callback)` method
  - [ ] Document `widget.getStateHistory()` method
  - [ ] Document `widget.revertWrongMove()` method
  - [ ] Document `widget.hasWrongMove()` method
  - [ ] Document all event types and payloads

- [ ] **5.2** Configuration Documentation
  - [ ] Document `data-expose-state-events` attribute
  - [ ] Document `data-retain-wrong-moves` attribute
  - [ ] Provide HTML examples for both features

- [ ] **5.3** Usage Examples
  - [ ] Create state tracking example
  - [ ] Create event listening example
  - [ ] Create wrong move retention example
  - [ ] Create analytics integration example

- [ ] **5.4** Update Core Documentation
  - [ ] Update README.md with feature overview
  - [ ] Update CLAUDE.md with implementation details
  - [ ] Add examples to demo page documentation

### Acceptance Criteria

- [ ] All public API methods documented
- [ ] All events documented with payload schemas
- [ ] Configuration attributes documented
- [ ] At least 3 usage examples provided
- [ ] README updated with feature descriptions
- [ ] CLAUDE.md updated with architecture details

### Deliverables

- Updated README.md
- Updated CLAUDE.md
- API documentation (separate doc or in README)
- Usage examples

---

## Phase 6: Testing & Integration

**Status:** Not Started
**Priority:** High
**Dependencies:** Phases 1-5 (all implementation complete)
**Estimated Time:** 2-3 hours

### Objectives

- Comprehensive testing of all features
- Integration testing with existing features
- Demo page updates
- Cross-browser verification

### Tasks

- [ ] **6.1** Unit Testing
  - [ ] State machine transitions
  - [ ] Event system (registration, emission, unsubscription)
  - [ ] Wrong move retention logic
  - [ ] Revert functionality
  - [ ] Indicator positioning calculations

- [ ] **6.2** Integration Testing
  - [ ] State tracking during full puzzle solve
  - [ ] State tracking with alternative solutions
  - [ ] State tracking with Stockfish integration
  - [ ] State tracking with premove feature
  - [ ] Wrong move retention with Stockfish
  - [ ] Wrong move retention without Stockfish
  - [ ] Multiple widgets on same page

- [ ] **6.3** Demo Page Updates
  - [ ] Add state tracking example puzzle
  - [ ] Add wrong move retention example puzzle
  - [ ] Add event logging console
  - [ ] Add interactive state display
  - [ ] Add examples for both features combined

- [ ] **6.4** Edge Case Testing
  - [ ] Rapid move attempts
  - [ ] Reset during wrong move
  - [ ] Board orientation changes
  - [ ] Different board sizes
  - [ ] Multiple event listeners
  - [ ] Event listener memory management

- [ ] **6.5** Cross-Browser Testing
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **6.6** Performance Testing
  - [ ] Event emission performance
  - [ ] State history memory usage
  - [ ] Multiple widgets on page
  - [ ] Build size impact

### Acceptance Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Demo page demonstrates all features
- [ ] No console errors in any browser
- [ ] Features work across all target browsers
- [ ] No memory leaks detected
- [ ] Build size increase < 5KB (minified)
- [ ] No performance regression

### Testing Checklist

**State Management:**
- [ ] State transitions work correctly
- [ ] Events fire in correct order
- [ ] Multiple listeners receive events
- [ ] Event unsubscription works
- [ ] State history tracks correctly
- [ ] Works with alternative solutions
- [ ] Works with Stockfish
- [ ] Works with premove

**Wrong Move Retention:**
- [ ] Retention mode enabled/disabled correctly
- [ ] Revert button shows/hides correctly
- [ ] 1-move undo (no Stockfish)
- [ ] 2-move undo (with Stockfish)
- [ ] State transitions on revert
- [ ] Reset clears retention state

**Visual Indicators:**
- [ ] Question mark appears correctly
- [ ] Question mark positions on white board
- [ ] Question mark positions on black board
- [ ] Question mark scales with board size
- [ ] Arrows display correctly
- [ ] Indicator removed on revert/reset

**Integration:**
- [ ] Multiple widgets isolated
- [ ] Works with all existing features
- [ ] Backward compatibility maintained
- [ ] No breaking changes

### Deliverables

- Updated `demo/index.html` - Feature demonstrations
- Test results documentation
- Cross-browser compatibility report
- Performance analysis report

---

## Success Metrics

### Feature Adoption
- [ ] API documentation views
- [ ] Demo page interactions with new features
- [ ] GitHub issues/questions about features

### Code Quality
- [ ] Test coverage > 80%
- [ ] No lint errors
- [ ] Build size increase < 5%
- [ ] No performance regression

### User Experience
- [ ] Intuitive API design
- [ ] Clear visual feedback
- [ ] Accessible controls
- [ ] Responsive across devices

---

## Risk Management

### Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Indicator positioning breaks on orientation change | Medium | Medium | Extensive testing, recalculation on orientation change |
| Event system memory leaks | High | Low | Proper cleanup on widget destruction, testing |
| Build size increase too large | Low | Low | Modular design, code splitting |
| Breaking changes in existing widgets | High | Low | Comprehensive backward compatibility testing |
| Browser compatibility issues | Medium | Low | Cross-browser testing before release |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-27 | Initial roadmap created | Claude |

---

## Notes

- This roadmap is a living document and will be updated as implementation progresses
- Each phase should be completed and tested before moving to the next
- Demo page updates can happen incrementally throughout phases
- Documentation should be updated continuously, not just in Phase 5

## References

- [External State Management Specification](./external-state-spec.md)
- [Wrong Move Retention Specification](./wrong-move-retention-spec.md)
- [CLAUDE.md](../CLAUDE.md) - Project architecture
- [README.md](../README.md) - User documentation
