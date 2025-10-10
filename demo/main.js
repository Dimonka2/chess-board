// Import CSS first
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';  // This has the piece images!
import '../src/chess-widget.css';

// Import dependencies and make them available globally
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';

// Make dependencies available globally BEFORE importing widget modules
window.Chess = Chess;
window.Chessground = Chessground;

// Helper to create Chessground instance
window.initChessground = (element, config) => Chessground(element, config);

// Import all widget modules in dependency order and wait for them to load
async function loadWidgetModules() {
  await import('../src/widget-utils.js');
  await import('../src/widget-i18n.js');
  await import('../src/widget-solution-validator.js');
  await import('../src/widget-cache.js');
  await import('../src/widget-stockfish.js');
  await import('../src/widget-core.js');
  await import('../src/widget-board.js');
  await import('../src/widget-solution.js');
  await import('../src/chess-widget.js');

  console.log('Chess widget loaded successfully!');
  console.log('ChessWidget available:', typeof window.ChessWidget);
}

// Load modules and initialize
loadWidgetModules().catch(error => {
  console.error('Failed to load chess widget:', error);
});