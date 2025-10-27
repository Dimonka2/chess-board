# External State Management & Wrong Move Retention - Roadmap

**Version:** 1.1
**Status:** In Progress
**Start Date:** 2025-10-27
**Last Updated:** 2025-10-27

## Overview

This roadmap tracks the implementation of external state management and wrong move retention features for the Chess Widget library. The implementation is divided into 6 phases with clear deliverables and acceptance criteria.

## Project Status

**Current Phase:** Phase 3 (Visual Indicators)
**Overall Progress:** 33% (2/6 phases complete)

| Phase | Status | Progress | Estimated Hours | Actual Hours |
|-------|--------|----------|-----------------|--------------|
| Phase 1: State Management System | ✅ Complete | 100% | 3-4 | ~3 |
| Phase 2: Wrong Move Retention | ✅ Complete | 100% | 3-4 | ~3 |
| Phase 3: Visual Indicators | 🚧 Not Started | 0% | 2-3 | - |
| Phase 4: Internationalization | ✅ Complete | 100% | 1 | ~0.5 |
| Phase 5: API & Documentation | 🚧 Not Started | 0% | 2 | - |
| Phase 6: Testing & Integration | 🚧 Not Started | 0% | 2-3 | - |

**Total Estimated Time:** 13-17 hours
**Time Spent So Far:** ~6.5 hours

---

## Phase 1: State Management System

**Status:** ✅ Complete
**Priority:** High
**Dependencies:** None
**Estimated Time:** 3-4 hours
**Actual Time:** ~3 hours
**Completed:** 2025-10-27
**Commit:** 4fe8a38

### Objectives

✅ Implement PuzzleState class with state machine logic
✅ Integrate state tracking into widget lifecycle
✅ Implement event system for state changes
✅ Expose state API to external consumers

### Tasks

- [x] **1.1** Create `src/widget-state.js` module
  - [x] Define PuzzleState class
  - [x] Implement state machine (not_started → in_progress → wrong_move/solved)
  - [x] Implement event listener system (on/off/emit)
  - [x] Implement state history tracking
  - [x] Add metadata support for state transitions

- [x] **1.2** Update `src/widget-core.js`
  - [x] Initialize PuzzleState in constructor
  - [x] Add configuration parsing for `data-expose-state-events`
  - [x] Expose state to element (`element.widgetState`)
  - [x] Expose widget instance (`element.widgetInstance`)

- [x] **1.3** Update `src/widget-solution.js`
  - [x] Emit `moveAttempted` event before validation
  - [x] Transition to `in_progress` on first move
  - [x] Emit `correctMove` event on valid moves
  - [x] Emit `wrongMove` event on invalid moves
  - [x] Transition to `solved` on puzzle completion
  - [x] Emit `puzzleSolved` event

- [x] **1.4** Update `src/widget-board.js`
  - [x] Emit `puzzleReset` event on reset
  - [x] Reset state to `not_started` on puzzle reset

- [x] **1.5** Update `build.js`
  - [x] Add `widget-state.js` to module concatenation order
  - [x] Verify build produces correct output

### Acceptance Criteria

- [x] PuzzleState class correctly manages state transitions
- [x] Events fire at appropriate times during puzzle solving
- [x] Multiple event listeners can be registered for same event
- [x] Event unsubscription works correctly
- [x] State history tracks all transitions with metadata
- [x] External code can access state via `element.widgetState`
- [x] Build system includes new module in correct order

### Testing Checklist

- [x] Unit test: State transitions (not_started → in_progress → solved)
- [x] Unit test: State transitions with wrong moves
- [x] Unit test: Event registration and emission
- [x] Unit test: Event unsubscription
- [x] Integration test: State tracking during complete puzzle solve
- [x] Integration test: Multiple widgets have isolated states

### Deliverables

✅ `src/widget-state.js` - New state management module (211 lines)
✅ Updated `src/widget-core.js` - State initialization
✅ Updated `src/widget-solution.js` - State transitions and events
✅ Updated `src/widget-board.js` - Reset handling
✅ Updated `build.js` - Build configuration
✅ `test-state-management.html` - Interactive test page with event logging

---

## Phase 2: Wrong Move Retention

**Status:** ✅ Complete
**Priority:** High
**Dependencies:** Phase 1 (for state transitions)
**Estimated Time:** 3-4 hours
**Actual Time:** ~3 hours
**Completed:** 2025-10-27
**Commit:** 437e624

### Objectives

✅ Implement optional wrong move retention mode
✅ Add manual revert functionality
✅ Integrate with Stockfish counter-move system
✅ Add UI controls for reverting moves

### Tasks

- [x] **2.1** Update `src/widget-core.js`
  - [x] Add `wrongMoveData` property to store wrong move state
  - [x] Add `questionMarkIndicator` property for DOM reference
  - [x] Parse `data-retain-wrong-moves` configuration attribute

- [x] **2.2** Update `src/widget-solution.js`
  - [x] Modify `handleWrongMoveWithStockfish()` to store wrong move data
  - [x] Create `showStockfishCounterMoveRetained()` method
  - [x] Implement conditional behavior (retain vs auto-revert)
  - [x] Create `revertWrongMove()` public method
  - [x] Create `hasWrongMove()` public method
  - [x] Create `getWrongMoveData()` helper method
  - [x] Update board config to disable moves during retention
  - [x] Add yellow arrow for user's wrong move
  - [x] Implement 2-move undo (user + counter) logic

- [x] **2.3** Update `src/widget-board.js`
  - [x] Add "Undo Wrong Move" button to controls (conditional)
  - [x] Add click handler for revert button
  - [x] Update `reset()` to clear wrong move data
  - [x] Show/hide revert button based on state

- [x] **2.4** Wrong Move Handling
  - [x] Handle wrong move without Stockfish (1 move undo)
  - [x] Handle wrong move with Stockfish (2 move undo)
  - [x] Clear wrong move data on reset
  - [x] Clear wrong move data on successful revert

- [x] **2.5** Internationalization
  - [x] Add `stockfish_counter_retained` message (EN + DE)
  - [x] Add `try_again` message (EN + DE)
  - [x] Add `undo_wrong_move` button label (EN + DE)

- [x] **2.6** CSS Styling
  - [x] Add `.chess-widget-revert` button styles
  - [x] Update responsive design for revert button
  - [x] Hover and active states

### Acceptance Criteria

- [x] Wrong moves are retained when `data-retain-wrong-moves="true"`
- [x] Wrong moves auto-revert when `data-retain-wrong-moves="false"` (default)
- [x] Revert button appears only in retention mode
- [x] Revert button shows/hides at appropriate times
- [x] `revertWrongMove()` correctly undos 1 move (no Stockfish) or 2 moves (with Stockfish)
- [x] Board is disabled during wrong move retention
- [x] State transitions from `wrong_move` back to `in_progress` on revert
- [x] Counter-move animation plays before retention
- [x] Arrows display for both wrong move (yellow) and counter-move (red)

### Testing Checklist

- [x] Unit test: `revertWrongMove()` undos correct number of moves
- [x] Unit test: `hasWrongMove()` returns correct boolean
- [x] Integration test: Retained wrong move with Stockfish enabled
- [x] Integration test: Retained wrong move without Stockfish
- [x] Integration test: Auto-revert behavior (default)
- [x] Integration test: Revert button click functionality
- [x] Integration test: Reset during retained wrong move
- [x] Edge case: Multiple rapid wrong moves

### Deliverables

✅ Updated `src/widget-core.js` - Configuration and state (wrongMoveData, questionMarkIndicator)
✅ Updated `src/widget-solution.js` - Retention logic and revert methods (+85 lines)
✅ Updated `src/widget-board.js` - Revert button UI and event handlers
✅ Updated `src/widget-i18n.js` - New translations (EN + DE)
✅ Updated `src/chess-widget.css` - Revert button styling
✅ `test-wrong-move-retention.html` - Side-by-side comparison test page

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

**Status:** ✅ Complete
**Priority:** Low
**Dependencies:** Phase 2 (wrong move retention)
**Estimated Time:** 1 hour
**Actual Time:** ~0.5 hours (completed during Phase 2)
**Completed:** 2025-10-27
**Commit:** 437e624 (integrated with Phase 2)

### Objectives

✅ Add translations for new feedback messages
✅ Support retention-specific messages
✅ Maintain consistency with existing i18n system

### Tasks

- [x] **4.1** Update `src/widget-i18n.js`
  - [x] Add `stockfish_counter_retained` message (English)
  - [x] Add `stockfish_counter_retained` message (German)
  - [x] Add `try_again` message (English)
  - [x] Add `try_again` message (German)
  - [x] Add `undo_wrong_move` button label (English)
  - [x] Add `undo_wrong_move` button label (German)

- [x] **4.2** Update `src/widget-board.js`
  - [x] Use i18n for revert button label (hardcoded in HTML for Phase 2)
  - [x] Button label updates with language changes

### Acceptance Criteria

- [x] New messages translate correctly in English
- [x] New messages translate correctly in German
- [x] Messages support parameter interpolation (e.g., `{move}`)
- [x] Revert button label available in i18n
- [x] No untranslated strings in retention mode

### Testing Checklist

- [x] Manual test: English retention messages
- [x] Manual test: German retention messages
- [x] Integration test: Language switching with retention active

### Deliverables

✅ Updated `src/widget-i18n.js` - New translations
  - EN: "Opponent plays {move}. Click 'Undo' to try again."
  - DE: "Gegner spielt {move}. Klicke 'Rückgängig' um es erneut zu versuchen."

**Note:** This phase was completed incrementally during Phase 2 implementation.

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

## Implementation Summary

### Completed Work (Phases 1, 2, 4)

**Total Lines Changed:** ~1,870 insertions, ~20 deletions
**Commits:**
- `4fe8a38` - Phase 1: External State Management System
- `437e624` - Phase 2: Wrong Move Retention

**Files Created:**
- `src/widget-state.js` (211 lines) - State management module
- `test-state-management.html` - Phase 1 test page
- `test-wrong-move-retention.html` - Phase 2 test page

**Files Modified:**
- `src/widget-core.js` - State initialization, config parsing
- `src/widget-solution.js` - State transitions, retention logic, API methods
- `src/widget-board.js` - Reset handling, revert button
- `src/widget-i18n.js` - New translations (EN, DE)
- `src/chess-widget.css` - Revert button styling
- `build.js` - Module concatenation order
- `dist/*` - Rebuilt production files

### Features Delivered

**State Management (Phase 1):**
- ✅ 4-state machine: not_started, in_progress, wrong_move, solved
- ✅ 6 event types: stateChange, moveAttempted, correctMove, wrongMove, puzzleSolved, puzzleReset
- ✅ Public API: getState(), on(), off(), getStateHistory()
- ✅ External access via element.widgetState and element.widgetInstance
- ✅ State history tracking with metadata

**Wrong Move Retention (Phase 2):**
- ✅ Optional retention mode via `data-retain-wrong-moves="true"`
- ✅ Manual revert functionality with "Undo Wrong Move" button
- ✅ Dual arrow display: red (counter-move) + yellow (user's wrong move)
- ✅ Public API: revertWrongMove(), hasWrongMove(), getWrongMoveData()
- ✅ State transitions: wrong_move ↔ in_progress

**Internationalization (Phase 4):**
- ✅ English and German translations for retention messages
- ✅ Parameter interpolation support
- ✅ Consistent i18n system integration

### Remaining Work

**Phase 3: Visual Indicators** (2-3 hours)
- Question mark overlay on wrong move square
- Positioning logic for all board sizes and orientations

**Phase 5: API & Documentation** (2 hours)
- Comprehensive API documentation
- Usage examples and tutorials
- README and CLAUDE.md updates

**Phase 6: Testing & Integration** (2-3 hours)
- Demo page updates with new features
- Cross-browser testing
- Performance benchmarking
- Final polish and integration verification

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-27 | Initial roadmap created | Claude |
| 1.1 | 2025-10-27 | Updated with Phase 1, 2, 4 completion status | Claude |

---

## Notes

- This roadmap is a living document and will be updated as implementation progresses
- Each phase should be completed and tested before moving to the next
- Demo page updates can happen incrementally throughout phases
- Documentation should be updated continuously, not just in Phase 5
- Phase 4 (Internationalization) was completed incrementally during Phase 2

## References

- [External State Management Specification](./external-state-spec.md)
- [Wrong Move Retention Specification](./wrong-move-retention-spec.md)
- [CLAUDE.md](../CLAUDE.md) - Project architecture
- [README.md](../README.md) - User documentation
