// Chess Puzzle Builder - Main JavaScript

// Global State Management
const state = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  chess: null, // Will be initialized with Chess instance
  solution: [], // Array of { uci: 'e2e4', san: 'e4' }
  meta: {
    title: '',
    tags: [],
    difficulty: '',
    description: '',
    theme: 'blue',
    width: 400,
    autoFlip: true
  },
  mode: 'edit', // 'edit' or 'record'
  activePalettePiece: null, // Currently selected piece from palette
  editorBoard: null, // Chessground instance for editor
  previewWidget: null // Reference to preview widget
};

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
  updateFenDisplay();
  updatePreview();

  // Load from localStorage if available
  loadFromLocalStorage();

  showToast('Builder initialized', 'success');
}

// Initialize Chessground board for editing
function initializeEditorBoard() {
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

// Parse piece data (e.g., 'wK' -> { color: 'white', role: 'king' })
function parsePieceData(pieceData) {
  const colorMap = { w: 'white', b: 'black' };
  const roleMap = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };

  const colorChar = pieceData[0];
  const roleChar = pieceData[1];

  return [colorMap[colorChar], roleMap[roleChar]];
}

// Get square from mouse event
function getSquareFromEvent(e, boardElement) {
  const rect = boardElement.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const squareSize = rect.width / 8;
  const file = Math.floor(x / squareSize);
  const rank = Math.floor(y / squareSize);

  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;

  // Adjust for board orientation
  const orientation = state.editorBoard.state.orientation;
  const actualFile = orientation === 'white' ? file : 7 - file;
  const actualRank = orientation === 'white' ? 7 - rank : rank;

  const fileChar = String.fromCharCode(97 + actualFile); // 97 = 'a'
  const rankChar = String(actualRank + 1);

  return fileChar + rankChar;
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

  // Update UI
  updateSolutionList();
  updatePreview();

  showToast(`Move recorded: ${move.san}`, 'success');
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
    updateFenDisplay();
    updatePreview();
    autoSave();
  } catch (e) {
    console.error('Invalid FEN:', e);
    updateFenDisplay();
  }
}

// Compose FEN string from components
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

// Get castling rights from checkboxes
function getCastlingRights() {
  const rights = [];
  if (document.getElementById('castle-K').checked) rights.push('K');
  if (document.getElementById('castle-Q').checked) rights.push('Q');
  if (document.getElementById('castle-k').checked) rights.push('k');
  if (document.getElementById('castle-q').checked) rights.push('q');
  return rights.join('') || '-';
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

// Update FEN display
function updateFenDisplay() {
  const fenInput = document.getElementById('fen-input');
  const fenStatus = document.getElementById('fen-status');

  fenInput.value = state.fen;

  // Validate FEN
  try {
    const testChess = new Chess(state.fen);
    fenStatus.textContent = '✓ Valid';
    fenStatus.className = 'fen-status valid';
  } catch (e) {
    fenStatus.textContent = '✗ Invalid';
    fenStatus.className = 'fen-status invalid';
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
        <button onclick="rewindToMove(${index})">⟲ Rewind</button>
        <button onclick="deleteMove(${index})">✖ Delete</button>
      </td>
    </tr>
  `).join('');
}

// Update preview widget
function updatePreview() {
  const container = document.querySelector('#preview-container .chess-puzzle');

  // Update data attributes
  container.setAttribute('data-fen', state.fen);
  container.setAttribute('data-solution', state.solution.map(m => m.uci).join(','));
  container.setAttribute('data-width', state.meta.width);
  container.setAttribute('data-theme', state.meta.theme);
  container.setAttribute('data-auto-flip', state.meta.autoFlip);

  // Re-initialize widget
  const parent = container.parentElement;
  parent.innerHTML = '';

  const newWidget = document.createElement('div');
  newWidget.className = 'chess-puzzle';
  newWidget.setAttribute('data-fen', state.fen);
  newWidget.setAttribute('data-solution', state.solution.map(m => m.uci).join(','));
  newWidget.setAttribute('data-width', state.meta.width);
  newWidget.setAttribute('data-theme', state.meta.theme);
  newWidget.setAttribute('data-auto-flip', state.meta.autoFlip);

  parent.appendChild(newWidget);

  // Initialize the widget (assuming ChessWidget is loaded from bundle)
  if (window.ChessWidget) {
    window.ChessWidget.init();
  }

  // Update preview info message
  updatePreviewInfo();
}

// Update preview info message
function updatePreviewInfo() {
  const infoDiv = document.getElementById('preview-info');
  const fen = state.fen;
  const parts = fen.split(' ');
  const turn = parts[1]; // 'w' or 'b'
  const autoFlip = state.meta.autoFlip;

  if (turn === 'b' && autoFlip) {
    infoDiv.innerHTML = '<strong>ℹ️ Auto-flip enabled:</strong> The board will flip to show black\'s perspective when the puzzle starts, since black is to move.';
    infoDiv.classList.add('show');
  } else {
    infoDiv.classList.remove('show');
  }
}

// Setup all event listeners
function setupEventListeners() {
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

  // Widget settings
  document.getElementById('widget-width').addEventListener('input', (e) => {
    state.meta.width = parseInt(e.target.value);
    updatePreview();
  });
  document.getElementById('widget-theme').addEventListener('change', (e) => {
    state.meta.theme = e.target.value;
    updatePreview();
  });
  document.getElementById('widget-autoflip').addEventListener('change', (e) => {
    state.meta.autoFlip = e.target.checked;
    updatePreview();
  });

  // Metadata
  document.getElementById('puzzle-title').addEventListener('input', (e) => {
    state.meta.title = e.target.value;
    saveToLocalStorage();
  });
  document.getElementById('puzzle-tags').addEventListener('input', (e) => {
    state.meta.tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    saveToLocalStorage();
  });
  document.getElementById('puzzle-difficulty').addEventListener('change', (e) => {
    state.meta.difficulty = e.target.value;
    saveToLocalStorage();
  });

  // Export buttons
  document.getElementById('btn-copy-html').addEventListener('click', copyHtmlSnippet);
  document.getElementById('btn-download-json').addEventListener('click', downloadJson);

  // Header actions
  document.getElementById('btn-new').addEventListener('click', newPuzzle);
  document.getElementById('btn-load').addEventListener('click', loadJson);
  document.getElementById('btn-save').addEventListener('click', downloadJson);
}

// Board action functions
function loadStartPosition() {
  state.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  state.chess = new Chess(state.fen);
  state.editorBoard.set({ fen: state.fen });
  decomposeFEN(state.fen);
  updateFenDisplay();
  updatePreview();
  showToast('Loaded start position', 'success');
}

function loadEmptyBoard() {
  state.fen = '8/8/8/8/8/8/8/8 w - - 0 1';
  state.chess = new Chess(state.fen);
  state.editorBoard.set({ fen: state.fen });
  decomposeFEN(state.fen);
  updateFenDisplay();
  updatePreview();
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

// Recording functions
function startRecording() {
  state.mode = 'record';
  state.editorBoard.set({
    movable: {
      free: false, // Disable free drag in recording mode
      color: state.chess.turn() === 'w' ? 'white' : 'black'
    }
  });

  document.getElementById('btn-start-recording').disabled = true;
  document.getElementById('btn-stop-recording').disabled = false;
  showToast('Recording started - make legal moves on the board', 'success');
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
    state.editorBoard.set({ fen: state.fen });
    updateSolutionList();
    updatePreview();
    showToast('Solution cleared', 'success');
  }
}

// Solution list functions (exposed globally for inline onclick)
window.rewindToMove = function(index) {
  // Truncate solution after this index
  state.solution = state.solution.slice(0, index);

  // Replay from start
  state.chess = new Chess(state.fen);
  state.solution.forEach(move => {
    state.chess.move(move.uci);
  });

  state.editorBoard.set({ fen: state.chess.fen() });
  updateSolutionList();
  updatePreview();
  showToast(`Rewound to move ${index}`, 'success');
};

window.deleteMove = function(index) {
  state.solution.splice(index, 1);

  // Replay from start
  state.chess = new Chess(state.fen);
  state.solution.forEach(move => {
    state.chess.move(move.uci);
  });

  state.editorBoard.set({ fen: state.chess.fen() });
  updateSolutionList();
  updatePreview();
  showToast('Move deleted', 'success');
};

// Export functions
function copyHtmlSnippet() {
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
     data-theme="${state.meta.theme}"
     data-auto-flip="${state.meta.autoFlip}"></div>`;
}

function downloadJson() {
  const data = {
    version: 1,
    fen: state.fen,
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
        state.solution = data.solution;
        state.meta = { ...state.meta, ...data.meta };
        state.chess = new Chess(state.fen);

        state.editorBoard.set({ fen: state.fen });
        decomposeFEN(state.fen);
        updateFenDisplay();
        updateSolutionList();
        updatePreview();

        // Update metadata fields
        document.getElementById('puzzle-title').value = state.meta.title || '';
        document.getElementById('puzzle-tags').value = state.meta.tags ? state.meta.tags.join(', ') : '';
        document.getElementById('puzzle-difficulty').value = state.meta.difficulty || '';
        document.getElementById('widget-width').value = state.meta.width || 400;
        document.getElementById('widget-theme').value = state.meta.theme || 'blue';
        document.getElementById('widget-autoflip').checked = state.meta.autoFlip !== false;

        showToast('Puzzle loaded', 'success');
      } catch (err) {
        showToast('Failed to load JSON', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// LocalStorage persistence
function saveToLocalStorage() {
  try {
    localStorage.setItem('chess-puzzle-builder-draft', JSON.stringify({
      fen: state.fen,
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
        if (confirm('Found a saved draft. Load it?')) {
          state.fen = data.fen;
          state.solution = data.solution;
          state.meta = { ...state.meta, ...data.meta };
          state.chess = new Chess(state.fen);

          state.editorBoard.set({ fen: state.fen });
          decomposeFEN(state.fen);
          updateFenDisplay();
          updateSolutionList();
          updatePreview();

          // Update metadata fields
          document.getElementById('puzzle-title').value = state.meta.title || '';
          document.getElementById('puzzle-tags').value = state.meta.tags ? state.meta.tags.join(', ') : '';
          document.getElementById('puzzle-difficulty').value = state.meta.difficulty || '';
          document.getElementById('widget-width').value = state.meta.width || 400;
          document.getElementById('widget-theme').value = state.meta.theme || 'blue';
          document.getElementById('widget-autoflip').checked = state.meta.autoFlip !== false;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
}

// Auto-save on changes
let saveTimeout;
function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToLocalStorage, 300);
}

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
