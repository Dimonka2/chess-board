# Stockfish Counter-Move Feature - Implementation Roadmap

## Project Timeline: 3 Weeks

**Start Date**: TBD
**Target Completion**: TBD
**Status**: 🔵 Planning

---

## Phase 1: Code Refactoring & Modularization
**Duration**: 3-4 days
**Status**: ⚪ Not Started

### Tasks

#### 1.1 Extract Core Widget Functionality
- [ ] Create `src/widget-core.js`
  - [ ] Move ChessWidget class definition
  - [ ] Move constructor and init methods
  - [ ] Move configuration parsing
  - [ ] Keep imports and exports minimal
- [ ] Test: Widget still initializes correctly
- **Estimated**: 2 hours

#### 1.2 Extract Board Management
- [ ] Create `src/widget-board.js`
  - [ ] Move `createBoardContainer()`
  - [ ] Move `initChessground()`
  - [ ] Move `getOrientation()`
  - [ ] Move `getDests()`
  - [ ] Move `updateBoard()`
- [ ] Test: Board renders and updates correctly
- **Estimated**: 2 hours

#### 1.3 Extract Solution Logic
- [ ] Create `src/widget-solution.js`
  - [ ] Move `onMove()` and move validation
  - [ ] Move `playAutomaticMove()`
  - [ ] Move solution checking logic
  - [ ] Move `showFeedback()`
- [ ] Test: Solution validation works
- **Estimated**: 2 hours

#### 1.4 Extract Utilities
- [ ] Create `src/widget-utils.js`
  - [ ] Move utility functions (if any)
  - [ ] Move constants
  - [ ] Move helper methods
- [ ] Test: All utilities accessible
- **Estimated**: 1 hour

#### 1.4a Create Alternative Solutions System
- [ ] Create `src/widget-solution-validator.js`
  - [ ] Implement `SolutionValidator` class
  - [ ] Parse solution strings with pipe separators
  - [ ] Track active solution paths
  - [ ] Validate moves against multiple paths
- [ ] Test: Alternative solutions work correctly
- **Estimated**: 2 hours

#### 1.4b Create Internationalization System
- [ ] Create `src/widget-i18n.js`
  - [ ] Implement `I18n` class
  - [ ] Add English translations
  - [ ] Add German translations
  - [ ] Implement placeholder replacement
  - [ ] Add language fallback logic
- [ ] Test: Language switching works
- [ ] Test: Placeholder replacement works
- **Estimated**: 2 hours

#### 1.5 Update Build System
- [ ] Modify `build.js` to concatenate multiple source files
- [ ] Add file order configuration (include i18n and solution-validator)
- [ ] Add source mapping support (optional)
- [ ] Test: Build produces identical output to current version
- [ ] Test: Minified version still works
- **Estimated**: 2 hours

#### 1.6 Update Main Entry Point
- [ ] Update `src/chess-widget.js` to be entry point only
- [ ] Ensure proper ordering of includes
- [ ] Test: Full widget functionality intact
- **Estimated**: 1 hour

#### 1.7 Integration Testing
- [ ] Test alternative solutions with simple puzzles
- [ ] Test alternative solutions with branching paths
- [ ] Test i18n with English (default)
- [ ] Test i18n with German
- [ ] Test language fallback behavior
- **Estimated**: 2 hours

#### 1.8 Documentation
- [ ] Update CLAUDE.md with new architecture
- [ ] Add inline comments explaining module structure
- [ ] Document build process changes
- [ ] Document alternative solutions format
- [ ] Document i18n usage
- **Estimated**: 2 hours

### Phase 1 Acceptance Criteria
- ✅ Widget builds successfully from multiple source files
- ✅ All existing functionality works identically
- ✅ Alternative solutions parser works correctly
- ✅ I18n system works with English and German
- ✅ Build output file size increase is minimal
- ✅ All existing tests pass
- ✅ Code is more maintainable and readable

**Phase 1 Total Estimated Time**: 18 hours (~2.5 days)

---

## Phase 2: Stockfish API Integration
**Duration**: 4-5 days
**Status**: ⚪ Not Started

### Tasks

#### 2.1 Create Stockfish Client
- [ ] Create `src/widget-stockfish.js`
- [ ] Implement `StockfishClient` class
  - [ ] Constructor with configuration
  - [ ] `getBestMove(fen, depth)` method
  - [ ] API request handling
  - [ ] Response parsing
  - [ ] Error handling
  - [ ] Timeout handling
- [ ] Test: API requests work in browser console
- **Estimated**: 3 hours

#### 2.2 Test API Integration
- [ ] Test with various FEN positions
- [ ] Test error scenarios (network failure, timeout)
- [ ] Test response format handling
- [ ] Verify CORS compatibility
- [ ] Test rate limiting behavior
- **Estimated**: 2 hours

#### 2.3 Create Caching System
- [ ] Create `src/widget-cache.js`
- [ ] Implement `MoveCache` class
  - [ ] Constructor with puzzle ID generation
  - [ ] `getCachedMove(fen, depth)` method
  - [ ] `setCachedMove(fen, depth, moveData)` method
  - [ ] `loadFromStorage()` method
  - [ ] `saveToStorage()` method
  - [ ] Cache invalidation logic
- [ ] Test: Cache stores and retrieves correctly
- **Estimated**: 3 hours

#### 2.4 Test Caching System
- [ ] Test localStorage operations
- [ ] Test cache hits and misses
- [ ] Test with storage quota exceeded
- [ ] Test in private/incognito mode
- [ ] Test cache persistence across page reloads
- **Estimated**: 2 hours

#### 2.5 Configuration Parsing
- [ ] Add data attribute parsing for all new features
  - [ ] `data-solution-alternatives` (alternative solutions)
  - [ ] `data-lang` (i18n)
  - [ ] `data-stockfish-enabled`
  - [ ] `data-stockfish-depth`
  - [ ] `data-stockfish-timeout`
  - [ ] `data-stockfish-show-arrow`
  - [ ] `data-stockfish-show-animation`
  - [ ] `data-stockfish-cache-enabled`
- [ ] Set sensible defaults
- [ ] Test: Configuration parsed correctly
- **Estimated**: 2 hours

#### 2.6 Initialize All Components
- [ ] Initialize I18n in widget constructor
- [ ] Initialize SolutionValidator in widget constructor
- [ ] Initialize StockfishClient in widget constructor (if enabled)
- [ ] Initialize MoveCache in widget constructor (if enabled)
- [ ] Add feature detection and fallback
- [ ] Test: Components initialize correctly
- [ ] Test: Components initialize only when enabled (Stockfish)
- **Estimated**: 3 hours

#### 2.7 Update Move Validation Logic
- [ ] Integrate SolutionValidator into move validation
- [ ] Update feedback messages to use i18n
- [ ] Test alternative solution paths
- [ ] Test translated messages
- **Estimated**: 2 hours

#### 2.8 Documentation
- [ ] Document SolutionValidator API
- [ ] Document I18n API
- [ ] Document StockfishClient API
- [ ] Document MoveCache API
- [ ] Add code examples
- [ ] Document configuration options
- **Estimated**: 2 hours

### Phase 2 Acceptance Criteria
- ✅ Alternative solutions work with multiple paths
- ✅ I18n works with English and German
- ✅ Stockfish API requests work reliably
- ✅ Caching reduces API calls by >80%
- ✅ Configuration is flexible and well-documented
- ✅ Error handling is robust
- ✅ Move validation correctly uses alternative solutions
- ✅ All messages are properly translated

**Phase 2 Total Estimated Time**: 20 hours (~3 days)

---

## Phase 3: Visual Feedback Implementation
**Duration**: 3-4 days
**Status**: ⚪ Not Started

### Tasks

#### 3.1 Arrow Drawing System
- [ ] Research Chessground arrow API
- [ ] Implement `drawMoveArrow(from, to, color)` method
- [ ] Implement `clearArrows()` method
- [ ] Style arrow appearance (color, thickness)
- [ ] Test: Arrows display correctly
- **Estimated**: 3 hours

#### 3.2 Move Animation
- [ ] Implement `animateMove(from, to, duration)` method
- [ ] Integrate with Chessground animation system
- [ ] Add configurable animation speed
- [ ] Test: Moves animate smoothly
- **Estimated**: 2 hours

#### 3.3 Counter-Move Display Logic
- [ ] Implement `showStockfishCounterMove(moveData)` method
  - [ ] Make the counter-move on the board
  - [ ] Show arrow (if enabled)
  - [ ] Animate move (if enabled)
  - [ ] Display status message
  - [ ] Wait 2 seconds
  - [ ] Undo both moves (user's + Stockfish's)
  - [ ] Clear visual feedback
- [ ] Test: Counter-move flow works correctly
- **Estimated**: 3 hours

#### 3.4 Enhanced Status Messages
- [ ] Add new feedback type: `stockfish-counter`
- [ ] Format move notation (UCI to readable)
- [ ] Style status message for counter-move
- [ ] Add evaluation display (optional)
- [ ] Ensure all messages use i18n system
- [ ] Test: Messages display correctly in English
- [ ] Test: Messages display correctly in German
- **Estimated**: 2 hours

#### 3.5 Undo Move Logic
- [ ] Implement `undoLastTwoMoves()` method
- [ ] Ensure chess.js state is correct
- [ ] Ensure chessground board is correct
- [ ] Ensure move index is correct
- [ ] Test: Board state resets properly
- **Estimated**: 2 hours

#### 3.6 CSS Styling
- [ ] Add styles for counter-move feedback
- [ ] Style arrow colors
- [ ] Style status messages
- [ ] Ensure responsive design
- [ ] Test: Styles look good on all screen sizes
- **Estimated**: 2 hours

#### 3.7 Documentation
- [ ] Document visual feedback API
- [ ] Add screenshots to documentation
- [ ] Document styling customization options
- **Estimated**: 1 hour

### Phase 3 Acceptance Criteria
- ✅ Counter-moves display with clear visual feedback
- ✅ Arrows and animations work smoothly
- ✅ Status messages are clear and helpful
- ✅ Undo logic resets board correctly
- ✅ Styling is polished and responsive

**Phase 3 Total Estimated Time**: 15 hours (~2 days)

---

## Phase 4: Integration & Move Validation
**Duration**: 4-5 days
**Status**: ⚪ Not Started

### Tasks

#### 4.1 Integrate with Move Validation
- [ ] Modify `onMove()` to detect wrong moves
- [ ] Add Stockfish check for wrong moves
- [ ] Implement `handleWrongMoveWithStockfish(move)` method
  - [ ] Check cache first
  - [ ] Request from API if not cached
  - [ ] Store in cache
  - [ ] Show counter-move
  - [ ] Handle errors with fallback
- [ ] Test: Wrong move triggers Stockfish
- **Estimated**: 3 hours

#### 4.2 Correct Move Flow
- [ ] Ensure correct moves still work as before
- [ ] Verify solution progression
- [ ] Test puzzle completion
- [ ] Test: Correct moves unaffected
- **Estimated**: 1 hour

#### 4.3 Error Handling & Fallbacks
- [ ] Handle API request failures gracefully
- [ ] Fall back to standard "wrong move" feedback
- [ ] Add retry logic for failed requests
- [ ] Log errors to console (not to user)
- [ ] Test: Errors don't break widget
- **Estimated**: 2 hours

#### 4.4 Loading States
- [ ] Add loading indicator during API request
- [ ] Prevent user moves during loading
- [ ] Add timeout for long requests
- [ ] Test: Loading states work correctly
- **Estimated**: 2 hours

#### 4.5 Feature Toggle
- [ ] Ensure feature is disabled by default
- [ ] Test widget with feature disabled
- [ ] Test widget with feature enabled
- [ ] Test toggling feature on/off
- **Estimated**: 1 hour

#### 4.6 Performance Testing
- [ ] Test with slow network connections
- [ ] Test with API timeouts
- [ ] Test cache performance
- [ ] Test with many rapid moves
- [ ] Measure file size impact
- **Estimated**: 3 hours

#### 4.7 Cross-Puzzle Testing
- [ ] Test with simple puzzles (mate in 1)
- [ ] Test with complex puzzles (mate in 3+)
- [ ] Test with tactical puzzles
- [ ] Test with positional puzzles
- [ ] Test with various starting positions
- [ ] Test puzzles with alternative solutions
- [ ] Test in different languages
- **Estimated**: 3 hours

### Phase 4 Acceptance Criteria
- ✅ Stockfish counter-move integrated into move validation
- ✅ Alternative solutions work correctly in all scenarios
- ✅ I18n works correctly across all features
- ✅ Feature works seamlessly with existing puzzle logic
- ✅ Errors handled gracefully with fallbacks
- ✅ Performance is acceptable (<2s response time)
- ✅ File size increase is minimal (<15KB)

**Phase 4 Total Estimated Time**: 15 hours (~2 days)

---

## Phase 5: Polish, Documentation & Testing
**Duration**: 3-4 days
**Status**: ⚪ Not Started

### Tasks

#### 5.1 Browser Compatibility Testing
- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on Edge (latest)
- [ ] Test on mobile Chrome
- [ ] Test on mobile Safari
- [ ] Fix any browser-specific issues
- **Estimated**: 3 hours

#### 5.2 Add Demo Examples
- [ ] Add puzzle with alternative solutions to demo page
- [ ] Add i18n example (German language)
- [ ] Add Stockfish-enabled puzzle to demo page
- [ ] Add configuration examples
- [ ] Add visual examples of counter-moves
- [ ] Test: Demo page showcases all features well
- **Estimated**: 3 hours

#### 5.3 Update README
- [ ] Add alternative solutions section
- [ ] Add i18n section with language examples
- [ ] Add Stockfish feature section
- [ ] Document all configuration options
- [ ] Add usage examples
- [ ] Add FAQ section
- [ ] Add troubleshooting guide
- **Estimated**: 3 hours

#### 5.4 Update CLAUDE.md
- [ ] Document new modular architecture
- [ ] Update project overview
- [ ] Document alternative solutions system
- [ ] Document i18n system
- [ ] Document Stockfish integration
- [ ] Add development guidelines
- **Estimated**: 2 hours

#### 5.5 Create Configuration Guide
- [ ] Document all data attributes
- [ ] Provide configuration examples for alternative solutions
- [ ] Provide configuration examples for i18n
- [ ] Provide configuration examples for Stockfish
- [ ] Explain caching behavior
- [ ] Explain performance considerations
- **Estimated**: 2 hours

#### 5.6 Code Review & Cleanup
- [ ] Review all new code
- [ ] Remove console.log statements
- [ ] Fix linting issues
- [ ] Optimize bundle size
- [ ] Add missing comments
- **Estimated**: 3 hours

#### 5.7 Security Review
- [ ] Review API request security
- [ ] Review localStorage usage
- [ ] Ensure no sensitive data stored
- [ ] Test CORS handling
- [ ] Document security considerations
- **Estimated**: 2 hours

#### 5.8 Performance Optimization
- [ ] Minimize bundle size
- [ ] Optimize API requests
- [ ] Optimize caching logic
- [ ] Profile and fix bottlenecks
- **Estimated**: 2 hours

#### 5.9 Final Testing
- [ ] Run full test suite
- [ ] Test all configuration combinations
- [ ] Test alternative solutions edge cases
- [ ] Test i18n with missing translations
- [ ] Test Stockfish error scenarios
- [ ] Fix any remaining bugs
- **Estimated**: 4 hours

### Phase 5 Acceptance Criteria
- ✅ Feature works across all major browsers
- ✅ Documentation is complete and clear
- ✅ Demo page showcases all features effectively
- ✅ Alternative solutions thoroughly tested
- ✅ I18n works with proper fallbacks
- ✅ Code is clean and well-commented
- ✅ Performance is optimized
- ✅ All tests pass

**Phase 5 Total Estimated Time**: 24 hours (~3 days)

---

## Summary

### Total Estimated Time
- **Phase 1**: 18 hours (~2.5 days) - Modular architecture + Alternative solutions + i18n
- **Phase 2**: 20 hours (~3 days) - Stockfish API + Component integration
- **Phase 3**: 15 hours (~2 days) - Visual feedback
- **Phase 4**: 15 hours (~2 days) - Integration & testing
- **Phase 5**: 24 hours (~3 days) - Polish, documentation & testing

**Total**: 92 hours (~13 working days or ~3 weeks with buffer)

### Milestones

#### Milestone 1: Core Features Complete
**Date**: End of Week 1
**Deliverables**:
- ✅ Code split into modules
- ✅ Build system updated
- ✅ Alternative solutions working
- ✅ I18n system working (English + German)
- ✅ All existing functionality working

#### Milestone 2: Stockfish Integration Complete
**Date**: End of Week 2
**Deliverables**:
- ✅ Stockfish API working
- ✅ Caching system working
- ✅ Visual feedback implemented
- ✅ Basic integration complete
- ✅ All features integrated with alternative solutions and i18n

#### Milestone 3: Feature Complete & Released
**Date**: End of Week 3
**Deliverables**:
- ✅ Full integration with move validation
- ✅ Documentation complete
- ✅ Demo examples added for all features
- ✅ All features tested and ready for release

---

## Risk Management

### High Risks
1. **Stockfish API Rate Limiting**
   - Mitigation: Implement aggressive caching, add retry logic
   - Fallback: Disable feature gracefully if API unavailable

2. **Browser localStorage Limitations**
   - Mitigation: Handle quota exceeded errors, implement cache pruning
   - Fallback: Work without cache, just slower

3. **Performance Impact**
   - Mitigation: Lazy load Stockfish code, optimize bundle size
   - Fallback: Make feature optional (default disabled)

### Medium Risks
1. **CORS Issues with Stockfish API**
   - Mitigation: Test early, work with API provider if needed
   - Fallback: Provide proxy option or self-hosted alternative

2. **File Size Bloat**
   - Mitigation: Code splitting, tree shaking, minification
   - Fallback: Separate build for Stockfish-enabled version
   - Note: Alternative solutions and i18n will add ~3-5KB

3. **Complex Alternative Solution Patterns**
   - Mitigation: Document limitations, provide clear examples
   - Fallback: Support simple pipe-separated format only

### Low Risks
1. **Browser Compatibility**
   - Mitigation: Test early and often on all major browsers
   - Fallback: Feature detection and graceful degradation

---

## Success Metrics

### Performance Metrics
- ⚡ Counter-move displayed within 2 seconds (95th percentile)
- 📦 Total file size increase < 15KB (including alternative solutions + i18n)
- 💾 Cache hit rate > 80%
- 🚫 API error rate < 1%

### Feature Adoption Metrics
- 🔀 Alternative solutions usage: >10% of puzzles
- 🌍 Non-English language usage: >5% of widgets
- 🤖 Stockfish integration: >20% of puzzles

### User Experience Metrics
- ✅ Alternative solution discovery rate (users find correct path)
- 🌐 I18n satisfaction (users use their language)
- 👍 Positive user feedback
- 🐛 Bug reports < 5 per month
- 📈 Engagement increase with new features

### Code Quality Metrics
- 📝 Code coverage > 80%
- 🎯 Linting issues = 0
- 📚 All public APIs documented
- ♿ Accessibility score maintained

---

## Post-Launch

### Version 1.1 Enhancements (Future)

**Alternative Solutions & Puzzle Features**
- [ ] Smart branching hints (show when multiple paths available)
- [ ] Solution path statistics tracking
- [ ] Visual indicators for alternative moves
- [ ] Puzzle difficulty ratings based on complexity

**Internationalization**
- [ ] Additional languages: French, Spanish, Italian, Russian
- [ ] RTL language support (Arabic, Hebrew)
- [ ] Community translation system
- [ ] Dynamic language switching

**Stockfish Features**
- [ ] Multiple counter-move suggestions (top 3)
- [ ] Evaluation bar visualization
- [ ] Hint system using Stockfish
- [ ] Adjustable difficulty (Stockfish depth)
- [ ] Move explanation tooltips

### Version 2.0 (Future)
- [ ] Offline Stockfish (WASM bundle)
- [ ] Analysis mode
- [ ] Opening book integration
- [ ] Endgame tablebase support
- [ ] Custom Stockfish configurations
- [ ] Advanced puzzle editor with alternative solution builder

---

## Notes & Updates

### 2025-10-10
- ✅ Initial roadmap created
- ✅ Specification document completed
- ✅ Added alternative solutions feature
- ✅ Added internationalization (i18n) feature with German support
- ✅ Updated roadmap with new features
- ✅ Adjusted timeline: 92 hours total (~3 weeks)
- 📝 Ready to begin Phase 1

---

**Legend**:
- ⚪ Not Started
- 🔵 Planning
- 🟡 In Progress
- 🟢 Completed
- 🔴 Blocked
- ⚫ Cancelled
