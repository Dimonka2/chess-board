// Persistence Module - Handles localStorage, import/export

import { state } from './state.js';
import { decomposeFEN } from './fen-utils.js';
import { showToast, updateFenDisplay } from './ui-utils.js';
import { updateSolutionList, validateSolution } from './solution-editor.js';
import { updatePreview } from './preview.js';

// Auto-save on changes
let saveTimeout;
export function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToLocalStorage, 300);
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

export function loadFromLocalStorage() {
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
          updateFenDisplay(state.fen);
          updateSolutionList();
          updatePreview();

          // Update metadata fields
          document.getElementById('puzzle-title').value = state.meta.title || '';
          document.getElementById('puzzle-tags').value = state.meta.tags ? state.meta.tags.join(', ') : '';
          document.getElementById('puzzle-difficulty').value = state.meta.difficulty || '';
          document.getElementById('widget-width').value = state.meta.width || 400;
          document.getElementById('widget-theme').value = state.meta.theme || 'blue';
        }
      }
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
}

// Export functions
export function copyHtmlSnippet() {
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

export function downloadJson() {
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

export function newPuzzle() {
  if (confirm('Start a new puzzle? Unsaved changes will be lost.')) {
    // Clear localStorage so we don't prompt to load on reload
    localStorage.removeItem('chess-puzzle-builder-draft');
    location.reload();
  }
}

export function loadJson() {
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
        updateFenDisplay(state.fen);
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
