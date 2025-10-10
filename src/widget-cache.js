/**
 * Move Cache System
 * Caches Stockfish responses in localStorage to reduce API calls
 */

class MoveCache {
  constructor(puzzleFen) {
    this.puzzleId = this.generatePuzzleId(puzzleFen);
    this.cache = this.loadFromStorage() || {};
    this.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Generate a unique ID for this puzzle based on its FEN
   * @param {string} fen - Starting FEN position
   * @returns {string} Puzzle ID
   */
  generatePuzzleId(fen) {
    // Simple hash of starting FEN for cache key
    // Use base64 encoding and take first 16 characters
    try {
      return btoa(fen).substring(0, 16);
    } catch (e) {
      // Fallback if btoa fails
      return fen.substring(0, 16).replace(/[^a-zA-Z0-9]/g, '_');
    }
  }

  /**
   * Get cached move for a position
   * @param {string} fen - Position FEN
   * @param {number} depth - Stockfish depth
   * @returns {object|null} Cached move data or null
   */
  getCachedMove(fen, depth) {
    const key = `${fen}:${depth}`;
    const cached = this.cache[key];

    if (!cached) {
      return null;
    }

    // Check if cache entry is still valid (not expired)
    const age = Date.now() - cached.timestamp;
    if (age > this.maxAge) {
      // Cache expired, remove it
      delete this.cache[key];
      this.saveToStorage();
      return null;
    }

    return {
      move: cached.move,
      evaluation: cached.evaluation,
      mate: cached.mate
    };
  }

  /**
   * Store a move in the cache
   * @param {string} fen - Position FEN
   * @param {number} depth - Stockfish depth
   * @param {object} moveData - Move data to cache
   */
  setCachedMove(fen, depth, moveData) {
    const key = `${fen}:${depth}`;
    this.cache[key] = {
      move: moveData.move,
      evaluation: moveData.evaluation,
      mate: moveData.mate || null,
      timestamp: Date.now()
    };
    this.saveToStorage();
  }

  /**
   * Load cache from localStorage
   * @returns {object|null} Cached data or null
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(`sf-cache-${this.puzzleId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Failed to load Stockfish cache:', e);
      return null;
    }
  }

  /**
   * Save cache to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(`sf-cache-${this.puzzleId}`, JSON.stringify(this.cache));
    } catch (e) {
      // Handle quota exceeded or other localStorage errors
      console.warn('Failed to save Stockfish cache:', e);

      // Try to clear old entries and retry
      if (e.name === 'QuotaExceededError') {
        this.pruneOldEntries();
        try {
          localStorage.setItem(`sf-cache-${this.puzzleId}`, JSON.stringify(this.cache));
        } catch (retryError) {
          console.error('Failed to save cache even after pruning:', retryError);
        }
      }
    }
  }

  /**
   * Remove old cache entries to free up space
   */
  pruneOldEntries() {
    const now = Date.now();
    let removed = 0;

    Object.keys(this.cache).forEach(key => {
      const entry = this.cache[key];
      const age = now - entry.timestamp;

      // Remove entries older than 7 days during pruning
      if (age > 7 * 24 * 60 * 60 * 1000) {
        delete this.cache[key];
        removed++;
      }
    });

    console.log(`Pruned ${removed} old cache entries`);
  }

  /**
   * Clear all cached moves for this puzzle
   */
  clear() {
    this.cache = {};
    try {
      localStorage.removeItem(`sf-cache-${this.puzzleId}`);
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    const entries = Object.keys(this.cache).length;
    const oldestEntry = Object.values(this.cache).reduce((oldest, entry) => {
      return entry.timestamp < oldest ? entry.timestamp : oldest;
    }, Date.now());

    return {
      entries,
      puzzleId: this.puzzleId,
      oldestEntryAge: entries > 0 ? Date.now() - oldestEntry : 0
    };
  }
}

// Expose MoveCache to window for global access
if (typeof window !== 'undefined') {
  window.MoveCache = MoveCache;
}
