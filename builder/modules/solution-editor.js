// Solution Editor Module - Handles move recording and solution management

import { state } from './state.js';
import { showToast, updateFenDisplay } from './ui-utils.js';
import { updatePreview } from './preview.js';

// Update solution list table
export function updateSolutionList() {
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
export function startRecording() {
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

export function stopRecording() {
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

export function clearSolution() {
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
export function rewindToMove(index) {
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
export function deleteMove(index) {
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
export function truncateFrom(index) {
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
export function validateSolution() {
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
