# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a chess widget library that creates interactive chess puzzles using chessground and chess.js. The widget is designed to be completely standalone - all dependencies are bundled, requiring no CDN calls or external resources.

## Core Architecture

### Modular Structure

The widget is now split into multiple modules for better maintainability:

**Core Modules (Phase 1):**
- **`src/widget-utils.js`**: Utility functions (delay, formatting, parsing)
- **`src/widget-i18n.js`**: Internationalization system (English, German)
- **`src/widget-solution-validator.js`**: Alternative solutions parser and validator
- **`src/widget-core.js`**: ChessWidget class definition and initialization
- **`src/widget-board.js`**: Board rendering, orientation, and Chessground integration
- **`src/widget-solution.js`**: Move validation, automatic moves, puzzle feedback
- **`src/chess-widget.js`**: Main entry point and auto-initialization

**Stockfish Integration (Phase 2):**
- **`src/widget-stockfish.js`**: Stockfish API client for best move analysis
- **`src/widget-cache.js`**: localStorage-based caching system to reduce API calls

### Build System

- **Custom Build System** (`build.js`):
  - Concatenates all widget modules in the correct dependency order
  - Bundles chess.js (CommonJS) and chessground (ES6) into browser-compatible code
  - Wraps modules with proper global variable assignments
  - Creates both minified and development versions
- **Dual Mode Development**: Vite dev server for development, standalone bundling for production

## Key Dependencies (Bundled)

- **chess.js v1.4.0**: Chess logic and move validation (wrapped as CommonJS → browser globals)
- **chessground v9.2.1**: Interactive chess board UI (wrapped as ES6 → browser globals)

## Development Commands

```bash
npm install           # Install dependencies
npm run dev          # Start Vite development server on port 3001 with live reload
npm run dev:prod     # Build first, then start dev server (test production build)
npm run build        # Create standalone production files in dist/
```

## Build Process

The custom build script (`build.js`) performs critical operations:

1. **Module Concatenation**: Combines widget modules in dependency order:
   - widget-utils.js → widget-i18n.js → widget-solution-validator.js → widget-cache.js → widget-stockfish.js → widget-core.js → widget-board.js → widget-solution.js → chess-widget.js
2. **Chess.js Wrapping**: Wraps CommonJS exports to create global `window.Chess`, `window.SQUARES`, etc.
3. **Chessground Wrapping**: Removes ES6 exports and creates global `window.Chessground` and `window.initChessground`
4. **CSS Bundling**: Combines chessground themes (base, brown, cburnett pieces) with custom widget styles
5. **File Generation**: Creates both minified (.min.js/.min.css) and development versions

## Widget Configuration

The widget reads HTML data attributes:

### Core Attributes
- `data-fen`: Chess position in FEN notation (required)
- `data-solution`: Solution moves - comma-separated, use `|` for alternative paths (optional)
- `data-width`: Board size in pixels (default: 400)
- `data-auto-flip`: Auto-rotate board for black's turn (default: false)
- `data-orientation`: Fixed orientation - 'white', 'black', or null for auto (optional)

### Phase 1 Features
- `data-lang`: Language code - 'en' (English, default) or 'de' (German)

### Phase 2 & 3 Features (Stockfish Integration)
- `data-stockfish-enabled`: Enable Stockfish counter-move feedback (default: false)
- `data-stockfish-depth`: Stockfish analysis depth, 1-20 (default: 12)
- `data-stockfish-timeout`: API request timeout in milliseconds (default: 2000)
- `data-stockfish-show-arrow`: Show red arrow for counter-move (default: true) ✨ Phase 3
- `data-stockfish-show-animation`: Animate counter-move (default: true)
- `data-stockfish-cache-enabled`: Enable localStorage caching (default: true)

### Alternative Solutions Example
```html
<!-- Multiple solution paths -->
<div class="chess-puzzle"
     data-solution="e2e4,e7e5,g1f3|e2e4,e7e5,f1c4">
     <!-- Both Nf3 and Bc4 are valid after e2e4 e7e5 -->
</div>
```

### Internationalization Example
```html
<!-- German language -->
<div class="chess-puzzle"
     data-lang="de">
</div>
```

### Stockfish Integration Example
```html
<!-- Enable Stockfish counter-move feedback -->
<div class="chess-puzzle"
     data-fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
     data-solution="e2e4,e7e5,g1f3,b8c6,f1c4"
     data-stockfish-enabled="true"
     data-stockfish-depth="12"
     data-stockfish-cache-enabled="true">
</div>
```

## Architecture Notes

- **Auto-initialization**: Widgets automatically initialize on DOM ready via `ChessWidget.init()`
- **Multiple Instances**: Supports multiple widgets on the same page
- **Move Validation**: Supports both UCI notation (e2e4) and SAN notation (Nf3)
- **Alternative Solutions**: Puzzles can accept multiple solution paths using pipe `|` separator
- **Internationalization**: Built-in support for English and German, extensible for more languages
- **Stockfish Integration**: Optional counter-move feedback when user makes wrong move
- **Intelligent Caching**: localStorage-based caching system with expiration and quota management
- **State Management**: Each widget instance maintains its own chess.js game state and chessground board
- **Responsive Design**: CSS handles mobile layout with flexbox controls

## Phase 1 Implementation (Completed)

### Features Delivered
1. **Modular Architecture**: Code split into 7 modules for better maintainability
2. **Alternative Solutions**: Support for multiple valid solution paths in puzzles
3. **Internationalization**: Multi-language support with English and German translations
4. **Improved Build System**: Automatic module concatenation in correct dependency order

### File Structure
```
src/
├── chess-widget.js              # Main entry point
├── widget-core.js               # Core class definition
├── widget-board.js              # Board rendering
├── widget-solution.js           # Solution validation
├── widget-solution-validator.js # Alternative solutions
├── widget-i18n.js               # Internationalization
└── widget-utils.js              # Utility functions
```

## Phase 2 Implementation (Completed)

### Features Delivered
1. **Stockfish API Client**: Integration with stockfish.online API for best move analysis
2. **localStorage Caching**: Intelligent caching system with expiration and quota handling
3. **Counter-Move Feedback**: Visual feedback showing opponent's best response to wrong moves
4. **Graceful Degradation**: Fallback to basic feedback if Stockfish API fails

### Architecture Details

**Stockfish Client (`widget-stockfish.js`):**
- Communicates with stockfish.online API via POST requests
- Configurable depth (1-20) and timeout settings
- Returns best move in UCI notation with evaluation
- Uses AbortController for timeout handling

**Cache System (`widget-cache.js`):**
- Stores Stockfish responses in localStorage by puzzle ID
- Cache key format: `fen:depth` for position-specific caching
- 30-day expiration for cache entries
- Automatic pruning when quota exceeded (removes entries older than 7 days)
- `getStats()` method for cache monitoring

**Wrong Move Flow:**
1. User makes wrong move
2. Shows "loading" feedback
3. Checks cache for position
4. If not cached, requests from Stockfish API
5. Stores response in cache
6. Animates counter-move on board
7. Shows feedback message for 2 seconds
8. Undoes both moves and returns to original position
9. Shows "try again" message

### Configuration
```html
<div class="chess-puzzle"
     data-stockfish-enabled="true"      <!-- Enable Stockfish -->
     data-stockfish-depth="12"          <!-- Analysis depth (default: 12) -->
     data-stockfish-timeout="2000"      <!-- API timeout in ms (default: 2000) -->
     data-stockfish-cache-enabled="true" <!-- Enable caching (default: true) -->
>
</div>
```

### File Structure Updates
```
src/
├── chess-widget.js              # Main entry point
├── widget-core.js               # Core class + Stockfish initialization
├── widget-board.js              # Board rendering
├── widget-solution.js           # Solution validation + Stockfish feedback
├── widget-solution-validator.js # Alternative solutions
├── widget-stockfish.js          # ✨ NEW: Stockfish API client
├── widget-cache.js              # ✨ NEW: localStorage caching
├── widget-i18n.js               # Internationalization
└── widget-utils.js              # Utility functions
```

## Phase 3 Implementation (Completed)

### Features Delivered
1. **Arrow Visualization**: Red arrows showing Stockfish counter-moves using Chessground's drawable API
2. **Error Handling**: Improved invalid move error handling with try-catch blocks
3. **Visual Feedback**: Enhanced UX with arrow indicators for wrong moves

### Architecture Details

**Arrow Drawing (`widget-solution.js`):**
- Uses Chessground's `drawable.autoShapes` configuration
- Displays red arrow from origin to destination of counter-move
- Arrow shows for 2 seconds alongside the counter-move animation
- Automatically cleared when board resets to original position

**Implementation:**
```javascript
// Add arrow if enabled (Phase 3 feature)
if (this.stockfishShowArrow) {
  configUpdate.drawable = {
    enabled: false,  // Disable manual drawing
    visible: true,
    autoShapes: [
      {
        orig: from,
        dest: to,
        brush: 'red'  // Red arrow for counter-move
      }
    ]
  };
}
```

**Error Handling Improvements:**
- Wrapped `chess.move()` calls in try-catch blocks to handle chess.js throwing errors
- Invalid moves now show clean console warnings instead of uncaught errors
- Better user feedback for attempted illegal moves

### Configuration
```html
<div class="chess-puzzle"
     data-stockfish-enabled="true"
     data-stockfish-depth="10"
     data-stockfish-show-arrow="true"  <!-- Enable arrows (default: true) -->
>
</div>
```

## Phase 4 Implementation (Completed)

### Testing & Integration Verification
1. **Feature Integration**: All features (alternative solutions, i18n, Stockfish) work together seamlessly
2. **Error Handling**: Comprehensive try-catch blocks prevent crashes, graceful fallback on API failures
3. **Performance**: Timeout handling, caching, and optimized API calls ensure <2s response time
4. **Cross-Puzzle Testing**: Verified with 20+ puzzles ranging from ELO 600-2400

### Verification Results

**Rendering & Display:**
- ✅ All chess boards render correctly across different puzzle types
- ✅ Responsive design maintains layout on various screen sizes
- ✅ Board coordinates display correctly (right-aligned, proper contrast)

**Feature Toggles:**
- ✅ Stockfish can be enabled/disabled via `data-stockfish-enabled` attribute
- ✅ Widgets without Stockfish work with basic feedback
- ✅ Widgets with Stockfish show counter-moves with arrows

**Internationalization:**
- ✅ English widgets display "Make your move"
- ✅ German widgets display "Mache deinen Zug"
- ✅ All feedback messages properly translated

**Alternative Solutions:**
- ✅ Puzzles accept multiple solution paths using pipe `|` separator
- ✅ Solution validation correctly tracks active paths
- ✅ Demo page showcases branching solution example

**Performance & Caching:**
- ✅ localStorage caching reduces API calls
- ✅ 30-day cache expiration with automatic pruning
- ✅ AbortController enforces configurable timeout (default: 2000ms)
- ✅ Graceful degradation on network failures

**Demo Page Coverage:**
- 20+ puzzles across 10 ELO levels (600-2400)
- Tactical patterns: Fork, Pin, Discovery, Skewer, Greek Gift, Smothered Mate, Boden's Mate
- Special cases: Underpromotion, Double Sacrifice, Interference
- Feature demonstrations: Alternative solutions, Stockfish arrows, i18n

### Phase 4 Acceptance Criteria (All Met)
- ✅ Stockfish counter-move integrated into move validation
- ✅ Alternative solutions work correctly in all scenarios
- ✅ I18n works correctly across all features
- ✅ Feature works seamlessly with existing puzzle logic
- ✅ Errors handled gracefully with fallbacks
- ✅ Performance is acceptable (<2s response time)
- ✅ File size increase is minimal (modular architecture)

### Next Phase
- **Phase 5**: Final documentation, cross-browser testing, and polish

## Testing Production Build

Use `npm run dev:prod` to test the bundled production files with the development server, ensuring the build process works correctly.