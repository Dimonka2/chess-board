/**
 * Solution Validator - Handles alternative solution paths
 * Supports multiple solution paths separated by pipe (|) character
 * Following Lichess/Chess.com puzzle notation standards
 */

class SolutionValidator {
  constructor(solutionString) {
    this.solutionPaths = this.parseSolutions(solutionString);
    this.currentMoveIndex = 0;
    this.activePaths = [...this.solutionPaths]; // Clone all paths
  }

  /**
   * Parse solution string into multiple paths
   * @param {string} solutionString - Solution moves, optionally separated by |
   * @returns {Array<Array<string>>} Array of solution paths
   */
  parseSolutions(solutionString) {
    if (!solutionString || solutionString.trim() === '') {
      return [];
    }

    // Split by pipe to get alternative paths
    const paths = solutionString.split('|').map(path => path.trim());

    // Convert each path to array of moves
    return paths.map(path =>
      path.split(',')
          .map(move => move.trim())
          .filter(Boolean)
    );
  }

  /**
   * Check if a move is valid at the current position
   * @param {string} move - Move notation (UCI or SAN)
   * @param {number} moveIndex - Current move index
   * @returns {boolean} True if move is valid in any active path
   */
  isValidMove(move, moveIndex) {
    // Check if move is valid in ANY active path
    const validPaths = this.activePaths.filter(path => {
      if (moveIndex >= path.length) return false;
      return path[moveIndex] === move;
    });

    if (validPaths.length > 0) {
      // Update active paths to only those that matched
      this.activePaths = validPaths;
      return true;
    }

    return false;
  }

  /**
   * Get all expected moves at the current position
   * @param {number} moveIndex - Current move index
   * @returns {string[]} Array of valid move notations
   */
  getExpectedMoves(moveIndex) {
    // Get all possible valid moves at this position
    const expectedMoves = new Set();
    this.activePaths.forEach(path => {
      if (moveIndex < path.length) {
        expectedMoves.add(path[moveIndex]);
      }
    });
    return Array.from(expectedMoves);
  }

  /**
   * Check if puzzle is solved
   * @param {number} moveIndex - Current move index
   * @returns {boolean} True if reached end of any active path
   */
  isPuzzleSolved(moveIndex) {
    // Puzzle is solved if we've reached the end of any active path
    return this.activePaths.some(path => moveIndex >= path.length);
  }

  /**
   * Get the number of alternative paths still available
   * @returns {number} Number of active solution paths
   */
  getActivePathCount() {
    return this.activePaths.length;
  }

  /**
   * Check if there are multiple solution paths available
   * @returns {boolean} True if multiple paths exist
   */
  hasMultiplePaths() {
    return this.solutionPaths.length > 1;
  }

  /**
   * Reset the validator to initial state
   */
  reset() {
    this.currentMoveIndex = 0;
    this.activePaths = [...this.solutionPaths];
  }

  /**
   * Get total number of solution paths defined
   * @returns {number} Total paths
   */
  getTotalPaths() {
    return this.solutionPaths.length;
  }

  /**
   * Check if solution validator has any solutions
   * @returns {boolean} True if solutions exist
   */
  hasSolution() {
    return this.solutionPaths.length > 0 && this.solutionPaths[0].length > 0;
  }
}

// Expose SolutionValidator to window for global access
if (typeof window !== 'undefined') {
  window.SolutionValidator = SolutionValidator;
}
