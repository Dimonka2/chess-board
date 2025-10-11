// Preview Module - Handles preview widget rendering and updates

import { state } from './state.js';

// Update preview widget
export function updatePreview() {
  const container = document.querySelector('#preview-container .chess-puzzle');

  // Determine orientation based on premove flag
  // If premove enabled: first move is opponent's, so flip the board
  // Solution after premove is for the opposite color
  const fenParts = state.fen.split(' ');
  const sideToMove = fenParts[1]; // 'w' or 'b'

  // If premove enabled, the board should show from perspective of player who moves AFTER the premove
  const orientation = state.premoveEnabled
    ? (sideToMove === 'w' ? 'black' : 'white')  // Flip orientation
    : (sideToMove === 'b' ? 'black' : 'white'); // Normal orientation

  // Re-initialize widget
  const parent = container.parentElement;
  parent.innerHTML = '';

  const newWidget = document.createElement('div');
  newWidget.className = 'chess-puzzle';
  newWidget.setAttribute('data-fen', state.fen);

  // Set premove-enabled flag
  if (state.premoveEnabled) {
    newWidget.setAttribute('data-premove-enabled', 'true');
  }

  newWidget.setAttribute('data-solution', state.solution.map(m => m.uci).join(','));
  newWidget.setAttribute('data-width', state.meta.width);
  newWidget.setAttribute('data-theme', state.meta.theme);
  newWidget.setAttribute('data-orientation', orientation);
  newWidget.setAttribute('data-stockfish-enabled', 'true'); // Enable Stockfish in preview

  parent.appendChild(newWidget);

  // Initialize the widget (assuming ChessWidget is loaded from bundle)
  if (window.ChessWidget) {
    window.ChessWidget.init();
  }
}
