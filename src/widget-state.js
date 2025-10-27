/**
 * Puzzle State Management
 * Handles state machine logic, event system, and state history tracking
 */

/**
 * Valid puzzle states
 */
const PUZZLE_STATES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  WRONG_MOVE: 'wrong_move',
  SOLVED: 'solved'
};

/**
 * PuzzleState class - Manages puzzle state machine and event system
 */
class PuzzleState {
  constructor() {
    // Initialize state
    this.currentState = PUZZLE_STATES.NOT_STARTED;

    // Event listeners storage
    // Format: { eventName: [callback1, callback2, ...] }
    this.eventListeners = {};

    // State history
    // Format: [{ state, timestamp, metadata }, ...]
    this.stateHistory = [];

    // Record initial state in history
    this.stateHistory.push({
      state: this.currentState,
      timestamp: Date.now(),
      metadata: {}
    });
  }

  /**
   * Set new state and emit state change event
   * @param {string} newState - New state to transition to
   * @param {object} metadata - Optional metadata about the transition
   */
  setState(newState, metadata = {}) {
    // Validate state
    const validStates = Object.values(PUZZLE_STATES);
    if (!validStates.includes(newState)) {
      console.warn(`Invalid state: ${newState}. Valid states are: ${validStates.join(', ')}`);
      return;
    }

    // Store previous state
    const previousState = this.currentState;

    // Update current state
    this.currentState = newState;

    // Add to state history
    const historyEntry = {
      state: newState,
      timestamp: Date.now(),
      metadata: metadata
    };
    this.stateHistory.push(historyEntry);

    // Emit state change event
    this.emitEvent('stateChange', {
      previous: previousState,
      current: newState,
      metadata: metadata
    });
  }

  /**
   * Get current state
   * @returns {string} Current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Get full state history
   * @returns {Array} State history array
   */
  getStateHistory() {
    return [...this.stateHistory]; // Return copy to prevent external modification
  }

  /**
   * Register an event listener
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function to execute
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      console.warn('Event callback must be a function');
      return;
    }

    // Initialize event listener array if it doesn't exist
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }

    // Add callback to listeners
    this.eventListeners[eventName].push(callback);
  }

  /**
   * Unregister an event listener
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function to remove
   */
  off(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      return;
    }

    // Remove callback from listeners
    this.eventListeners[eventName] = this.eventListeners[eventName].filter(
      cb => cb !== callback
    );

    // Clean up empty arrays
    if (this.eventListeners[eventName].length === 0) {
      delete this.eventListeners[eventName];
    }
  }

  /**
   * Emit an event to all registered listeners
   * @param {string} eventName - Name of the event
   * @param {*} data - Data to pass to event listeners
   */
  emitEvent(eventName, data) {
    if (!this.eventListeners[eventName]) {
      return;
    }

    // Call all registered listeners with the event data
    this.eventListeners[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for "${eventName}":`, error);
      }
    });
  }

  /**
   * Check if puzzle is in a specific state
   * @param {string} state - State to check
   * @returns {boolean}
   */
  isState(state) {
    return this.currentState === state;
  }

  /**
   * Check if puzzle has not been started
   * @returns {boolean}
   */
  isNotStarted() {
    return this.currentState === PUZZLE_STATES.NOT_STARTED;
  }

  /**
   * Check if puzzle is in progress
   * @returns {boolean}
   */
  isInProgress() {
    return this.currentState === PUZZLE_STATES.IN_PROGRESS;
  }

  /**
   * Check if user made a wrong move
   * @returns {boolean}
   */
  isWrongMove() {
    return this.currentState === PUZZLE_STATES.WRONG_MOVE;
  }

  /**
   * Check if puzzle is solved
   * @returns {boolean}
   */
  isSolved() {
    return this.currentState === PUZZLE_STATES.SOLVED;
  }

  /**
   * Reset state to initial (not_started)
   */
  reset() {
    this.setState(PUZZLE_STATES.NOT_STARTED, { reset: true });
  }
}

// Expose PuzzleState to window for global access
if (typeof window !== 'undefined') {
  window.PuzzleState = PuzzleState;
  window.PUZZLE_STATES = PUZZLE_STATES;
}
