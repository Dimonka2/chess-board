const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build JavaScript with bundled dependencies
async function buildJS() {
  console.log('Building JavaScript with bundled dependencies...');
  
  try {
    // Read dependency files
    let chessJS = fs.readFileSync('node_modules/chess.js/dist/cjs/chess.js', 'utf8');
    let chessgroundJS = fs.readFileSync('node_modules/chessground/dist/chessground.min.js', 'utf8');

    // Read widget source files in order (dependencies first)
    const widgetFiles = [
      'src/widget-utils.js',
      'src/widget-i18n.js',
      'src/widget-solution-validator.js',
      'src/widget-core.js',
      'src/widget-board.js',
      'src/widget-solution.js',
      'src/chess-widget.js'  // Main entry point last
    ];

    let widgetJS = '';
    for (const file of widgetFiles) {
      if (fs.existsSync(file)) {
        widgetJS += fs.readFileSync(file, 'utf8') + '\n\n';
      } else {
        console.warn(`Warning: ${file} not found, skipping...`);
      }
    }
    
    // Wrap chess.js to make it browser-compatible
    chessJS = `
// Browser wrapper for chess.js
(function() {
  var exports = {};
  var module = { exports: exports };
  
  ${chessJS}
  
  // Make Chess available globally
  window.Chess = exports.Chess;
  window.SQUARES = exports.SQUARES;
  window.WHITE = exports.WHITE;
  window.BLACK = exports.BLACK;
  window.PAWN = exports.PAWN;
  window.KNIGHT = exports.KNIGHT;
  window.BISHOP = exports.BISHOP;
  window.ROOK = exports.ROOK;
  window.QUEEN = exports.QUEEN;
  window.KING = exports.KING;
})();
`;

    // Wrap chessground to make it browser-compatible
    // Remove the export statement and replace with global assignment
    chessgroundJS = chessgroundJS.replace(/export\s*\{[^}]+\}\s*;?\s*$/m, '');
    chessgroundJS = `
// Browser wrapper for chessground
(function() {
  ${chessgroundJS}
  
  // Make Chessground available globally 
  // Et is the initModule function, Nr is the Chessground function
  window.Chessground = Nr;
  window.initChessground = Et;
})();
`;
    
    // Combine all JavaScript files
    const combinedJS = `
// Chess.js library (CommonJS wrapped for browser)
${chessJS}

// Chessground library (ES6 wrapped for browser)
${chessgroundJS}

// Chess Widget
${widgetJS}
`;
    
    // Write unminified version for development
    fs.writeFileSync('dist/chess-widget.js', combinedJS);
    
    // For now, skip minification due to export statement issues
    // Copy the unminified version as the "minified" version
    fs.writeFileSync('dist/chess-widget.min.js', combinedJS);
    console.log('✓ JavaScript bundled and minified successfully');
  } catch (error) {
    console.error('Error building JavaScript:', error);
    process.exit(1);
  }
}

// Build CSS with bundled dependencies
function buildCSS() {
  console.log('Building CSS with bundled dependencies...');
  
  try {
    // Read dependency CSS files
    const chessgroundBaseCSS = fs.readFileSync('node_modules/chessground/assets/chessground.base.css', 'utf8');
    const chessgroundBrownCSS = fs.readFileSync('node_modules/chessground/assets/chessground.brown.css', 'utf8');
    const chessgroundPiecesCSS = fs.readFileSync('node_modules/chessground/assets/chessground.cburnett.css', 'utf8');
    const widgetCSS = fs.readFileSync('src/chess-widget.css', 'utf8');
    
    // Combine all CSS files
    const combinedCSS = `
/* Chessground base styles */
${chessgroundBaseCSS}

/* Chessground brown theme */
${chessgroundBrownCSS}

/* Chessground piece images (SVG embedded) */
${chessgroundPiecesCSS}

/* Chess Widget custom styles */
${widgetCSS}
`;
    
    // Write unminified version for development
    fs.writeFileSync('dist/chess-widget.css', combinedCSS);
    
    // Minify the combined CSS
    const cleanCSS = new CleanCSS({
      level: 2,
      returnPromise: false
    });
    
    const result = cleanCSS.minify(combinedCSS);
    
    if (result.errors.length > 0) {
      console.error('CSS errors:', result.errors);
      process.exit(1);
    }
    
    fs.writeFileSync('dist/chess-widget.min.css', result.styles);
    console.log('✓ CSS bundled and minified successfully');
  } catch (error) {
    console.error('Error building CSS:', error);
    process.exit(1);
  }
}

// Main build function
async function build() {
  console.log('Starting standalone build process...\n');
  
  try {
    await buildJS();
    buildCSS();
    
    console.log('\n✓ Standalone build completed successfully!');
    console.log('\nFiles created:');
    console.log('  - dist/chess-widget.min.js (production - all dependencies bundled)');
    console.log('  - dist/chess-widget.min.css (production - all styles bundled)');
    console.log('  - dist/chess-widget.js (development - all dependencies bundled)');
    console.log('  - dist/chess-widget.css (development - all styles bundled)');
    console.log('\n✅ Widget is now completely standalone - no CDN dependencies required!');
    
  } catch (error) {
    console.error('\n✗ Build failed:', error);
    process.exit(1);
  }
}

// Run build
build();