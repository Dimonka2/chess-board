
// Chess Puzzle Builder - Production Bundle
// This file combines all builder modules into a single standalone file

(function() {
  'use strict';

  // state.js
// Global State Management

const state = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  chess: null, // Will be initialized with Chess instance
  premoveEnabled: false, // If true, first solution move is opponent's move (auto-played)
  solution: [], // Array of { uci: 'e2e4', san: 'e4' }
  meta: {
    title: '',
    tags: [],
    difficulty: '',
    description: '',
    theme: 'blue',
    width: 400
  },
  mode: 'edit', // 'edit' or 'record'
  activePalettePiece: null, // Currently selected piece from palette
  editorBoard: null, // Chessground instance for editor
  previewWidget: null // Reference to preview widget
};


// fen-utils.js
// FEN Composition and Decomposition Utilities

// Compose FEN string from board array and components
function composeFEN(board, turn, castling, epSquare, halfmove, fullmove) {
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
function decomposeFEN(fen) {
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
function getCastlingRights() {
  const rights = [];
  if (document.getElementById('castle-K').checked) rights.push('K');
  if (document.getElementById('castle-Q').checked) rights.push('Q');
  if (document.getElementById('castle-k').checked) rights.push('k');
  if (document.getElementById('castle-q').checked) rights.push('q');
  return rights.join('') || '-';
}

// Validate FEN string
function validateFEN(fen) {
  try {
    new Chess(fen);
    return true;
  } catch (e) {
    return false;
  }
}


// ui-utils.js
// UI Utility Functions

// Toast notification system
function showToast(message, type = 'info') {
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
function updateFenDisplay(fen, isValid = null) {
  const fenInput = document.getElementById('fen-input');
  const fenStatus = document.getElementById('fen-status');

  fenInput.value = fen;

  // If validity is provided, use it; otherwise validate
  if (isValid === null) {
    try {
      new Chess(fen);
      isValid = true;
    } catch (e) {
      isValid = false;
    }
  }

  if (isValid) {
    fenStatus.textContent = '✓ Valid';
    fenStatus.className = 'fen-status valid';
  } else {
    fenStatus.textContent = '✗ Invalid';
    fenStatus.className = 'fen-status invalid';
  }
}

// Copy text to clipboard
function copyToClipboard(text, successMessage = 'Copied to clipboard') {
  navigator.clipboard.writeText(text);
  showToast(successMessage, 'success');
}

// Parse piece data (e.g., 'wK' -> { color: 'white', role: 'king' })
function parsePieceData(pieceData) {
  const colorMap = { w: 'white', b: 'black' };
  const roleMap = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };

  const colorChar = pieceData[0];
  const roleChar = pieceData[1];

  return [colorMap[colorChar], roleMap[roleChar]];
}


// board-editor.js
// Board Editor Module - Handles piece placement, removal, and board manipulation

// Initialize Chessground board for editing
function initializeEditorBoard() {
  const boardElement = document.getElementById('editor-board');

  state.editorBoard = Chessground(boardElement, {
    fen: state.fen,
    coordinates: true,
    ranksPosition: 'right', // Show rank numbers on right side (Lichess style)
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
function rebuildFenFromBoard() {
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
    updateFenDisplay(state.fen, true); // valid
    updatePreview();
    autoSave();
  } catch (e) {
    // FEN is invalid (e.g., no kings, wrong piece placement)
    // This is OK during board setup - just show as invalid
    console.log('FEN not yet valid (expected during setup):', e.message);
    state.chess = null; // Clear chess instance until valid
    updateFenDisplay(state.fen, false); // invalid
    updatePreview();
    autoSave();
  }
}

// Board action functions
function loadStartPosition() {
  state.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  state.chess = new Chess(state.fen);
  state.editorBoard.set({ fen: state.fen });
  decomposeFEN(state.fen);
  updateFenDisplay(state.fen);
  updatePreview();
  showToast('Loaded start position', 'success');
}

function loadEmptyBoard() {
  state.fen = '8/8/8/8/8/8/8/8 w - - 0 1';

  // chess.js requires kings, so we can't validate an empty board
  // Just clear the board visually and update state
  state.editorBoard.set({ fen: state.fen });

  // Update UI controls to match empty board
  decomposeFEN(state.fen);
  updateFenDisplay(state.fen);

  // Don't try to create a Chess instance with an empty board
  // The next piece placement will trigger rebuildFenFromBoard which will handle validation

  updatePreview();
  autoSave();
  showToast('Loaded empty board', 'success');
}

function flipBoard() {
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

function enableTrashMode() {
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

function copyFenToClipboard() {
  navigator.clipboard.writeText(state.fen);
  showToast('FEN copied to clipboard', 'success');
}


// solution-editor.js
// Solution Editor Module - Handles move recording and solution management

// Update premove display
function updatePremoveDisplay() {
  const premoveCheckbox = document.getElementById('premove-enabled');
  const premoveInfo = document.getElementById('premove-info');

  // Update checkbox state
  premoveCheckbox.checked = state.premoveEnabled;

  // Update info text
  if (state.premoveEnabled && state.solution.length > 0) {
    premoveInfo.innerHTML = `
      <div class="premove-active">
        <span class="premove-icon">✓</span>
        <span>First move (<strong>${state.solution[0].san}</strong>) will be auto-played as opponent's move.</span>
      </div>
    `;
    premoveInfo.style.display = 'block';
  } else if (state.premoveEnabled) {
    premoveInfo.innerHTML = `
      <div class="premove-active">
        <span class="premove-icon">✓</span>
        <span>Premove enabled. Record the opponent's first move, then your solution moves.</span>
      </div>
    `;
    premoveInfo.style.display = 'block';
  } else {
    premoveInfo.style.display = 'none';
  }
}

// Update solution list table
function updateSolutionList() {
  const tbody = document.getElementById('solution-tbody');

  if (state.solution.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="4">No moves recorded. Start recording to build the solution.</td>
      </tr>
    `;
    return;
  }

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
}

// Recording functions
function startRecording() {
  state.mode = 'record';

  // Reset chess position to starting FEN
  state.chess = new Chess(state.fen);

  state.editorBoard.set({
    fen: state.fen,
    movable: {
      free: false, // Disable free drag - only legal moves
      color: state.chess.turn() === 'w' ? 'white' : 'black',
      dests: getLegalMoves() // Get legal move destinations
    },
    draggable: {
      enabled: true
    }
  });

  document.getElementById('btn-start-recording').disabled = true;
  document.getElementById('btn-stop-recording').disabled = false;
  showToast('Recording started - make legal moves on the board', 'success');
}

// Get legal moves for current position
function getLegalMoves() {
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

function stopRecording() {
  state.mode = 'edit';
  state.editorBoard.set({
    movable: {
      free: true, // Re-enable free drag in edit mode
      color: 'both'
    }
  });

  document.getElementById('btn-start-recording').disabled = false;
  document.getElementById('btn-stop-recording').disabled = true;
  showToast('Recording stopped', 'success');
}

function clearSolution() {
  if (confirm('Clear all recorded moves?')) {
    state.solution = [];
    state.chess = new Chess(state.fen);

    // Reset board configuration based on current mode
    if (state.mode === 'record') {
      state.editorBoard.set({
        fen: state.fen,
        lastMove: undefined, // Clear move highlights
        movable: {
          free: false,
          color: state.chess.turn() === 'w' ? 'white' : 'black',
          dests: getLegalMoves()
        },
        draggable: {
          enabled: true
        }
      });
    } else {
      state.editorBoard.set({
        fen: state.fen,
        lastMove: undefined // Clear move highlights
      });
    }

    updateSolutionList();
    updatePreview();
    showToast('Solution cleared', 'success');
  }
}

// Rewind to a specific move (exposed globally for onclick)
function rewindToMove(index) {
  // Replay from start up to (and including) this move
  state.chess = new Chess(state.fen);
  for (let i = 0; i <= index; i++) {
    state.chess.move(state.solution[i].uci);
  }

  // Update board and legal moves if in recording mode
  if (state.mode === 'record') {
    state.editorBoard.set({
      fen: state.chess.fen(),
      movable: {
        color: state.chess.turn() === 'w' ? 'white' : 'black',
        dests: getLegalMoves()
      }
    });
  } else {
    state.editorBoard.set({ fen: state.chess.fen() });
  }

  updatePreview();
  showToast(`Viewing position after move ${index + 1}`, 'success');
}

// Delete a specific move (exposed globally for onclick)
function deleteMove(index) {
  state.solution.splice(index, 1);

  // Replay from start
  state.chess = new Chess(state.fen);
  state.solution.forEach(move => {
    state.chess.move(move.uci);
  });

  // Update board and legal moves if in recording mode
  if (state.mode === 'record') {
    state.editorBoard.set({
      fen: state.chess.fen(),
      movable: {
        color: state.chess.turn() === 'w' ? 'white' : 'black',
        dests: getLegalMoves()
      }
    });
  } else {
    state.editorBoard.set({ fen: state.chess.fen() });
  }

  updateSolutionList();
  updatePreview();
  showToast('Move deleted', 'success');
}

// Truncate from a specific move (exposed globally for onclick)
function truncateFrom(index) {
  if (confirm(`Delete all moves from move ${index + 1} onwards?`)) {
    state.solution = state.solution.slice(0, index);

    // Replay from start
    state.chess = new Chess(state.fen);
    state.solution.forEach(move => {
      state.chess.move(move.uci);
    });

    // Update board and legal moves if in recording mode
    if (state.mode === 'record') {
      state.editorBoard.set({
        fen: state.chess.fen(),
        movable: {
          color: state.chess.turn() === 'w' ? 'white' : 'black',
          dests: getLegalMoves()
        }
      });
    } else {
      state.editorBoard.set({ fen: state.chess.fen() });
    }

    updateSolutionList();
    updatePreview();
    showToast(`Truncated from move ${index + 1}`, 'success');
  }
}

// Validate entire solution
function validateSolution() {
  if (state.solution.length === 0) {
    return { valid: true, message: 'No solution to validate' };
  }

  try {
    const testChess = new Chess(state.fen);

    // Validate each move
    for (let i = 0; i < state.solution.length; i++) {
      const move = testChess.move(state.solution[i].uci);
      if (!move) {
        return {
          valid: false,
          message: `Move ${i + 1} (${state.solution[i].san}) is illegal from current position`
        };
      }
    }

    // Check for checkmate or stalemate at end
    const result = {
      valid: true,
      message: 'Solution is valid'
    };

    if (testChess.isCheckmate()) {
      result.message += ' - ends in checkmate';
    } else if (testChess.isStalemate()) {
      result.message += ' - ends in stalemate';
    } else if (testChess.isCheck()) {
      result.message += ' - ends in check';
    }

    return result;
  } catch (e) {
    return {
      valid: false,
      message: `Validation error: ${e.message}`
    };
  }
}

// Premove toggle handler
function togglePremove(enabled) {
  state.premoveEnabled = enabled;

  updatePremoveDisplay();
  updatePreview();

  if (enabled) {
    showToast('Premove enabled - First solution move will be auto-played', 'info');
  } else {
    showToast('Premove disabled - Puzzle starts from current position', 'info');
  }
}


// preview.js
// Preview Module - Handles preview widget rendering and updates

// Update preview widget
function updatePreview() {
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


// persistence.js
// Persistence Module - Handles localStorage, import/export

// Auto-save on changes
let saveTimeout;
function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToLocalStorage, 300);
}

// LocalStorage persistence
function saveToLocalStorage() {
  try {
    localStorage.setItem('chess-puzzle-builder-draft', JSON.stringify({
      fen: state.fen,
      premoveEnabled: state.premoveEnabled,
      solution: state.solution,
      meta: state.meta
    }));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('chess-puzzle-builder-draft');
    if (saved) {
      const data = JSON.parse(saved);
      // Only load if not default state
      if (data.solution.length > 0 || data.meta.title) {
        // Auto-load without confirmation (as requested by user)
        state.fen = data.fen;
        state.premoveEnabled = data.premoveEnabled || false;
        state.solution = data.solution;
        state.meta = { ...state.meta, ...data.meta };
        state.chess = new Chess(state.fen);

        state.editorBoard.set({ fen: state.fen });
        decomposeFEN(state.fen);
        updateFenDisplay(state.fen);
        updatePremoveDisplay();
        updateSolutionList();
        updatePreview();

        // Update metadata fields
        document.getElementById('puzzle-title').value = state.meta.title || '';
        document.getElementById('puzzle-tags').value = state.meta.tags ? state.meta.tags.join(', ') : '';
        document.getElementById('puzzle-difficulty').value = state.meta.difficulty || '';
        document.getElementById('widget-width').value = state.meta.width || 400;
        document.getElementById('widget-theme').value = state.meta.theme || 'blue';

        showToast('Draft loaded from localStorage', 'info');
      }
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
}

// Export functions
function copyHtmlSnippet() {
  // Validate solution before export
  if (state.solution.length > 0) {
    const validation = validateSolution();
    if (!validation.valid) {
      showToast(`Cannot export: ${validation.message}`, 'error');
      return;
    }
    showToast(validation.message, 'success');
  }

  const snippet = buildHtmlSnippet();
  navigator.clipboard.writeText(snippet);

  const output = document.getElementById('export-output');
  output.textContent = snippet;
  output.classList.add('show');

  showToast('HTML snippet copied to clipboard', 'success');
}

function buildHtmlSnippet() {
  const solution = state.solution.map(m => m.uci).join(',');
  return `<div class="chess-puzzle"
     data-fen="${state.fen}"
     data-solution="${solution}"
     data-width="${state.meta.width}"
     data-theme="${state.meta.theme}"></div>`;
}

function downloadJson() {
  // Validate solution before export
  if (state.solution.length > 0) {
    const validation = validateSolution();
    if (!validation.valid) {
      showToast(`Cannot export: ${validation.message}`, 'error');
      return;
    }
  }

  const data = {
    version: 1,
    fen: state.fen,
    premoveEnabled: state.premoveEnabled,
    solution: state.solution,
    meta: state.meta
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chess-puzzle-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('JSON downloaded', 'success');
}

function newPuzzle() {
  if (confirm('Start a new puzzle? Unsaved changes will be lost.')) {
    // Clear localStorage so we don't prompt to load on reload
    localStorage.removeItem('chess-puzzle-builder-draft');
    location.reload();
  }
}

function loadJson() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        state.fen = data.fen;
        state.premoveEnabled = data.premoveEnabled || false;
        state.solution = data.solution;
        state.meta = { ...state.meta, ...data.meta };
        state.chess = new Chess(state.fen);

        state.editorBoard.set({ fen: state.fen });
        decomposeFEN(state.fen);
        updateFenDisplay(state.fen);
        updatePremoveDisplay();
        updateSolutionList();
        updatePreview();

        // Update metadata fields
        document.getElementById('puzzle-title').value = state.meta.title || '';
        document.getElementById('puzzle-tags').value = state.meta.tags ? state.meta.tags.join(', ') : '';
        document.getElementById('puzzle-difficulty').value = state.meta.difficulty || '';
        document.getElementById('widget-width').value = state.meta.width || 400;
        document.getElementById('widget-theme').value = state.meta.theme || 'blue';

        showToast('Puzzle loaded', 'success');
      } catch (err) {
        showToast('Failed to load JSON', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}


// lichess-import.js
// Lichess Puzzle Import Module
// Handles importing puzzles from Lichess.org API

/**
 * Extract puzzle ID from various input formats
 * Supports:
 * - Puzzle ID only: "sUum4"
 * - Training URL: "https://lichess.org/training/sUum4"
 * - API URL: "https://lichess.org/api/puzzle/sUum4"
 *
 * @param {string} input - User input (ID, URL, etc.)
 * @returns {string|null} - Extracted puzzle ID or null if invalid
 */
function extractPuzzleId(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Trim whitespace
  input = input.trim();

  // Pattern 1: Just the ID (alphanumeric, typically 5-6 characters)
  if (/^[A-Za-z0-9]{4,10}$/.test(input)) {
    return input;
  }

  // Pattern 2: Training URL or API URL
  const urlMatch = input.match(/(?:puzzle|training)\/([A-Za-z0-9]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  return null;
}

/**
 * Fetch puzzle data from Lichess API
 *
 * @param {string} puzzleId - The Lichess puzzle ID
 * @returns {Promise<Object>} - Puzzle data from Lichess API
 * @throws {Error} - Network errors, HTTP errors, or invalid puzzle ID
 */
async function fetchLichessPuzzle(puzzleId) {
  // Extract ID from input (handles URLs too)
  const id = extractPuzzleId(puzzleId);

  if (!id) {
    throw new Error('Invalid puzzle ID or URL. Please check your input and try again.');
  }

  const apiUrl = `https://lichess.org/api/puzzle/${id}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Puzzle "${id}" not found. Please check the ID and try again.`);
      } else if (response.status >= 500) {
        throw new Error('Lichess server error. Please try again later.');
      } else {
        throw new Error(`HTTP error ${response.status}: Failed to fetch puzzle.`);
      }
    }

    const data = await response.json();

    // Validate response structure
    validateLichessResponse(data);

    return data;

  } catch (error) {
    // Re-throw validation errors and HTTP errors
    if (error.message.includes('Puzzle') || error.message.includes('HTTP') || error.message.includes('Lichess')) {
      throw error;
    }

    // Handle network errors
    if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    // Generic error
    throw new Error(`Failed to fetch puzzle: ${error.message}`);
  }
}

/**
 * Validate Lichess API response structure
 *
 * @param {Object} data - Response data from Lichess API
 * @throws {Error} - If data is invalid or missing required fields
 */
function validateLichessResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid puzzle data received from Lichess.');
  }

  if (!data.puzzle) {
    throw new Error('Invalid puzzle data: missing puzzle information.');
  }

  if (!data.game) {
    throw new Error('Invalid puzzle data: missing game information.');
  }

  if (!data.puzzle.solution || !Array.isArray(data.puzzle.solution)) {
    throw new Error('Invalid puzzle data: missing or invalid solution.');
  }

  if (data.puzzle.solution.length === 0) {
    throw new Error('Puzzle has no solution moves.');
  }

  if (!data.game.pgn) {
    throw new Error('Invalid puzzle data: game PGN not available.');
  }

  if (data.puzzle.initialPly === undefined || data.puzzle.initialPly === null) {
    throw new Error('Invalid puzzle data: initial position (initialPly) not specified.');
  }

  return true;
}

/**
 * Derive FEN position from Lichess puzzle data
 * Uses the game PGN and initialPly to find the exact starting position
 *
 * @param {string} pgn - PGN string from Lichess game (SAN moves, space-separated)
 * @param {number} initialPly - The half-move number where the puzzle starts
 * @returns {string} - FEN string for the puzzle starting position
 * @throws {Error} - If PGN parsing fails or initialPly is invalid
 */
function deriveFenFromLichessPuzzle(pgn, initialPly) {
  if (!pgn || typeof pgn !== 'string') {
    throw new Error('Invalid PGN data.');
  }

  if (typeof initialPly !== 'number' || initialPly < 0) {
    throw new Error('Invalid initialPly value.');
  }

  try {
    // Create new chess instance
    const chess = new Chess();

    // Lichess PGN is just SAN moves separated by spaces (no move numbers)
    // Example: "d4 Nf6 Bf4 d5 e3 g6..."
    // Split into individual moves
    const moves = pgn.trim().split(/\s+/);

    // Validate initialPly is within bounds
    if (initialPly > moves.length) {
      throw new Error(`Initial position (ply ${initialPly}) is beyond the game length (${moves.length} moves).`);
    }

    // Replay moves up to initialPly
    // Important: initialPly is the number of half-moves in the game BEFORE the puzzle starts
    // We replay exactly initialPly moves to reach the puzzle's starting position
    for (let i = 0; i < initialPly; i++) {
      const san = moves[i];

      if (!san) {
        throw new Error(`Move at ply ${i + 1} is missing in PGN.`);
      }

      // Try to make the move
      let move;
      try {
        move = chess.move(san);
      } catch (error) {
        // chess.js can throw on invalid moves
        move = null;
      }

      if (!move) {
        throw new Error(`Failed to parse move ${i + 1}: "${san}" (invalid SAN notation from position: ${chess.fen()})`);
      }
    }

    // Get the FEN at this position
    const fen = chess.fen();

    return fen;

  } catch (error) {
    // Re-throw our custom errors
    if (error.message.includes('PGN') || error.message.includes('position') || error.message.includes('parse') || error.message.includes('missing')) {
      throw error;
    }

    // Wrap chess.js errors
    throw new Error(`Failed to derive position from game: ${error.message}`);
  }
}

/**
 * Convert Lichess solution (UCI notation) to builder format ({uci, san})
 *
 * @param {string[]} lichessSolution - Array of UCI move strings from Lichess
 * @param {string} startingFen - FEN string of the starting position
 * @returns {Array<{uci: string, san: string}>} - Array of move objects
 * @throws {Error} - If moves are illegal or conversion fails
 */
function convertLichessSolution(lichessSolution, startingFen) {
  if (!Array.isArray(lichessSolution) || lichessSolution.length === 0) {
    throw new Error('Invalid solution: must be a non-empty array of moves.');
  }

  if (!startingFen || typeof startingFen !== 'string') {
    throw new Error('Invalid starting position (FEN) for solution conversion.');
  }

  try {
    // Create chess instance at the starting position
    const chess = new Chess(startingFen);
    const converted = [];

    for (let i = 0; i < lichessSolution.length; i++) {
      const uciMove = lichessSolution[i];

      if (!uciMove || typeof uciMove !== 'string') {
        throw new Error(`Invalid move at index ${i}: ${uciMove}`);
      }

      // Parse UCI notation: "e2e4", "e7e8q" (with promotion)
      if (uciMove.length < 4 || uciMove.length > 5) {
        throw new Error(`Invalid UCI move format at index ${i}: ${uciMove}`);
      }

      const from = uciMove.substring(0, 2);
      const to = uciMove.substring(2, 4);
      const promotion = uciMove.length === 5 ? uciMove[4] : undefined;

      // Attempt the move
      let move;
      try {
        move = chess.move({ from, to, promotion });
      } catch (error) {
        // chess.js throws on invalid moves in some versions
        move = null;
      }

      if (!move) {
        throw new Error(`Illegal move in solution at index ${i}: ${uciMove} (from position: ${chess.fen()})`);
      }

      // Add to converted solution
      converted.push({
        uci: uciMove,
        san: move.san
      });
    }

    return converted;

  } catch (error) {
    // Re-throw our custom errors
    if (error.message.includes('Invalid') || error.message.includes('Illegal')) {
      throw error;
    }

    // Wrap chess.js errors
    throw new Error(`Failed to convert solution: ${error.message}`);
  }
}

/**
 * Map Lichess rating to builder difficulty level
 *
 * @param {number} rating - Lichess puzzle rating
 * @returns {string} - Difficulty level (beginner, intermediate, advanced, expert, master)
 */
function mapRatingToDifficulty(rating) {
  if (typeof rating !== 'number') {
    return 'intermediate'; // Default fallback
  }

  if (rating < 1000) return 'beginner';
  if (rating < 1500) return 'intermediate';
  if (rating < 2000) return 'advanced';
  if (rating < 2500) return 'expert';
  return 'master';
}

/**
 * Main import function - orchestrates the entire import process
 * NEW APPROACH: Premove is just the first move in solution array, with premoveEnabled flag
 *
 * @param {string} puzzleIdOrUrl - Puzzle ID or URL from user input
 * @returns {Promise<Object>} - Processed puzzle data ready for builder state
 * @throws {Error} - If any step of the import process fails
 */
async function importLichessPuzzle(puzzleIdOrUrl) {
  // Step 1: Fetch puzzle data from Lichess API
  const data = await fetchLichessPuzzle(puzzleIdOrUrl);

  const initialPly = data.puzzle.initialPly;
  const lichessSolution = data.puzzle.solution;
  const moves = data.game.pgn.trim().split(/\s+/);

  // Step 2: Understand Lichess puzzle structure
  // CRITICAL: initialPly is actually an INDEX, not a count!
  // initialPly = N means the puzzle starts at position AFTER move at index N
  // So:
  //   - moves[initialPly] is the LAST move before puzzle starts (opponent's move)
  //   - deriveFenFromLichessPuzzle(pgn, initialPly) gives position AFTER moves[initialPly-1]
  //   - deriveFenFromLichessPuzzle(pgn, initialPly+1) gives position AFTER moves[initialPly] (the actual puzzle position)
  //
  // For premove support:
  // - Puzzle position is AFTER moves[initialPly] (opponent's last move)
  // - We want position BEFORE moves[initialPly]
  // - deriveFenFromLichessPuzzle(pgn, initialPly) gives us that!

  // Get position BEFORE the opponent's move
  const fenBeforePremove = deriveFenFromLichessPuzzle(data.game.pgn, initialPly);

  // Get the opponent's move (move at index initialPly)
  const premoveSan = moves[initialPly];

  if (!premoveSan) {
    throw new Error(`No move found at index ${initialPly}. Puzzle data may be invalid.`);
  }

  const premoveChess = new Chess(fenBeforePremove);
  const premoveResult = premoveChess.move(premoveSan);

  if (!premoveResult) {
    throw new Error(`Failed to parse opponent's setup move from Lichess puzzle. Move: ${premoveSan}, Position: ${fenBeforePremove}`);
  }

  const premoveMove = {
    uci: premoveResult.from + premoveResult.to + (premoveResult.promotion || ''),
    san: premoveResult.san
  };

  // Step 3: Build complete solution
  // The Lichess solution already contains the player's moves starting from AFTER the premove
  // So we get position after premove and convert the solution
  const fenAfterPremove = premoveChess.fen();
  const playerSolution = convertLichessSolution(lichessSolution, fenAfterPremove);

  // Complete solution: [opponent's premove, ...player's moves]
  const fullSolution = [premoveMove, ...playerSolution];

  // Step 4: Map rating to difficulty
  const difficulty = mapRatingToDifficulty(data.puzzle.rating);

  // Step 5: Return puzzle data with premoveEnabled flag
  const puzzleData = {
    fen: fenBeforePremove,  // Position BEFORE opponent's move
    premoveEnabled: true,    // Flag that first move is opponent's
    solution: fullSolution,  // [opponent's move, ...player's moves]
    meta: {
      title: `Lichess Puzzle #${data.puzzle.id}`,
      tags: data.puzzle.themes || [],
      difficulty,
      lichessId: data.puzzle.id,
      lichessGameId: data.game.id,
      lichessRating: data.puzzle.rating,
      lichessPlays: data.puzzle.plays || 0,
      lichessThemes: data.puzzle.themes || []
    }
  };

  return puzzleData;
}

// Export functions
{
  extractPuzzleId,
  fetchLichessPuzzle,
  deriveFenFromLichessPuzzle,
  convertLichessSolution,
  mapRatingToDifficulty,
  importLichessPuzzle
};




  // Main builder initialization
  // Chess Puzzle Builder - Main Entry Point

// Expose solution functions globally for onclick handlers
window.builderRewindToMove = rewindToMove;
window.builderDeleteMove = deleteMove;
window.builderTruncateFrom = truncateFrom;

// Wait for both DOM and chess libraries to be ready
function waitForChessLibraries() {
  return new Promise((resolve) => {
    if (window.Chess && window.Chessground) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.Chess && window.Chessground) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    }
  });
}

// Initialize the builder when DOM and libraries are ready
document.addEventListener('DOMContentLoaded', async () => {
  await waitForChessLibraries();
  initializeBuilder();
});

function initializeBuilder() {
  console.log('Initializing Chess Puzzle Builder...');

  // Initialize chess.js instance
  state.chess = new Chess(state.fen);

  // Initialize editor board (Chessground)
  initializeEditorBoard();

  // Set up event listeners
  setupEventListeners();

  // Update UI to reflect initial state
  decomposeFEN(state.fen);
  updateFenDisplay(state.fen);
  updatePreview();

  // Load from localStorage if available
  loadFromLocalStorage();

  showToast('Builder initialized', 'success');
}

// Setup all event listeners
function setupEventListeners() {
  // Mode toggle buttons
  document.getElementById('mode-board').addEventListener('click', () => switchMode('board'));
  document.getElementById('mode-solution').addEventListener('click', () => switchMode('solution'));

  // Piece palette
  document.querySelectorAll('.palette-piece').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Toggle active state
      document.querySelectorAll('.palette-piece').forEach(b => b.classList.remove('active'));

      const piece = e.target.dataset.piece;
      if (state.activePalettePiece === piece) {
        state.activePalettePiece = null;
      } else {
        state.activePalettePiece = piece;
        e.target.classList.add('active');
      }
    });
  });

  // Board action buttons
  document.getElementById('btn-start-position').addEventListener('click', loadStartPosition);
  document.getElementById('btn-empty-board').addEventListener('click', loadEmptyBoard);
  document.getElementById('btn-flip-board').addEventListener('click', flipBoard);
  document.getElementById('btn-trash').addEventListener('click', enableTrashMode);

  // FEN controls
  document.getElementById('btn-copy-fen').addEventListener('click', copyFenToClipboard);
  document.getElementById('side-to-move').addEventListener('change', rebuildFenFromBoard);
  ['castle-K', 'castle-Q', 'castle-k', 'castle-q'].forEach(id => {
    document.getElementById(id).addEventListener('change', rebuildFenFromBoard);
  });
  document.getElementById('en-passant').addEventListener('input', rebuildFenFromBoard);
  document.getElementById('halfmove').addEventListener('input', rebuildFenFromBoard);
  document.getElementById('fullmove').addEventListener('input', rebuildFenFromBoard);

  // Solution controls
  document.getElementById('btn-start-recording').addEventListener('click', startRecording);
  document.getElementById('btn-stop-recording').addEventListener('click', stopRecording);
  document.getElementById('btn-clear-solution').addEventListener('click', clearSolution);

  // Premove controls
  document.getElementById('premove-enabled').addEventListener('change', (e) => {
    togglePremove(e.target.checked);
  });

  // Widget settings
  document.getElementById('widget-width').addEventListener('input', (e) => {
    state.meta.width = parseInt(e.target.value);
    updatePreview();
  });
  document.getElementById('widget-theme').addEventListener('change', (e) => {
    state.meta.theme = e.target.value;
    updatePreview();
  });

  // Metadata
  document.getElementById('puzzle-title').addEventListener('input', (e) => {
    state.meta.title = e.target.value;
    autoSave();
  });
  document.getElementById('puzzle-tags').addEventListener('input', (e) => {
    state.meta.tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    autoSave();
  });
  document.getElementById('puzzle-difficulty').addEventListener('change', (e) => {
    state.meta.difficulty = e.target.value;
    autoSave();
  });

  // Header actions
  document.getElementById('btn-new').addEventListener('click', newPuzzle);

  // Dropdown menu
  const menuToggle = document.getElementById('menu-toggle');
  const dropdownMenu = document.getElementById('dropdown-menu');

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
  });

  // Dropdown menu items
  document.getElementById('btn-load').addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    loadJson();
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    downloadJson();
  });

  document.getElementById('btn-copy-html').addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    showHtmlDialog();
  });

  document.getElementById('btn-download-json').addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    downloadJson();
  });

  document.getElementById('btn-import-lichess').addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    showLichessImportDialog();
  });

  // HTML Dialog
  const htmlDialog = document.getElementById('html-dialog');
  const dialogClose = document.getElementById('dialog-close');
  const dialogCancel = document.getElementById('dialog-cancel');
  const dialogCopy = document.getElementById('dialog-copy');

  dialogClose.addEventListener('click', () => {
    htmlDialog.classList.remove('show');
  });

  dialogCancel.addEventListener('click', () => {
    htmlDialog.classList.remove('show');
  });

  dialogCopy.addEventListener('click', () => {
    const textarea = document.getElementById('html-snippet-text');
    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    showToast('HTML snippet copied to clipboard!', 'success');
  });

  // Close dialog when clicking overlay
  htmlDialog.addEventListener('click', (e) => {
    if (e.target === htmlDialog) {
      htmlDialog.classList.remove('show');
    }
  });

  // Lichess Import Dialog
  const lichessDialog = document.getElementById('lichess-dialog');
  const lichessDialogClose = document.getElementById('lichess-dialog-close');
  const lichessCancelBtn = document.getElementById('lichess-cancel-btn');
  const lichessImportBtn = document.getElementById('lichess-import-btn');
  const lichessPuzzleInput = document.getElementById('lichess-puzzle-input');

  lichessDialogClose.addEventListener('click', closeLichessImportDialog);
  lichessCancelBtn.addEventListener('click', closeLichessImportDialog);
  lichessImportBtn.addEventListener('click', handleLichessImport);

  // Close dialog when clicking overlay
  lichessDialog.addEventListener('click', (e) => {
    if (e.target === lichessDialog) {
      closeLichessImportDialog();
    }
  });

  // Handle Enter key in input
  lichessPuzzleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLichessImport();
    }
  });

  // Clear error when user types
  lichessPuzzleInput.addEventListener('input', () => {
    document.getElementById('lichess-error').style.display = 'none';
  });
}

// Show HTML snippet dialog
function showHtmlDialog() {
  // Validate solution before showing
  if (state.solution.length > 0) {
    const validation = validateSolution();
    if (!validation.valid) {
      showToast(`Cannot export: ${validation.message}`, 'error');
      return;
    }
  }

  const snippet = buildHtmlSnippet();
  const textarea = document.getElementById('html-snippet-text');
  textarea.value = snippet;

  const dialog = document.getElementById('html-dialog');
  dialog.classList.add('show');
}

// Build HTML snippet (extracted from persistence.js)
function buildHtmlSnippet() {
  const solution = state.solution.map(m => m.uci).join(',');
  const fenParts = state.fen.split(' ');
  const sideToMove = fenParts[1]; // 'w' or 'b'

  // If premove enabled, flip orientation
  const orientation = state.premoveEnabled
    ? (sideToMove === 'w' ? 'black' : 'white')
    : (sideToMove === 'b' ? 'black' : 'white');

  // Include premove-enabled flag if needed
  const premoveAttr = state.premoveEnabled ? 'data-premove-enabled="true"' : '';

  return `<div class="chess-puzzle"
     data-fen="${state.fen}"
     ${premoveAttr}
     data-solution="${solution}"
     data-width="${state.meta.width}"
     data-theme="${state.meta.theme}"
     data-orientation="${orientation}"
     data-stockfish-enabled="true"></div>`;
}

// Mode switching
function switchMode(mode) {
  const boardBtn = document.getElementById('mode-board');
  const solutionBtn = document.getElementById('mode-solution');
  const titleElement = document.getElementById('board-section-title');

  if (mode === 'board') {
    // Switch to Board Setup mode
    document.body.classList.remove('solution-mode');
    boardBtn.classList.add('active');
    solutionBtn.classList.remove('active');
    titleElement.textContent = 'Board Editor';

    // Ensure edit mode
    if (state.mode === 'record') {
      stopRecording();
    }

    showToast('Switched to Board Setup mode', 'info');
  } else {
    // Switch to Solution Recording mode
    document.body.classList.add('solution-mode');
    boardBtn.classList.remove('active');
    solutionBtn.classList.add('active');
    titleElement.textContent = 'Solution Recording';

    showToast('Switched to Solution Recording mode - Click "Start Recording" to begin', 'info');
  }
}

// Lichess Import Functions
function showLichessImportDialog() {
  const dialog = document.getElementById('lichess-dialog');
  const input = document.getElementById('lichess-puzzle-input');
  const errorEl = document.getElementById('lichess-error');
  const loadingEl = document.getElementById('lichess-loading');

  // Reset dialog state
  input.value = '';
  errorEl.style.display = 'none';
  loadingEl.style.display = 'none';

  // Show dialog
  dialog.classList.add('show');

  // Auto-focus input
  setTimeout(() => input.focus(), 100);
}

function closeLichessImportDialog() {
  const dialog = document.getElementById('lichess-dialog');
  dialog.classList.remove('show');
}

async function handleLichessImport() {
  const input = document.getElementById('lichess-puzzle-input');
  const errorEl = document.getElementById('lichess-error');
  const loadingEl = document.getElementById('lichess-loading');
  const importBtn = document.getElementById('lichess-import-btn');
  const cancelBtn = document.getElementById('lichess-cancel-btn');

  const puzzleIdOrUrl = input.value.trim();

  if (!puzzleIdOrUrl) {
    showLichessError('Please enter a puzzle ID or URL.');
    return;
  }

  // Hide error, show loading
  errorEl.style.display = 'none';
  loadingEl.style.display = 'flex';
  importBtn.disabled = true;
  cancelBtn.disabled = true;

  try {
    // Import puzzle from Lichess
    const puzzleData = await importLichessPuzzle(puzzleIdOrUrl);

    // Update builder state
    state.fen = puzzleData.fen;
    state.chess = new Chess(puzzleData.fen);
    state.premoveEnabled = puzzleData.premoveEnabled;  // Flag that first move is opponent's
    state.solution = puzzleData.solution;  // Includes opponent's move as first element
    state.meta.title = puzzleData.meta.title;
    state.meta.tags = puzzleData.meta.tags;
    state.meta.difficulty = puzzleData.meta.difficulty;

    // Update the editor board visual state with the new FEN
    state.editorBoard.set({ fen: state.fen });

    // Update UI controls to match the imported FEN
    decomposeFEN(state.fen);
    updateFenDisplay(state.fen);
    updatePremoveDisplay();  // Update premove display
    updateSolutionList();  // Update solution list to show imported moves
    updatePreview();

    // Update metadata inputs
    document.getElementById('puzzle-title').value = state.meta.title;
    document.getElementById('puzzle-tags').value = state.meta.tags.join(', ');
    document.getElementById('puzzle-difficulty').value = state.meta.difficulty;

    // Auto-save
    autoSave();

    // Close dialog
    closeLichessImportDialog();

    // Show success message
    showToast(`Puzzle "${puzzleData.meta.lichessId}" imported successfully!`, 'success');

    // Switch to board mode
    switchMode('board');

  } catch (error) {
    // Show error
    showLichessError(error.message);
  } finally {
    // Hide loading, enable buttons
    loadingEl.style.display = 'none';
    importBtn.disabled = false;
    cancelBtn.disabled = false;
  }
}

function showLichessError(message) {
  const errorEl = document.getElementById('lichess-error');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}


})();
