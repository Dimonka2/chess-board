/**
 * ChessWidget Core - Main class definition and initialization
 * Constructor and initialization logic
 */

class ChessWidget {
  constructor(element) {
    this.element = element;

    // Parse configuration from data attributes
    this.parseConfiguration(element);

    // Initialize i18n
    const lang = element.dataset.lang || 'en';
    this.i18n = new I18n(lang);

    // Apply custom languages if any were registered
    if (I18n._customLanguages) {
      Object.keys(I18n._customLanguages).forEach(langKey => {
        this.i18n.addLanguage(langKey, I18n._customLanguages[langKey]);
      });
      // Reapply language in case a custom one was specified
      this.i18n.setLanguage(lang);
    }

    // Initialize solution validator (supports alternative solutions)
    const solutionString = element.dataset.solution || '';
    this.solutionValidator = solutionString ? new SolutionValidator(solutionString) : null;

    // Initialize Stockfish components (Phase 2)
    if (this.stockfishEnabled) {
      this.stockfish = new StockfishClient({
        depth: this.stockfishDepth,
        timeout: this.stockfishTimeout
      });

      // Initialize cache if enabled
      if (this.stockfishCacheEnabled) {
        this.cache = new MoveCache(this.fen);
      }
    } else {
      this.stockfish = null;
      this.cache = null;
    }

    // Initialize state
    this.currentMoveIndex = 0;
    this.chess = null;
    this.chessground = null;

    this.init();
  }

  /**
   * Parse configuration from element data attributes
   * @param {HTMLElement} element - Widget element
   */
  parseConfiguration(element) {
    // Board configuration
    this.fen = element.dataset.fen;
    this.width = parseInteger(element.dataset.width, 400);
    this.theme = element.dataset.theme || 'blue';
    this.autoFlip = parseBoolean(element.dataset.autoFlip, false);
    this.fixedOrientation = element.dataset.orientation || null; // 'white', 'black', or null for auto

    // Premove configuration
    this.premoveEnabled = parseBoolean(element.dataset.premoveEnabled, false);

    // Stockfish configuration (for future Phase 2)
    this.stockfishEnabled = parseBoolean(element.dataset.stockfishEnabled, false);
    this.stockfishDepth = parseInteger(element.dataset.stockfishDepth, 12);
    this.stockfishTimeout = parseInteger(element.dataset.stockfishTimeout, 2000);
    this.stockfishShowArrow = parseBoolean(element.dataset.stockfishShowArrow, true);
    this.stockfishShowAnimation = parseBoolean(element.dataset.stockfishShowAnimation, true);
    this.stockfishCacheEnabled = parseBoolean(element.dataset.stockfishCacheEnabled, true);
  }

  /**
   * Initialize the chess widget
   */
  init() {
    try {
      // Create chess instance
      this.chess = new Chess(this.fen);

      // Create board container
      this.createBoardContainer();

      // Initialize chessground
      this.initChessground();

      // Create controls
      this.createControls();

      // If premove is enabled, play first move automatically
      if (this.premoveEnabled && this.solutionValidator && this.solutionValidator.hasSolution()) {
        setTimeout(() => {
          this.playPremove();
        }, 500);
      }

      console.log('Chess widget initialized successfully');
    } catch (error) {
      console.error('Error initializing chess widget:', error);
    }
  }

  /**
   * Static method to initialize all chess widgets on the page
   */
  static init() {
    // Initialize all chess widgets on the page
    const widgets = document.querySelectorAll('.chess-puzzle');
    widgets.forEach(widget => new ChessWidget(widget));
  }
}

// Expose ChessWidget to window for global access
if (typeof window !== 'undefined') {
  window.ChessWidget = ChessWidget;
}
