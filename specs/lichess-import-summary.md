# Lichess Import Feature - Executive Summary

## What This Feature Does

Allows users to import chess puzzles from Lichess.org directly into the puzzle builder by simply entering a puzzle ID or URL. This makes it easy to use Lichess's extensive puzzle database as a starting point for creating custom puzzles.

---

## How It Works (User Perspective)

1. **User clicks "Import from Lichess" in the dropdown menu**
2. **Enters puzzle ID or URL** (e.g., `sUum4` or `https://lichess.org/training/sUum4`)
3. **Clicks "Import Puzzle"**
4. **Builder automatically loads:**
   - The chess position (FEN)
   - The solution moves
   - Puzzle metadata (rating, themes/tags)
5. **User can now edit, customize, and export** the puzzle

---

## Key Features

### ✅ Multiple Input Formats
- Puzzle ID only: `sUum4`
- Training URL: `https://lichess.org/training/sUum4`
- API URL: `https://lichess.org/api/puzzle/sUum4`

### ✅ Automatic Data Conversion
- Derives correct chess position from game PGN
- Converts Lichess UCI moves to builder's format (UCI + SAN)
- Maps Lichess rating to difficulty levels
- Imports themes as tags

### ✅ Robust Error Handling
- Clear error messages for invalid puzzle IDs
- Network error detection and feedback
- Handles malformed data gracefully
- Validates all moves before importing

### ✅ Smart UX
- Loading states during API fetch
- Success/error toast notifications
- Confirmation dialog if overwriting existing work
- Keyboard navigation support (Tab, Enter, Esc)

---

## Technical Implementation

### Core Components

**New Module:** `builder/modules/lichess-import.js`
- `fetchLichessPuzzle(puzzleId)` - Fetches from Lichess API
- `deriveFenFromLichessPuzzle(pgn, initialPly)` - Extracts position from PGN
- `convertLichessSolution(solution, fen)` - Converts UCI to {uci, san} format

**UI Changes:**
- New "Import from Lichess" menu item
- Modal dialog for puzzle ID input
- Loading and error states

**State Updates:**
- New metadata fields: `lichessId`, `lichessGameId`, `lichessRating`
- Enhanced JSON export with Lichess attribution

### Data Flow

```
User Input → Extract Puzzle ID → Fetch from Lichess API
                                          ↓
                                    Parse Response
                                          ↓
                         ┌────────────────┴────────────────┐
                         ↓                                 ↓
                  Derive FEN from PGN            Convert Solution Moves
                  (using initialPly)              (UCI → {uci, san})
                         ↓                                 ↓
                         └────────────────┬────────────────┘
                                          ↓
                                  Update Builder State
                                          ↓
                            Update UI (Board, Preview, Metadata)
                                          ↓
                                      Auto-Save
```

---

## Lichess API Integration

### Endpoint
```
GET https://lichess.org/api/puzzle/{puzzleId}
```

### Sample Response (sUum4)
```json
{
  "game": {
    "id": "49V4Fb9f",
    "pgn": "1. e4 e5 2. Nf3...",
    "players": [...],
    "clock": "10+0"
  },
  "puzzle": {
    "id": "sUum4",
    "rating": 1000,
    "solution": ["e4d5", "c6d4", "d5c6"],
    "themes": ["mateIn2", "middlegame", "short"],
    "initialPly": 50
  }
}
```

### Field Mapping
| Lichess | Builder | Transform |
|---------|---------|-----------|
| `puzzle.id` | `meta.lichessId` | Direct copy |
| `puzzle.rating` | `meta.difficulty` | Map to level |
| `puzzle.themes` | `meta.tags` | Join with commas |
| `puzzle.solution` | `solution[]` | UCI → {uci, san} |
| Derived from PGN | `fen` | Parse PGN at initialPly |

---

## Development Roadmap

### Phase 1: Core Logic (2-3 hours)
- ✅ API fetch function
- ✅ FEN derivation from PGN
- ✅ Solution conversion (UCI → {uci, san})

### Phase 2: UI Components (1.5-2 hours)
- ✅ Import dialog design
- ✅ Loading/error states
- ✅ Keyboard navigation

### Phase 3: Integration (1 hour)
- ✅ State management updates
- ✅ UI synchronization
- ✅ Preview updates

### Phase 4: Export (30 minutes)
- ✅ JSON export with Lichess metadata

### Phase 5: Error Handling (1 hour)
- ✅ Network errors
- ✅ Invalid data
- ✅ Overwrite confirmation

### Phase 6: Testing (1-1.5 hours)
- ✅ Functional testing
- ✅ Edge cases
- ✅ Cross-browser testing

### Phase 7: Deployment (30 minutes)
- ✅ Production build
- ✅ Final acceptance testing

**Total Estimated Time:** 5-7 hours

---

## Testing Strategy

### Valid Import Scenarios
- Import by ID: `sUum4`
- Import by training URL: `https://lichess.org/training/sUum4`
- Import by API URL: `https://lichess.org/api/puzzle/sUum4`
- Import multiple puzzles sequentially
- Edit imported puzzle and re-export

### Error Scenarios
- Invalid puzzle ID
- Non-existent puzzle (404)
- Network offline
- Malformed API response
- Invalid PGN data

### Edge Cases
- Puzzle with promotion moves (e7e8q)
- Puzzle with 10+ move solution
- Puzzle with no themes
- Puzzle with extreme ratings (<500, >2500)
- Opening/endgame puzzles

---

## Example Usage

### Before Import
```
Empty builder or existing puzzle in progress
```

### User Action
```
1. Click "⋮" menu → "Import from Lichess"
2. Enter: sUum4
3. Click "Import Puzzle"
```

### After Import
```
✅ Board shows puzzle position
✅ Metadata populated:
   - Title: "Lichess Puzzle #sUum4"
   - Tags: "mateIn2, middlegame, short"
   - Difficulty: "beginner" (from rating 1000)
✅ Solution loaded (not yet visible in solution list)
✅ Preview widget shows starting position
```

### Export Result (JSON)
```json
{
  "version": 1,
  "fen": "...",
  "solution": [
    {"uci": "e4d5", "san": "exd5"},
    {"uci": "c6d4", "san": "Nd4"},
    {"uci": "d5c6", "san": "dxc6"}
  ],
  "meta": {
    "title": "Lichess Puzzle #sUum4",
    "tags": ["mateIn2", "middlegame", "short"],
    "difficulty": "beginner",
    "lichess": {
      "puzzleId": "sUum4",
      "gameId": "49V4Fb9f",
      "rating": 1000,
      "themes": ["mateIn2", "middlegame", "short"]
    }
  }
}
```

---

## Benefits

### For Users
- **Fast puzzle creation:** Start with proven puzzles from Lichess
- **No manual data entry:** FEN and moves imported automatically
- **Quality starting point:** Lichess puzzles are battle-tested
- **Rich metadata:** Themes and difficulty pre-populated
- **Attribution preserved:** Original puzzle ID stored for reference

### For Developers
- **Modular design:** New module doesn't impact existing code
- **Reusable logic:** FEN derivation and move conversion can be used elsewhere
- **Well-tested:** Leverages chess.js for move validation
- **Extensible:** Easy to add more Lichess features later

---

## Future Enhancements

### Not in v1, but possible later:

1. **Puzzle Search/Browse**
   - Search Lichess database by theme/rating
   - Browse popular puzzles
   - "Random puzzle" button

2. **Batch Import**
   - Import multiple puzzles at once
   - CSV file upload

3. **Enhanced Metadata**
   - Import player names and ratings
   - Game clock settings
   - Link to original game

4. **Auto-Update**
   - Sync puzzle rating/plays from Lichess
   - Notify of updates to imported puzzles

5. **Two-Way Integration**
   - Export custom puzzles to Lichess
   - Submit user-created puzzles

---

## Dependencies

### Required (Already Available)
- ✅ chess.js - PGN parsing, move validation
- ✅ Fetch API - HTTP requests (native browser API)

### No Additional Dependencies Needed
- ❌ No new npm packages
- ❌ No CORS proxy needed (Lichess API is CORS-friendly)
- ❌ No authentication required (public API)

---

## Files Changed

### New Files
- `builder/modules/lichess-import.js` - Core import logic

### Modified Files
- `builder/index.html` - Dialog markup, menu item
- `builder/builder.css` - Dialog styles
- `builder/builder.js` - Event handlers, dialog management
- `builder/modules/state.js` - New metadata fields
- `builder/modules/persistence.js` - Enhanced JSON export

---

## Acceptance Criteria

**Feature is ready to ship when:**

1. ✅ "Import from Lichess" appears in dropdown menu
2. ✅ Dialog accepts ID, training URL, or API URL
3. ✅ Successful import populates FEN, solution, metadata
4. ✅ Preview updates correctly
5. ✅ Error messages are helpful and clear
6. ✅ Overwrite confirmation works
7. ✅ Exported JSON includes Lichess attribution
8. ✅ All error cases handled gracefully
9. ✅ Keyboard navigation works (Tab, Enter, Esc)
10. ✅ Feature tested with 10+ different puzzles
11. ✅ No regressions in existing builder features
12. ✅ Works in Chrome, Firefox, Safari

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lichess API changes | Low | High | Version detection; error handling |
| CORS issues | Low | High | Test early; have proxy plan |
| PGN parsing fails | Medium | Medium | Extensive validation; error messages |
| Invalid moves | Medium | Medium | chess.js validation; clear errors |
| Network timeout | Medium | Low | Loading states; configurable timeout |

---

## Documentation Links

📄 **Full Specification:** `specs/lichess-import-feature.md`
📋 **Implementation Roadmap:** `specs/lichess-import-roadmap.md`
🔗 **Lichess API Docs:** https://lichess.org/api

---

**Created:** 2025-10-11
**Status:** ✅ Specification Complete | ⬜ Implementation Not Started
**Estimated Effort:** 5-7 hours
**Priority:** Medium
