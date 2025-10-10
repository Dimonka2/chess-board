/**
 * Stockfish API Client
 * Handles communication with stockfish.online API for best move analysis
 */

class StockfishClient {
  constructor(config = {}) {
    this.depth = config.depth || 12;
    this.timeout = config.timeout || 2000;
    this.apiUrl = 'https://stockfish.online/api/s/v2.php';
  }

  /**
   * Get the best move for a given position
   * @param {string} fen - FEN position string
   * @returns {Promise<{move: string, evaluation: number}>}
   */
  async getBestMove(fen) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Build URL with GET parameters - stockfish.online API uses GET
      // URLSearchParams encodes spaces as + which breaks FEN notation
      // So we manually build the query string and encode properly
      const params = new URLSearchParams();
      params.append('fen', fen);
      params.append('depth', this.depth.toString());

      // Convert + back to %20 for proper space encoding in FEN
      const queryString = params.toString().replace(/\+/g, '%20');
      const url = `${this.apiUrl}?${queryString}`;

      console.log('Stockfish API request:', url);

      // Make API request using GET
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Log the full response for debugging
      console.log('Stockfish API response:', data);

      // Validate response - handle both success and error cases
      if (!data.success) {
        console.error('Stockfish API error:', data.error || 'Unknown error');
        throw new Error(data.error || 'Invalid response from Stockfish API');
      }

      if (!data.bestmove) {
        throw new Error('No best move returned from Stockfish API');
      }

      // Parse the bestmove - format is "bestmove e2e4 ponder e7e5"
      // We need to extract just the move part (e.g., "e2e4")
      let moveUci = data.bestmove;
      if (moveUci.startsWith('bestmove ')) {
        // Extract the move after "bestmove " and before " ponder"
        moveUci = moveUci.substring(9).split(' ')[0];
      }

      // Return move and evaluation
      return {
        move: moveUci,
        evaluation: data.evaluation || 0,
        mate: data.mate || null,
        continuation: data.continuation || ''
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Stockfish API request timed out');
      }

      console.error('Stockfish API error:', error);
      throw error;
    }
  }

  /**
   * Check if Stockfish is available (test API connectivity)
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      // Test with starting position
      const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      await this.getBestMove(testFen);
      return true;
    } catch (error) {
      console.warn('Stockfish API not available:', error.message);
      return false;
    }
  }

  /**
   * Update configuration
   * @param {object} config - New configuration
   */
  updateConfig(config) {
    if (config.depth !== undefined) this.depth = config.depth;
    if (config.timeout !== undefined) this.timeout = config.timeout;
  }
}

// Expose StockfishClient to window for global access
if (typeof window !== 'undefined') {
  window.StockfishClient = StockfishClient;
}
