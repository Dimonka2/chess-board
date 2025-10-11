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
export {
  extractPuzzleId,
  fetchLichessPuzzle,
  deriveFenFromLichessPuzzle,
  convertLichessSolution,
  mapRatingToDifficulty,
  importLichessPuzzle
};
