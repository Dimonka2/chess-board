// Board Editor Module - Handles piece placement, removal, and board manipulation

import { state } from './state.js';
import { composeFEN, getCastlingRights, decomposeFEN } from './fen-utils.js';
import { showToast, parsePieceData, updateFenDisplay } from './ui-utils.js';
import { updatePreview } from './preview.js';
import { autoSave } from './persistence.js';

// Initialize Chessground board for editing
export function initializeEditorBoard() {
  const boardElement = document.getElementById('editor-board');

  state.editorBoard = Chessground(boardElement, {
    fen: state.fen,
    movable: {
      free: true, // Allow free dragging of pieces in edit mode
      color: 'both',
      events: {
        after: handleEditorMove
      }
    },
    draggable: {
      enabled: true,
      deleteOnDropOff: true // Allow dragging pieces off the board to delete
    },
    selectable: {
      enabled: true
    },
    events: {
      select: handleSquareSelect,
      move: handleFreeDrag // Handle free drag moves in edit mode
    }
  });

  // Add double right-click handler for piece removal
  let lastRightClick = { time: 0, square: null };
  const DOUBLE_CLICK_THRESHOLD = 400; // ms

  setTimeout(() => {
    const cgBoard = boardElement.querySelector('cg-board') || boardElement;
    cgBoard.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (state.mode === 'edit') {
        // Get click coordinates relative to board
        const rect = cgBoard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate square from coordinates
        const squareSize = rect.width / 8;
        const file = Math.floor(x / squareSize);
        const rank = Math.floor(y / squareSize);

        // Get board orientation
        const orientation = state.editorBoard.state.orientation;

        // Calculate actual file and rank based on orientation
        const actualFile = orientation === 'white' ? file : 7 - file;
        const actualRank = orientation === 'white' ? 7 - rank : rank;

        if (actualFile >= 0 && actualFile <= 7 && actualRank >= 0 && actualRank <= 7) {
          const fileChar = String.fromCharCode(97 + actualFile); // a-h
          const rankChar = String(actualRank + 1); // 1-8
          const square = fileChar + rankChar;

          const now = Date.now();
          const timeSinceLastClick = now - lastRightClick.time;

          // Check for double right-click
          if (lastRightClick.square === square && timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
            removePieceFromSquare(square);
            lastRightClick = { time: 0, square: null }; // Reset
          } else {
            lastRightClick = { time: now, square };
          }
        }
      }
    });
  }, 100);
}

// Handle free drag in edit mode (rebuild FEN after drag)
function handleFreeDrag(orig, dest) {
  if (state.mode === 'edit') {
    // In edit mode, just rebuild FEN after the drag
    setTimeout(() => rebuildFenFromBoard(), 50);
  }
}

// Handle square selection (for piece placement or removal)
function handleSquareSelect(key) {
  if (state.mode !== 'edit') return;

  if (state.activePalettePiece === 'trash') {
    // Trash mode - remove piece
    removePieceFromSquare(key);
  } else if (state.activePalettePiece) {
    // Placement mode - place piece
    placePieceOnSquare(key, state.activePalettePiece);
  }
}

// Handle piece placement on square
function placePieceOnSquare(square, pieceData) {
  const [color, role] = parsePieceData(pieceData);

  // Get current board position
  const pieces = state.editorBoard.state.pieces;
  const newPieces = new Map(pieces);

  // Place the piece
  newPieces.set(square, { color, role });

  // Update board
  state.editorBoard.setPieces(newPieces);

  // Rebuild FEN from board state
  rebuildFenFromBoard();

  showToast(`Placed ${role} on ${square}`, 'success');
}

// Remove piece from square
function removePieceFromSquare(square) {
  const pieces = state.editorBoard.state.pieces;

  if (pieces.has(square)) {
    // Create a pieces object with the square removed (set to undefined to remove)
    const updates = new Map();
    updates.set(square, undefined); // Setting to undefined removes the piece

    state.editorBoard.setPieces(updates);

    // Rebuild FEN after a short delay to let Chessground update
    setTimeout(() => rebuildFenFromBoard(), 10);

    showToast(`Removed piece from ${square}`, 'success');
  }
}

// Handle move on editor board (during recording mode)
function handleEditorMove(orig, dest, metadata) {
  if (state.mode !== 'record') return;

  // Attempt to make the move
  const promotion = metadata?.promotion;
  const move = state.chess.move({ from: orig, to: dest, promotion });

  if (!move) {
    showToast('Illegal move from current position', 'error');
    // Reset board to current chess.js state
    state.editorBoard.set({ fen: state.chess.fen() });
    return;
  }

  // Add to solution
  const uci = orig + dest + (promotion || '');
  state.solution.push({ uci, san: move.san });

  // Update board with new position and legal moves
  const newTurn = state.chess.turn();
  state.editorBoard.set({
    fen: state.chess.fen(),
    movable: {
      color: newTurn === 'w' ? 'white' : 'black',
      dests: getLegalMovesFromState()
    }
  });

  // Update UI - manually update the solution list
  const tbody = document.getElementById('solution-tbody');
  tbody.innerHTML = state.solution.map((move, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${move.san}</td>
      <td>${move.uci}</td>
      <td class="move-actions">
        <button onclick="window.builderRewindToMove(${index})" title="Go back to this position">⟲ Rewind</button>
        <button onclick="window.builderTruncateFrom(${index})" title="Delete all moves from here">✂ Truncate</button>
        <button onclick="window.builderDeleteMove(${index})" title="Delete this move">✖ Delete</button>
      </td>
    </tr>
  `).join('');

  updatePreview();

  showToast(`Move recorded: ${move.san}`, 'success');
}

// Get legal moves from current state
function getLegalMovesFromState() {
  const dests = new Map();
  const moves = state.chess.moves({ verbose: true });

  moves.forEach(move => {
    if (!dests.has(move.from)) {
      dests.set(move.from, []);
    }
    dests.get(move.from).push(move.to);
  });

  return dests;
}

// Rebuild FEN from current board state
export function rebuildFenFromBoard() {
  // Get pieces from chessground
  const pieces = state.editorBoard.state.pieces;

  // Convert to FEN board representation
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  pieces.forEach((piece, square) => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.

    board[rank][file] = piece;
  });

  // Get other FEN components from UI
  const turn = document.getElementById('side-to-move').value;
  const castling = getCastlingRights();
  const epSquare = document.getElementById('en-passant').value.trim() || '-';
  const halfmove = document.getElementById('halfmove').value;
  const fullmove = document.getElementById('fullmove').value;

  // Compose FEN
  state.fen = composeFEN(board, turn, castling, epSquare, halfmove, fullmove);

  // Update chess.js instance and validate
  try {
    const testChess = new Chess(state.fen);
    state.chess = testChess;
    updateFenDisplay(state.fen);
    updatePreview();
    autoSave();
  } catch (e) {
    console.error('Invalid FEN:', e);
    updateFenDisplay(state.fen);
  }
}

// Board action functions
export function loadStartPosition() {
  state.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  state.chess = new Chess(state.fen);
  state.editorBoard.set({ fen: state.fen });
  decomposeFEN(state.fen);
  updateFenDisplay(state.fen);
  updatePreview();
  showToast('Loaded start position', 'success');
}

export function loadEmptyBoard() {
  state.fen = '8/8/8/8/8/8/8/8 w - - 0 1';
  state.chess = new Chess(state.fen);
  state.editorBoard.set({ fen: state.fen });
  decomposeFEN(state.fen);
  updateFenDisplay(state.fen);
  updatePreview();
  showToast('Loaded empty board', 'success');
}

export function flipBoard() {
  state.editorBoard.toggleOrientation();

  // Get new orientation
  const orientation = state.editorBoard.state.orientation;

  // Suggest setting side-to-move based on orientation
  // If black is on bottom, suggest black to move
  if (orientation === 'black') {
    const currentTurn = document.getElementById('side-to-move').value;
    if (currentTurn === 'w') {
      if (confirm('Board flipped to black\'s perspective. Set black to move?')) {
        document.getElementById('side-to-move').value = 'b';
        rebuildFenFromBoard();
        showToast('Board flipped - Black to move', 'success');
        return;
      }
    }
  } else {
    // White on bottom
    const currentTurn = document.getElementById('side-to-move').value;
    if (currentTurn === 'b') {
      if (confirm('Board flipped to white\'s perspective. Set white to move?')) {
        document.getElementById('side-to-move').value = 'w';
        rebuildFenFromBoard();
        showToast('Board flipped - White to move', 'success');
        return;
      }
    }
  }

  showToast('Board flipped', 'success');
}

export function enableTrashMode() {
  // Clear other palette selections
  document.querySelectorAll('.palette-piece').forEach(b => b.classList.remove('active'));

  // Toggle trash mode
  const trashBtn = document.getElementById('btn-trash');
  if (state.activePalettePiece === 'trash') {
    state.activePalettePiece = null;
    trashBtn.style.background = '';
    showToast('Trash mode disabled', 'success');
  } else {
    state.activePalettePiece = 'trash';
    trashBtn.style.background = '#c0392b';
    showToast('Click a square to remove piece', 'warning');
  }
}

export function copyFenToClipboard() {
  navigator.clipboard.writeText(state.fen);
  showToast('FEN copied to clipboard', 'success');
}
