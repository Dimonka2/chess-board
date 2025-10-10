# Lichess Import Feature - Implementation Roadmap

**Feature:** Import chess puzzles from Lichess.org into the puzzle builder

**Target Completion:** 5-7 hours of development time

---

## Phase 1: Foundation & Core Logic (2-3 hours)

### Milestone 1.1: Lichess API Integration Module
**Estimated Time:** 1 hour
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Create `builder/modules/lichess-import.js`
- [ ] Implement `fetchLichessPuzzle(puzzleId)` function
  - [ ] Extract puzzle ID from various input formats (ID, training URL, API URL)
  - [ ] Fetch from Lichess API endpoint
  - [ ] Handle HTTP errors (404, 500, network failures)
  - [ ] Return parsed JSON data
- [ ] Add unit tests for ID extraction regex
- [ ] Test with sample puzzle IDs: `sUum4`, `3Gw8p`, `0009hL`

**Acceptance Criteria:**
- ✅ Function successfully fetches puzzle data from Lichess
- ✅ Function handles malformed inputs gracefully
- ✅ Function returns standardized error messages
- ✅ Works with all three input formats (ID, training URL, API URL)

---

### Milestone 1.2: FEN Derivation Logic
**Estimated Time:** 1 hour
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Implement `deriveFenFromLichessPuzzle(pgn, initialPly)` function
  - [ ] Parse PGN using chess.js
  - [ ] Navigate to `initialPly` position
  - [ ] Extract and return FEN string
  - [ ] Handle edge cases (invalid PGN, out-of-range ply)
- [ ] Test with various puzzle types:
  - [ ] Opening puzzles (low initialPly)
  - [ ] Middlegame puzzles (medium initialPly)
  - [ ] Endgame puzzles (high initialPly)
- [ ] Validate FEN output matches Lichess position

**Acceptance Criteria:**
- ✅ FEN derived from PGN matches actual puzzle position
- ✅ Function handles edge cases without crashing
- ✅ Works correctly for puzzles at any ply count

---

### Milestone 1.3: Solution Conversion Logic
**Estimated Time:** 45 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Implement `convertLichessSolution(lichessSolution, startingFen)` function
  - [ ] Parse UCI moves from Lichess solution array
  - [ ] Convert each UCI move to {uci, san} format using chess.js
  - [ ] Handle promotion moves correctly
  - [ ] Validate move legality
- [ ] Test with various solution types:
  - [ ] Standard moves
  - [ ] Promotion moves (e7e8q, a7a8r)
  - [ ] Capture moves
  - [ ] Castling (if applicable)
- [ ] Add error handling for illegal moves

**Acceptance Criteria:**
- ✅ All Lichess UCI moves are converted to correct SAN notation
- ✅ Promotion moves are handled correctly
- ✅ Invalid moves throw descriptive errors
- ✅ Converted solution matches builder's expected format

---

## Phase 2: UI Components (1.5-2 hours)

### Milestone 2.1: Import Dialog UI
**Estimated Time:** 1 hour
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Update `builder/index.html`:
  - [ ] Add "Import from Lichess" menu item to dropdown
  - [ ] Create import dialog HTML structure
  - [ ] Add input field for puzzle ID/URL
  - [ ] Add cancel/import buttons
  - [ ] Add example text for user guidance
- [ ] Update `builder/builder.css`:
  - [ ] Style import dialog (modal overlay, centered box)
  - [ ] Style input field
  - [ ] Style buttons (primary/secondary)
  - [ ] Add loading state styles (spinner, disabled state)
  - [ ] Ensure responsive design (mobile-friendly)
- [ ] Match existing builder dialog styles (HTML snippet dialog)

**Acceptance Criteria:**
- ✅ Dialog opens smoothly when menu item clicked
- ✅ Dialog has clean, professional appearance
- ✅ Dialog is centered on screen with overlay
- ✅ Dialog matches existing builder design language
- ✅ Responsive on mobile devices

---

### Milestone 2.2: Dialog Interaction & State Management
**Estimated Time:** 30 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Update `builder/builder.js`:
  - [ ] Add event listener for "Import from Lichess" menu item
  - [ ] Implement `showLichessImportDialog()` function
  - [ ] Implement `closeLichessImportDialog()` function
  - [ ] Add Esc key handler to close dialog
  - [ ] Add overlay click handler to close dialog
  - [ ] Add Enter key handler to submit import
  - [ ] Implement focus trap (Tab key navigation)
  - [ ] Auto-focus input field when dialog opens

**Acceptance Criteria:**
- ✅ Dialog opens/closes smoothly
- ✅ Keyboard navigation works (Tab, Enter, Esc)
- ✅ Focus trap prevents tabbing outside dialog
- ✅ Input field is auto-focused on open

---

### Milestone 2.3: Loading & Error States
**Estimated Time:** 30 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Add loading state UI to dialog:
  - [ ] Show spinner during API fetch
  - [ ] Disable input and buttons while loading
  - [ ] Display "Fetching puzzle from Lichess..." message
- [ ] Add error state UI to dialog:
  - [ ] Display inline error messages
  - [ ] Style error messages (red text, icon)
  - [ ] Keep dialog open on error
  - [ ] Clear error when user types in input
- [ ] Implement toast notifications for success

**Acceptance Criteria:**
- ✅ Loading state appears immediately when import starts
- ✅ Error messages are clear and actionable
- ✅ Success toast appears after successful import
- ✅ Dialog closes automatically on success

---

## Phase 3: Integration & State Updates (1 hour)

### Milestone 3.1: State Management Updates
**Estimated Time:** 30 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Update `builder/modules/state.js`:
  - [ ] Add new metadata fields: `lichessId`, `lichessGameId`, `lichessRating`
  - [ ] Update default state to include new fields
- [ ] Implement `importLichessPuzzle(data)` function:
  - [ ] Call `deriveFenFromLichessPuzzle()` to get FEN
  - [ ] Call `convertLichessSolution()` to get solution
  - [ ] Map rating to difficulty level
  - [ ] Update all state fields (fen, solution, meta)
  - [ ] Reinitialize chess.js instance with new FEN
  - [ ] Call `autoSave()` to persist to localStorage
- [ ] Trigger UI updates after import

**Acceptance Criteria:**
- ✅ All state fields are updated correctly after import
- ✅ chess.js instance is reinitialized with correct FEN
- ✅ Builder UI reflects imported puzzle data
- ✅ Auto-save captures new state

---

### Milestone 3.2: UI Synchronization
**Estimated Time:** 30 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] After import, update all UI components:
  - [ ] Update board editor with new FEN
  - [ ] Update FEN display
  - [ ] Update solution list (should be empty initially)
  - [ ] Update metadata fields (title, tags, difficulty)
  - [ ] Update preview widget
  - [ ] Rebuild chessground board
- [ ] Switch to "Board Editor" mode after import
- [ ] Clear any active palette pieces or recording state
- [ ] Show success toast with puzzle ID

**Acceptance Criteria:**
- ✅ Board displays correct position after import
- ✅ All metadata fields are populated
- ✅ Solution is loaded into state (but not displayed in solution list until recording)
- ✅ Preview widget shows correct starting position
- ✅ Builder is in clean state, ready for editing

---

## Phase 4: Export & Persistence (30 minutes)

### Milestone 4.1: JSON Export Updates
**Estimated Time:** 30 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Update `builder/modules/persistence.js`:
  - [ ] Modify `exportToJson()` to include Lichess metadata
  - [ ] Add `lichess` nested object in exported JSON:
    - [ ] `puzzleId`
    - [ ] `gameId`
    - [ ] `rating`
    - [ ] `plays` (optional, if stored)
    - [ ] `themes` (array)
  - [ ] Ensure backward compatibility (existing puzzles without Lichess data)
- [ ] Update `importFromJson()` to read Lichess metadata
- [ ] Test export/import cycle with Lichess puzzle

**Acceptance Criteria:**
- ✅ Exported JSON includes Lichess metadata
- ✅ Imported JSON correctly reads Lichess metadata
- ✅ Non-Lichess puzzles export/import without errors
- ✅ Round-trip (export → import) preserves all data

---

## Phase 5: Error Handling & Edge Cases (1 hour)

### Milestone 5.1: Comprehensive Error Handling
**Estimated Time:** 45 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Implement error handling for all failure modes:
  - [ ] Network errors (offline, timeout)
  - [ ] HTTP errors (404, 500)
  - [ ] Invalid puzzle data (missing fields)
  - [ ] Invalid PGN (chess.js parse failure)
  - [ ] Invalid solution moves (illegal moves)
  - [ ] Empty solution array
  - [ ] Missing initialPly
- [ ] Add user-friendly error messages for each case
- [ ] Test error handling with mock API responses
- [ ] Add try-catch blocks around all critical operations

**Acceptance Criteria:**
- ✅ All error cases display helpful messages
- ✅ No unhandled exceptions or crashes
- ✅ Dialog remains open on error (user can retry)
- ✅ Error messages guide user on how to fix the issue

---

### Milestone 5.2: Overwrite Confirmation
**Estimated Time:** 15 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Implement "unsaved changes" detection:
  - [ ] Check if state has been modified (non-default values)
  - [ ] Check if solution is non-empty
  - [ ] Check if metadata has been edited
- [ ] Show confirmation dialog before importing:
  - [ ] "You have unsaved changes. Continue?"
  - [ ] Cancel / Yes, Import buttons
- [ ] Only show confirmation if state is "dirty"
- [ ] Skip confirmation if starting from fresh state

**Acceptance Criteria:**
- ✅ Confirmation appears when user has unsaved work
- ✅ Confirmation does not appear on fresh builder
- ✅ User can cancel import to keep current work
- ✅ User can proceed to overwrite existing puzzle

---

## Phase 6: Testing & Polish (1-1.5 hours)

### Milestone 6.1: Functional Testing
**Estimated Time:** 45 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Test valid import scenarios:
  - [ ] Import by puzzle ID: `sUum4`
  - [ ] Import by training URL: `https://lichess.org/training/sUum4`
  - [ ] Import by API URL: `https://lichess.org/api/puzzle/sUum4`
  - [ ] Import multiple puzzles sequentially
  - [ ] Import puzzle, edit, export, verify JSON
- [ ] Test error scenarios:
  - [ ] Invalid puzzle ID: `xxxInvalidxxx`
  - [ ] Non-existent puzzle: `99999999`
  - [ ] Malformed URL
  - [ ] Network offline (airplane mode)
- [ ] Test edge cases:
  - [ ] Puzzle with promotion in solution
  - [ ] Puzzle with 10+ move solution
  - [ ] Puzzle with very low rating (<500)
  - [ ] Puzzle with very high rating (>2500)
  - [ ] Puzzle with no themes
- [ ] Test UX flows:
  - [ ] Keyboard navigation (Tab, Enter, Esc)
  - [ ] Overwrite confirmation
  - [ ] Success/error feedback

**Acceptance Criteria:**
- ✅ All valid import scenarios work correctly
- ✅ All error scenarios are handled gracefully
- ✅ All edge cases pass without errors
- ✅ UX flows are smooth and intuitive

---

### Milestone 6.2: Cross-Browser Testing
**Estimated Time:** 15 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Test in major browsers:
  - [ ] Chrome/Edge (Chromium)
  - [ ] Firefox
  - [ ] Safari (if available)
- [ ] Verify Fetch API compatibility (all modern browsers)
- [ ] Verify CSS styles render correctly
- [ ] Verify keyboard navigation works

**Acceptance Criteria:**
- ✅ Feature works in Chrome/Edge
- ✅ Feature works in Firefox
- ✅ Feature works in Safari (if tested)
- ✅ No browser-specific bugs

---

### Milestone 6.3: Code Quality & Documentation
**Estimated Time:** 30 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Code review & cleanup:
  - [ ] Remove console.log statements (or convert to proper logging)
  - [ ] Add JSDoc comments to all functions
  - [ ] Ensure consistent code style
  - [ ] Extract magic numbers to named constants
- [ ] Update documentation:
  - [ ] Add usage instructions to README (if exists)
  - [ ] Document new state fields
  - [ ] Document new JSON export format
  - [ ] Add inline comments for complex logic
- [ ] Performance check:
  - [ ] Ensure no unnecessary re-renders
  - [ ] Verify API calls are not duplicated
  - [ ] Test with slow network (throttle in DevTools)

**Acceptance Criteria:**
- ✅ Code is clean, readable, and well-documented
- ✅ No unnecessary console output
- ✅ Performance is acceptable on slow connections
- ✅ Documentation is up-to-date

---

## Phase 7: Final Review & Deployment (30 minutes)

### Milestone 7.1: Final Acceptance Testing
**Estimated Time:** 20 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Run through complete user journey:
  1. [ ] Open builder
  2. [ ] Click "Import from Lichess"
  3. [ ] Enter puzzle ID
  4. [ ] Wait for import
  5. [ ] Verify puzzle loads correctly
  6. [ ] Edit puzzle (add/modify solution)
  7. [ ] Export to JSON
  8. [ ] Export to HTML
  9. [ ] Verify exported data is correct
- [ ] Test with 5 different Lichess puzzles
- [ ] Verify no regressions in existing builder features

**Acceptance Criteria:**
- ✅ Complete user journey works end-to-end
- ✅ No regressions in existing features
- ✅ All acceptance criteria from spec are met

---

### Milestone 7.2: Deploy to Production
**Estimated Time:** 10 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Run production build: `npm run build`
- [ ] Test production build with dev server: `npm run dev:prod`
- [ ] Verify all features work with minified files
- [ ] Deploy to hosting (if applicable)
- [ ] Update builder demo page (if exists)

**Acceptance Criteria:**
- ✅ Production build succeeds without errors
- ✅ Minified files work correctly
- ✅ Feature is live and accessible

---

## Progress Tracking

### Overall Status
- **Total Phases:** 7
- **Completed:** 0 ⬜
- **In Progress:** 0 🔄
- **Not Started:** 7 ⬜

### Time Tracking
- **Estimated Total Time:** 5-7 hours
- **Actual Time Spent:** 0 hours
- **Remaining Time:** 5-7 hours

---

## Quick Start Checklist

Ready to start implementing? Follow this sequence:

1. ✅ Read the full spec: `specs/lichess-import-feature.md`
2. ⬜ Create `builder/modules/lichess-import.js`
3. ⬜ Implement API fetch function
4. ⬜ Implement FEN derivation function
5. ⬜ Implement solution conversion function
6. ⬜ Test core logic with sample puzzles
7. ⬜ Add UI dialog to `index.html`
8. ⬜ Style dialog in `builder.css`
9. ⬜ Wire up events in `builder.js`
10. ⬜ Implement state updates
11. ⬜ Implement export updates
12. ⬜ Add error handling
13. ⬜ Test thoroughly
14. ⬜ Deploy!

---

## Notes & Decisions

**Date:** 2025-10-11
**Decision Log:**

- **Difficulty Mapping:** Decided to map Lichess ratings to 5 difficulty levels (beginner, intermediate, advanced, expert, master) rather than storing raw ratings.
- **Metadata Preservation:** Decided to preserve original Lichess rating in `meta.lichessRating` even after mapping to difficulty.
- **Solution Format:** Lichess solutions will be converted to builder's `{uci, san}` format on import, not stored in original UCI-only format.
- **Overwrite Behavior:** Decided to show confirmation dialog when importing over existing puzzle work, rather than auto-saving old puzzle first.

**Risks & Mitigations:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Lichess API changes format | High | Add version detection; graceful degradation |
| CORS blocks requests | High | Test CORS early; have proxy fallback plan |
| PGN parsing fails | Medium | Extensive error handling; test with various puzzle types |
| Invalid solution moves | Medium | Validate each move; show descriptive errors |
| Network timeout | Low | Implement configurable timeout; show loading state |

---

## Future Enhancements Backlog

**Not in scope for v1, but consider for future versions:**

1. **Puzzle Search Interface**
   - Browse Lichess puzzle database by theme/rating
   - Search by keywords
   - "Random puzzle" button

2. **Batch Import**
   - Import multiple puzzles from CSV
   - Import puzzle collections

3. **Enhanced Metadata**
   - Import player names and ratings
   - Show game clock time control
   - Link to original game on Lichess

4. **Auto-Update**
   - Check for updated puzzle data (plays count, rating changes)
   - Sync changes from Lichess

5. **Export to Lichess**
   - Submit custom puzzles to Lichess (requires authentication)

---

## Contact & Support

**Questions or Issues?**
- See spec: `specs/lichess-import-feature.md`
- Lichess API docs: https://lichess.org/api
- chess.js docs: https://github.com/jhlywa/chess.js

**Last Updated:** 2025-10-11
