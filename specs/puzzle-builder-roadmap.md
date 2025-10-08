# Chess Puzzle Builder - Development Roadmap

## Phase 1: Foundation ✅
- [x] Create builder project structure and scaffold HTML/CSS layout
- [x] Add `dev:builder` script to package.json for Vite dev server on port 3002
- [x] Set up two-column layout (editor left, preview/export right)
- [x] Initialize state management object (fen, chess instance, solution array, metadata)
- [x] Implement basic UI components (header, panels, containers)

## Phase 2: Board Editor ✅
- [x] Create piece palette UI (white/black pieces)
- [x] Implement piece placement/removal (click palette → click square, right-click to remove)
- [x] Add FEN composition/decomposition utilities
- [x] Implement side-to-move toggle
- [x] Add castling rights checkboxes (KQkq)
- [x] Add en-passant square input with validation
- [x] Add halfmove/fullmove counter inputs
- [x] Implement FEN validation and live preview display
- [x] Add "Empty Board", "Start Position", and "Flip Board" buttons

## Phase 3: Solution Editor ✅
- [x] Implement "Start/Stop Recording" mode toggle
- [x] Capture legal moves during recording (UCI + SAN)
- [x] Display solution move list with index, SAN, UCI columns
- [x] Add "Delete ply" functionality
- [x] Add "Rewind to ply" functionality
- [x] Add "Truncate from here" functionality
- [x] Implement solution validation (legality from starting FEN)

## Phase 4: Live Preview ✅
- [x] Integrate ChessWidget in preview panel
- [x] Bind current FEN/solution to preview widget
- [x] Auto-update preview on state changes
- [x] Sync theme/width settings to preview (autoFlip removed - not suitable for puzzles)

## Phase 5: Metadata & Settings ✅
- [x] Add title input field
- [x] Add description/tags inputs
- [x] Add difficulty selector
- [x] Add theme selector (blue, brown, etc.)
- [x] Add width input
- [x] ~~Add auto-flip toggle~~ (removed - not suitable for puzzles)

## Phase 6: Export ✅
- [x] Implement HTML snippet generator
- [x] Implement JSON export format
- [x] Add "Copy to Clipboard" functionality
- [x] Add "Download JSON" functionality
- [x] Add validation checks before export (FEN validity, solution legality, color alignment)

## Phase 7: Persistence ✅
- [x] Implement auto-save to localStorage (debounced 300ms)
- [x] Add "New Puzzle" functionality
- [x] Add "Load from JSON" functionality
- [x] Add "Save As JSON" functionality
- [ ] (Optional) Add PGN import with ply slider

## Phase 8: Polish & Validation ✅
- [x] Add toast notifications for errors/warnings
- [x] Implement illegal move detection during recording
- [x] Add FEN/solution validation warnings
- [x] Add castling rights vs piece placement warnings
- [x] Add checkmate/stalemate detection (included in validation)
- [ ] Test with multiple puzzles and edge cases

---

## Project Structure

**Location:** `builder/` (separate top-level folder)

**Rationale:**
- Separate concern: Builder is a tool to create puzzles, not part of the widget library
- Different build target: Builder needs its own HTML page
- Clear separation: Widget library users won't need builder code
- Easy deployment: Can deploy builder separately

**Actual structure:**
```
builder/
  ├── index.html              # Builder UI page
  ├── builder.js              # Main entry point & coordinator (157 lines)
  ├── builder.css             # Builder-specific styles
  └── modules/
      ├── state.js            # Global state management (20 lines)
      ├── ui-utils.js         # Toast notifications, UI helpers (51 lines)
      ├── fen-utils.js        # FEN composition/decomposition (85 lines)
      ├── board-editor.js     # Board editing, piece placement/removal (281 lines)
      ├── solution-editor.js  # Solution recording & management (104 lines)
      ├── preview.js          # Preview widget updates (53 lines)
      └── persistence.js      # LocalStorage, import/export (147 lines)
```

**Key Features:**
- Modular ES6 architecture with clear separation of concerns
- All modules under 300 lines for maintainability
- References bundled widget from `dist/` for live preview
- Dual mode system: Board Setup & Solution Recording
- Vite dev server on port 3002 (`npm run dev:builder`)
