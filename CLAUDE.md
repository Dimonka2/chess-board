# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a chess widget library that creates interactive chess puzzles using chessground and chess.js. The widget is designed to be completely standalone - all dependencies are bundled, requiring no CDN calls or external resources.

## Core Architecture

- **ChessWidget Class** (`src/chess-widget.js`): Main widget implementation that handles FEN positions, solution validation, move processing, and board interaction
- **Custom Build System** (`build.js`): Bundles chess.js (CommonJS) and chessground (ES6) into browser-compatible code with proper global variable wrapping
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

The custom build script (`build.js`) performs critical module wrapping:

1. **Chess.js Wrapping**: Wraps CommonJS exports to create global `window.Chess`, `window.SQUARES`, etc.
2. **Chessground Wrapping**: Removes ES6 exports and creates global `window.Chessground` and `window.initChessground`
3. **CSS Bundling**: Combines chessground themes (base, brown, cburnett pieces) with custom widget styles
4. **File Generation**: Creates both minified (.min.js/.min.css) and development versions

## Widget Configuration

The widget reads HTML data attributes:
- `data-fen`: Chess position (required)
- `data-solution`: Comma-separated moves for puzzle mode (optional)
- `data-width`: Board size in pixels (default: 400)
- `data-auto-flip`: Auto-rotate board for black's turn (default: false)

## Architecture Notes

- **Auto-initialization**: Widgets automatically initialize on DOM ready via `ChessWidget.init()`
- **Multiple Instances**: Supports multiple widgets on the same page
- **Move Validation**: Supports both UCI notation (e2e4) and SAN notation (Nf3)
- **State Management**: Each widget instance maintains its own chess.js game state and chessground board
- **Responsive Design**: CSS handles mobile layout with flexbox controls

## Testing Production Build

Use `npm run dev:prod` to test the bundled production files with the development server, ensuring the build process works correctly.