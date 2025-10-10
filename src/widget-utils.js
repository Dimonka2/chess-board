/**
 * Utility Functions for Chess Widget
 * Common helper functions and constants
 */

/**
 * Delay/sleep utility for async operations
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format a move for display (convert UCI to human-readable if needed)
 * @param {string} move - Move notation
 * @returns {string} Formatted move
 */
function formatMove(move) {
  // For now, just return the move as-is
  // Could be enhanced to convert UCI to algebraic notation
  return move;
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Parse boolean from string (handles 'true'/'false' strings)
 * @param {string|boolean} value - Value to parse
 * @param {boolean} defaultValue - Default if undefined
 * @returns {boolean} Parsed boolean
 */
function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Parse integer with default value
 * @param {string|number} value - Value to parse
 * @param {number} defaultValue - Default if invalid
 * @returns {number} Parsed integer
 */
function parseInteger(value, defaultValue = 0) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Expose utility functions to window for global access
if (typeof window !== 'undefined') {
  window.delay = delay;
  window.formatMove = formatMove;
  window.deepClone = deepClone;
  window.isEmpty = isEmpty;
  window.parseBoolean = parseBoolean;
  window.parseInteger = parseInteger;
}
