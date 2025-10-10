# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a chess widget library that creates interactive chess puzzles using chessground and chess.js. The widget is designed to be completely standalone - all dependencies are bundled, requiring no CDN calls or external resources.

## Core Architecture

### Modular Structure (Phase 1 - Completed)

The widget is now split into multiple modules for better maintainability:

- **`src/widget-utils.js`**: Utility functions (delay, formatting, parsing)
- **`src/widget-i18n.js`**: Internationalization system (English, German)
- **`src/widget-solution-validator.js`**: Alternative solutions parser and validator
- **`src/widget-core.js`**: ChessWidget class definition and initialization
- **`src/widget-board.js`**: Board rendering, orientation, and Chessground integration
- **`src/widget-solution.js`**: Move validation, automatic moves, puzzle feedback
- **`src/chess-widget.js`**: Main entry point and auto-initialization

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
   - widget-utils.js → widget-i18n.js → widget-solution-validator.js → widget-core.js → widget-board.js → widget-solution.js → chess-widget.js
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

## Architecture Notes

- **Auto-initialization**: Widgets automatically initialize on DOM ready via `ChessWidget.init()`
- **Multiple Instances**: Supports multiple widgets on the same page
- **Move Validation**: Supports both UCI notation (e2e4) and SAN notation (Nf3)
- **Alternative Solutions**: Puzzles can accept multiple solution paths using pipe `|` separator
- **Internationalization**: Built-in support for English and German, extensible for more languages
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

### Next Phases
- **Phase 2**: Stockfish API integration for counter-move feedback
- **Phase 3**: Visual feedback enhancements
- **Phase 4**: Full integration and testing
- **Phase 5**: Documentation and polish

## Testing Production Build

Use `npm run dev:prod` to test the bundled production files with the development server, ensuring the build process works correctly.