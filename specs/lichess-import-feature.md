# Lichess Puzzle Import Feature Specification

## Overview

Add functionality to import chess puzzles directly from Lichess.org into the puzzle builder. This will allow users to quickly load existing puzzles from Lichess's extensive database and edit/customize them for their own use.

---

## API Endpoint

**Lichess Puzzle API:**
- Base URL: `https://lichess.org/api/puzzle/{puzzleId}`
- Example: `https://lichess.org/api/puzzle/sUum4`
- Method: GET
- Response: JSON
- Authentication: Not required (public API)

---

## Lichess JSON Structure

Based on analysis of `https://lichess.org/api/puzzle/sUum4`:

```json
{
  "game": {
    "id": "49V4Fb9f",
    "perf": {
      "key": "rapid",
      "name": "Rapid"
    },
    "rated": true,
    "players": [
      {
        "name": "Player1",
        "id": "player1id",
        "color": "white",
        "rating": 1500
      },
      {
        "name": "Player2",
        "id": "player2id",
        "color": "black",
        "rating": 1480
      }
    ],
    "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...",
    "clock": "10+0"
  },
  "puzzle": {
    "id": "sUum4",
    "rating": 1000,
    "plays": 1354,
    "solution": ["e4d5", "c6d4", "d5c6"],
    "themes": ["mateIn2", "middlegame", "short"],
    "initialPly": 50
  }
}
```

---

## Field Mapping: Lichess → Builder

| Lichess Field | Builder Field | Transformation |
|--------------|---------------|----------------|
| `puzzle.id` | `meta.lichessId` | Direct copy (new field) |
| `puzzle.rating` | `meta.difficulty` | Map to difficulty levels (see below) |
| `puzzle.themes` | `meta.tags` | Convert array to comma-separated string |
| `puzzle.solution` | `solution[]` | Convert UCI strings to `{uci, san}` objects |
| Derived from PGN | `fen` | Parse PGN, navigate to `initialPly`, extract FEN |
| `game.id` | `meta.lichessGameId` | Direct copy (new field) |
| `game.pgn` | — | Used temporarily to derive FEN |

### Difficulty Mapping

Map Lichess ratings to builder difficulty levels:

| Lichess Rating Range | Builder Difficulty |
|---------------------|-------------------|
| < 1000 | `beginner` |
| 1000 - 1499 | `intermediate` |
| 1500 - 1999 | `advanced` |
| 2000 - 2499 | `expert` |
| ≥ 2500 | `master` |

---

## FEN Derivation Logic

The starting FEN for the puzzle is **not** provided directly in the Lichess API response. It must be derived:

1. Parse `game.pgn` using chess.js: `chess.loadPgn(pgn)`
2. Navigate to the position **before** the puzzle starts:
   - `puzzle.initialPly` indicates the half-move number where the puzzle begins
   - Example: `initialPly: 50` means the puzzle starts at move 50 (half-moves are counted from 0)
3. Replay moves up to `initialPly - 1` (the move before the puzzle)
4. Extract FEN: `chess.fen()`

**Implementation:**
```javascript
function deriveFenFromLichessPuzzle(pgn, initialPly) {
  const chess = new Chess();
  chess.loadPgn(pgn);

  // Get the move history
  const history = chess.history({ verbose: true });

  // Reset to starting position
  chess.reset();

  // Replay moves up to initialPly
  for (let i = 0; i < initialPly; i++) {
    if (history[i]) {
      chess.move(history[i]);
    }
  }

  return chess.fen();
}
```

---

## Solution Conversion Logic

Lichess provides solutions as UCI notation only. We need to convert to `{uci, san}` format:

**Implementation:**
```javascript
function convertLichessSolution(lichessSolution, startingFen) {
  const chess = new Chess(startingFen);
  const converted = [];

  for (const uciMove of lichessSolution) {
    // Parse UCI notation: "e2e4", "e7e5q" (with promotion)
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length === 5 ? uciMove[4] : undefined;

    const move = chess.move({ from, to, promotion });

    if (!move) {
      throw new Error(`Invalid move in solution: ${uciMove}`);
    }

    converted.push({
      uci: uciMove,
      san: move.san
    });
  }

  return converted;
}
```

---

## UI/UX Design

### 1. Dropdown Menu Addition

Add a new menu item to the existing dropdown in the builder header:

**Current menu items:**
- Load JSON
- Save As JSON
- Copy HTML Snippet
- Download JSON

**Add:**
- **Import from Lichess** (new item)

### 2. Import Dialog

When "Import from Lichess" is clicked, show a modal dialog:

**Dialog Structure:**

```
┌─────────────────────────────────────────────────┐
│  Import Puzzle from Lichess               [×]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Lichess Puzzle ID or URL:                      │
│  ┌─────────────────────────────────────────┐   │
│  │ sUum4                                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Examples:                                      │
│  • Puzzle ID: sUum4                             │
│  • Full URL: https://lichess.org/training/sUum4│
│  • API URL: https://lichess.org/api/puzzle/sUum4│
│                                                 │
│              [Cancel]  [Import Puzzle]          │
└─────────────────────────────────────────────────┘
```

**Input Validation:**
- Accept puzzle ID only: `sUum4`
- Accept training URL: `https://lichess.org/training/sUum4`
- Accept API URL: `https://lichess.org/api/puzzle/sUum4`
- Extract puzzle ID using regex: `/(?:puzzle|training)\/([A-Za-z0-9]+)/` or just validate alphanumeric

### 3. Loading State

While fetching from API:

```
┌─────────────────────────────────────────────────┐
│  Import Puzzle from Lichess               [×]   │
├─────────────────────────────────────────────────┤
│                                                 │
│           [Loading spinner]                     │
│                                                 │
│      Fetching puzzle from Lichess...            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4. Success/Error Feedback

**On Success:**
- Close dialog
- Show toast: "Puzzle sUum4 imported successfully!"
- Populate all builder fields (FEN, solution, metadata)
- Update preview
- Auto-save to localStorage

**On Error:**
- Keep dialog open
- Show error message inline in dialog:
  - "Puzzle not found. Check the ID and try again."
  - "Failed to fetch from Lichess. Check your internet connection."
  - "Invalid puzzle data received."

---

## State Updates After Import

When a puzzle is successfully imported, update the builder state:

```javascript
state.fen = derivedFen;
state.chess = new Chess(state.fen);
state.solution = convertedSolution;
state.meta.title = `Lichess Puzzle #${puzzle.id}`;
state.meta.tags = puzzle.themes.join(', ');
state.meta.difficulty = mapRatingToDifficulty(puzzle.rating);
state.meta.lichessId = puzzle.id;
state.meta.lichessGameId = game.id;
state.meta.lichessRating = puzzle.rating;
```

**New metadata fields to add:**
- `lichessId`: The puzzle ID from Lichess
- `lichessGameId`: The game ID this puzzle came from
- `lichessRating`: The original Lichess rating (preserve even if mapped to difficulty)

These fields will be included in exported JSON for reference.

---

## Export Format Updates

### HTML Snippet Export

No changes needed - HTML export only uses FEN/solution/width/theme.

### JSON Export

Add Lichess metadata to exported JSON:

```json
{
  "version": 1,
  "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
  "solution": [
    { "uci": "e2e4", "san": "e4" },
    { "uci": "e7e5", "san": "e5" }
  ],
  "meta": {
    "title": "Lichess Puzzle #sUum4",
    "tags": ["mateIn2", "middlegame", "short"],
    "difficulty": "beginner",
    "theme": "blue",
    "width": 400,
    "autoFlip": true,
    "lichess": {
      "puzzleId": "sUum4",
      "gameId": "49V4Fb9f",
      "rating": 1000,
      "plays": 1354,
      "themes": ["mateIn2", "middlegame", "short"]
    }
  }
}
```

---

## Error Handling

### Network Errors

```javascript
try {
  const response = await fetch(`https://lichess.org/api/puzzle/${puzzleId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Puzzle not found. Check the ID and try again.');
    } else if (response.status >= 500) {
      throw new Error('Lichess server error. Try again later.');
    } else {
      throw new Error(`HTTP error: ${response.status}`);
    }
  }

  const data = await response.json();
  // Process data...

} catch (error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    showError('Network error. Check your internet connection.');
  } else {
    showError(error.message);
  }
}
```

### Data Validation Errors

Validate the API response structure:

```javascript
function validateLichessResponse(data) {
  if (!data.puzzle || !data.game) {
    throw new Error('Invalid puzzle data received.');
  }

  if (!data.puzzle.solution || data.puzzle.solution.length === 0) {
    throw new Error('Puzzle has no solution moves.');
  }

  if (!data.game.pgn) {
    throw new Error('Game PGN not available.');
  }

  if (data.puzzle.initialPly === undefined) {
    throw new Error('Initial ply not specified.');
  }

  return true;
}
```

### Chess.js Errors

Handle errors when parsing PGN or converting moves:

```javascript
try {
  const fen = deriveFenFromLichessPuzzle(data.game.pgn, data.puzzle.initialPly);
  const solution = convertLichessSolution(data.puzzle.solution, fen);
} catch (error) {
  throw new Error(`Failed to process puzzle: ${error.message}`);
}
```

---

## CORS Considerations

Lichess API should allow CORS requests from any origin. If CORS issues arise during development:

**Option 1: Use a CORS proxy (development only)**
```javascript
const CORS_PROXY = 'https://corsproxy.io/?';
const url = `${CORS_PROXY}https://lichess.org/api/puzzle/${puzzleId}`;
```

**Option 2: Fetch from server-side** (if hosting a backend)
- Not needed for initial implementation; Lichess API is CORS-friendly

**Testing:**
Test with browser console:
```javascript
fetch('https://lichess.org/api/puzzle/sUum4')
  .then(r => r.json())
  .then(console.log);
```

---

## User Confirmation on Overwrite

If the builder already has a puzzle loaded (non-empty state), show a confirmation dialog before importing:

```
┌─────────────────────────────────────────────────┐
│  Confirm Overwrite                        [×]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  You have unsaved changes.                      │
│                                                 │
│  Importing a new puzzle will replace your       │
│  current work. Continue?                        │
│                                                 │
│              [Cancel]  [Yes, Import]            │
└─────────────────────────────────────────────────┘
```

---

## Accessibility & Keyboard Support

- Dialog should be accessible via keyboard (Tab, Enter, Esc)
- Esc key closes the dialog
- Enter key submits the import (when input is focused)
- Focus trap within dialog while open
- Auto-focus the input field when dialog opens

---

## Testing Checklist

### Valid Imports
- [ ] Import by puzzle ID only: `sUum4`
- [ ] Import by training URL: `https://lichess.org/training/sUum4`
- [ ] Import by API URL: `https://lichess.org/api/puzzle/sUum4`
- [ ] Import multiple different puzzles sequentially
- [ ] Verify FEN is correct (matches Lichess puzzle position)
- [ ] Verify solution moves are converted correctly (UCI → {uci, san})
- [ ] Verify tags/themes are imported
- [ ] Verify difficulty is mapped correctly
- [ ] Verify preview widget updates correctly
- [ ] Verify metadata fields are populated

### Error Handling
- [ ] Invalid puzzle ID: `xxxInvalidxxx`
- [ ] Non-existent puzzle ID: `99999999`
- [ ] Malformed URL input
- [ ] Network offline
- [ ] API timeout (simulate slow connection)

### Edge Cases
- [ ] Puzzle with promotion move in solution (e.g., `e7e8q`)
- [ ] Puzzle with long solution (10+ moves)
- [ ] Puzzle from endgame position
- [ ] Puzzle with no themes
- [ ] Puzzle with very high/low rating

### UX
- [ ] Dialog opens and closes smoothly
- [ ] Loading state displays during fetch
- [ ] Success toast appears after import
- [ ] Error messages are clear and helpful
- [ ] Overwrite confirmation works when state is not empty
- [ ] Keyboard navigation works (Tab, Enter, Esc)

---

## Future Enhancements (Out of Scope for v1)

1. **Puzzle Search/Browse**
   - Integration with Lichess puzzle database search
   - Filter by rating range, themes, etc.
   - Browse popular/recent puzzles

2. **Batch Import**
   - Import multiple puzzles at once
   - CSV file with puzzle IDs

3. **Auto-Detection**
   - Detect Lichess URLs from clipboard
   - One-click import from copied URL

4. **Puzzle History**
   - Keep track of imported puzzles
   - Quick re-import from history

5. **Enhanced Metadata**
   - Import player names/ratings
   - Import game clock settings
   - Link to original game on Lichess

---

## Technical Dependencies

**Required:**
- chess.js (already available)
- Fetch API (native browser API)

**No additional dependencies needed.**

---

## File Changes Summary

**New Files:**
- `builder/modules/lichess-import.js` - Import logic and API communication

**Modified Files:**
- `builder/index.html` - Add dialog markup, update dropdown menu
- `builder/builder.css` - Dialog styles
- `builder/builder.js` - Wire up menu item and dialog events
- `builder/modules/state.js` - Add new metadata fields
- `builder/modules/persistence.js` - Update JSON export to include Lichess metadata

---

## Acceptance Criteria

**Feature is complete when:**

1. ✅ "Import from Lichess" menu item is added to dropdown
2. ✅ Clicking menu item opens import dialog
3. ✅ Dialog accepts puzzle ID, training URL, or API URL
4. ✅ Dialog shows loading state during fetch
5. ✅ Successful import populates FEN, solution, and metadata
6. ✅ Preview updates automatically after import
7. ✅ Error messages are shown for invalid inputs or network errors
8. ✅ Confirmation dialog appears if overwriting existing puzzle
9. ✅ Imported puzzles can be edited just like manually-created ones
10. ✅ Exported JSON includes Lichess metadata for reference
11. ✅ All error cases are handled gracefully
12. ✅ Feature works with all tested puzzle types (mate puzzles, tactical puzzles, endgames)

---

## References

- Lichess API Documentation: https://lichess.org/api
- Lichess Puzzle API: https://lichess.org/api#tag/Puzzles/operation/apiPuzzleId
- chess.js Documentation: https://github.com/jhlywa/chess.js
