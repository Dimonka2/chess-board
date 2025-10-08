// FEN Composition and Decomposition Utilities

// Compose FEN string from board array and components
export function composeFEN(board, turn, castling, epSquare, halfmove, fullmove) {
  // Convert board to FEN ranks
  const fenRanks = board.map(rank => {
    let fenRank = '';
    let emptyCount = 0;

    rank.forEach(square => {
      if (!square) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fenRank += emptyCount;
          emptyCount = 0;
        }
        // Convert piece object to FEN character
        const roleToChar = {
          'king': 'K',
          'queen': 'Q',
          'rook': 'R',
          'bishop': 'B',
          'knight': 'N',
          'pawn': 'P'
        };
        const pieceChar = roleToChar[square.role];
        fenRank += square.color === 'white' ? pieceChar : pieceChar.toLowerCase();
      }
    });

    if (emptyCount > 0) {
      fenRank += emptyCount;
    }

    return fenRank;
  });

  const fenBoard = fenRanks.join('/');
  return `${fenBoard} ${turn} ${castling || '-'} ${epSquare} ${halfmove} ${fullmove}`;
}

// Decompose FEN and update UI controls
export function decomposeFEN(fen) {
  const parts = fen.split(' ');
  if (parts.length < 4) return;

  const [board, turn, castling, epSquare, halfmove = '0', fullmove = '1'] = parts;

  // Update side to move
  document.getElementById('side-to-move').value = turn;

  // Update castling rights
  document.getElementById('castle-K').checked = castling.includes('K');
  document.getElementById('castle-Q').checked = castling.includes('Q');
  document.getElementById('castle-k').checked = castling.includes('k');
  document.getElementById('castle-q').checked = castling.includes('q');

  // Update en passant
  document.getElementById('en-passant').value = epSquare === '-' ? '' : epSquare;

  // Update move counters
  document.getElementById('halfmove').value = halfmove;
  document.getElementById('fullmove').value = fullmove;
}

// Get castling rights from checkboxes
export function getCastlingRights() {
  const rights = [];
  if (document.getElementById('castle-K').checked) rights.push('K');
  if (document.getElementById('castle-Q').checked) rights.push('Q');
  if (document.getElementById('castle-k').checked) rights.push('k');
  if (document.getElementById('castle-q').checked) rights.push('q');
  return rights.join('') || '-';
}

// Validate FEN string
export function validateFEN(fen) {
  try {
    new Chess(fen);
    return true;
  } catch (e) {
    return false;
  }
}
