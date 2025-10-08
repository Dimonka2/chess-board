// UI Utility Functions

// Toast notification system
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Update FEN display and validation status
export function updateFenDisplay(fen) {
  const fenInput = document.getElementById('fen-input');
  const fenStatus = document.getElementById('fen-status');

  fenInput.value = fen;

  // Validate FEN
  try {
    new Chess(fen);
    fenStatus.textContent = '✓ Valid';
    fenStatus.className = 'fen-status valid';
  } catch (e) {
    fenStatus.textContent = '✗ Invalid';
    fenStatus.className = 'fen-status invalid';
  }
}

// Copy text to clipboard
export function copyToClipboard(text, successMessage = 'Copied to clipboard') {
  navigator.clipboard.writeText(text);
  showToast(successMessage, 'success');
}

// Parse piece data (e.g., 'wK' -> { color: 'white', role: 'king' })
export function parsePieceData(pieceData) {
  const colorMap = { w: 'white', b: 'black' };
  const roleMap = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };

  const colorChar = pieceData[0];
  const roleChar = pieceData[1];

  return [colorMap[colorChar], roleMap[roleChar]];
}
