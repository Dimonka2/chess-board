/**
 * Chess Widget - Easy-to-install chess puzzle widget
 * Uses chessground and chess.js for interactive chess puzzles
 * All dependencies bundled - no external CDN calls
 *
 * This file serves as the main entry point.
 * The actual implementation is split across multiple modules:
 * - widget-utils.js: Utility functions
 * - widget-i18n.js: Internationalization
 * - widget-solution-validator.js: Alternative solutions support
 * - widget-core.js: Core ChessWidget class
 * - widget-board.js: Board rendering and management
 * - widget-solution.js: Solution validation and move handling
 *
 * Build process concatenates all files in the correct order.
 */

// Make ChessWidget available on window object
try { window.ChessWidget = ChessWidget; } catch (_) {}

// Auto-initialize if DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChessWidget.init());
  } else {
    ChessWidget.init();
  }
}
