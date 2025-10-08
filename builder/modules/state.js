// Global State Management

export const state = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  chess: null, // Will be initialized with Chess instance
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
