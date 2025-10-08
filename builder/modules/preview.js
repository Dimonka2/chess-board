// Preview Module - Handles preview widget rendering and updates

import { state } from './state.js';

// Update preview widget
export function updatePreview() {
  const container = document.querySelector('#preview-container .chess-puzzle');

  // Determine orientation based on side to move
  const fenParts = state.fen.split(' ');
  const sideToMove = fenParts[1]; // 'w' or 'b'
  const orientation = sideToMove === 'b' ? 'black' : 'white';

  // Update data attributes
  container.setAttribute('data-fen', state.fen);
  container.setAttribute('data-solution', state.solution.map(m => m.uci).join(','));
  container.setAttribute('data-width', state.meta.width);
  container.setAttribute('data-theme', state.meta.theme);
  container.setAttribute('data-orientation', orientation); // Fixed orientation based on starting side

  // Re-initialize widget
  const parent = container.parentElement;
  parent.innerHTML = '';

  const newWidget = document.createElement('div');
  newWidget.className = 'chess-puzzle';
  newWidget.setAttribute('data-fen', state.fen);
  newWidget.setAttribute('data-solution', state.solution.map(m => m.uci).join(','));
  newWidget.setAttribute('data-width', state.meta.width);
  newWidget.setAttribute('data-theme', state.meta.theme);
  newWidget.setAttribute('data-orientation', orientation); // Fixed orientation based on starting side

  parent.appendChild(newWidget);

  // Initialize the widget (assuming ChessWidget is loaded from bundle)
  if (window.ChessWidget) {
    window.ChessWidget.init();
  }
}
