// Chess Puzzle Builder - Main Entry Point

import { state } from './modules/state.js';
import { decomposeFEN } from './modules/fen-utils.js';
import { showToast, updateFenDisplay } from './modules/ui-utils.js';
import {
  initializeEditorBoard,
  rebuildFenFromBoard,
  loadStartPosition,
  loadEmptyBoard,
  flipBoard,
  enableTrashMode,
  copyFenToClipboard
} from './modules/board-editor.js';
import {
  updateSolutionList,
  updatePremoveDisplay,
  startRecording,
  stopRecording,
  clearSolution,
  rewindToMove,
  deleteMove,
  truncateFrom,
  validateSolution,
  togglePremove
} from './modules/solution-editor.js';
import { updatePreview } from './modules/preview.js';
import {
  loadFromLocalStorage,
  autoSave,
  copyHtmlSnippet,
  downloadJson,
  newPuzzle,
  loadJson
} from './modules/persistence.js';
import { importLichessPuzzle } from './modules/lichess-import.js';

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
