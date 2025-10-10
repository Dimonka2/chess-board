/**
 * Internationalization (i18n) System
 * Provides multi-language support for the chess widget
 */

class I18n {
  constructor(lang = 'en') {
    this.lang = lang;
    this.translations = {
      en: {
        correct: 'Correct! Keep going...',
        wrong: 'Try again!',
        solved: 'Puzzle solved! Well done!',
        stockfish_counter: 'Stockfish responds: {move}. Try again!',
        loading: 'Thinking...',
        invalid_move: 'Invalid move',
        your_turn: 'Your turn',
        make_your_move: 'Make your move',
        waiting: 'Waiting for opponent...'
      },
      de: {
        correct: 'Richtig! Weiter so...',
        wrong: 'Versuche es noch einmal!',
        solved: 'Puzzle gelöst! Gut gemacht!',
        stockfish_counter: 'Stockfish antwortet: {move}. Versuche es noch einmal!',
        loading: 'Denke nach...',
        invalid_move: 'Ungültiger Zug',
        your_turn: 'Du bist am Zug',
        make_your_move: 'Mache deinen Zug',
        waiting: 'Warte auf Gegner...'
      }
    };
  }

  /**
   * Translate a key with optional parameter substitution
   * @param {string} key - Translation key
   * @param {object} params - Optional parameters for placeholder replacement
   * @returns {string} Translated string
   */
  t(key, params = {}) {
    // Get translation for current language, fallback to English
    const translation = this.translations[this.lang]?.[key]
                     || this.translations.en[key]
                     || key;

    // Replace placeholders like {move} with actual values
    return translation.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] || match;
    });
  }

  /**
   * Set the current language
   * @param {string} lang - Language code (e.g., 'en', 'de')
   * @returns {boolean} Success status
   */
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.lang = lang;
      return true;
    }
    console.warn(`Language '${lang}' not supported, falling back to English`);
    return false;
  }

  /**
   * Add a custom language
   * @param {string} lang - Language code
   * @param {object} translations - Translation dictionary
   */
  addLanguage(lang, translations) {
    this.translations[lang] = translations;
  }

  /**
   * Get list of supported languages
   * @returns {string[]} Array of language codes
   */
  getSupportedLanguages() {
    return Object.keys(this.translations);
  }
}

// Static method to add languages globally
I18n.addLanguage = function(lang, translations) {
  // This will be available for users to extend before widget initialization
  if (!I18n._customLanguages) {
    I18n._customLanguages = {};
  }
  I18n._customLanguages[lang] = translations;
};

// Expose I18n to window for global access
if (typeof window !== 'undefined') {
  window.I18n = I18n;
}
