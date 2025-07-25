// Import CSS first
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';  // This has the piece images!
import '../src/chess-widget.css';

// Import dependencies and make them available globally
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';

// Debug: Check if imports worked
console.log('Chess imported:', typeof Chess);
console.log('Chessground imported:', typeof Chessground);

// Make dependencies available globally
window.Chess = Chess;
window.Chessground = Chessground;

// Debug: Check if global assignment worked
console.log('Global Chess:', typeof window.Chess);
console.log('Global Chessground:', typeof window.Chessground);

// Now we need to wait for the DOM and manually initialize the widget
// since the widget script runs immediately on import

// Import the widget source but handle initialization manually
import('../src/chess-widget.js').then(() => {
  console.log('Chess widget module loaded');
  
  // The widget should have auto-initialized, but let's check
  if (typeof window.ChessWidget !== 'undefined') {
    console.log('ChessWidget available globally');
  } else {
    console.error('ChessWidget not found in global scope');
  }
});