# Chess Widget

Professional chess puzzle widget using chessground and chess.js. Create interactive chess experiences like Lichess with just 2 files - completely standalone and offline-ready.

## Features

- ♟️ **Interactive Chess Puzzles** - Drag & drop pieces with solution validation
- 🔄 **Free Play Mode** - Analysis mode without puzzle constraints  
- 🔄 **Auto-Flip Board** - Automatically rotate board for black's turn
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🎨 **Professional UI** - Lichess-quality board and piece graphics
- ⚡ **Zero Dependencies** - No CDN calls, works completely offline
- 🔧 **Easy Integration** - Just include 2 files in your HTML
- 🚀 **Modern Development** - Vite dev server with live reload
- 🎯 **Multiple Widgets** - Add multiple boards to the same page
- ⚙️ **Highly Configurable** - FEN positions, solutions, board sizes

## Quick Start

### 1. Build the Widget

```bash
npm install
npm run build
```

### 2. Copy Files to Your Website

Copy these generated files to your website:
- `dist/chess-widget.min.js` (production)
- `dist/chess-widget.min.css` (production)

### 3. Include in Your HTML

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="chess-widget.min.css">
</head>
<body>
    <!-- Your chess puzzle -->
    <div class="chess-puzzle" 
         data-fen="r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"
         data-solution="d2d4,e5d4,c2c3"
         data-width="400">
    </div>
    
    <script src="chess-widget.min.js"></script>
</body>
</html>
```

### 4. That's it!

The widget will work immediately with all dependencies bundled - no internet connection required!

## Configuration

Use these data attributes to configure your chess widgets:

| Attribute | Required | Description | Example |
|-----------|----------|-------------|---------|
| `data-fen` | Yes | Chess position in FEN notation | `"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"` |
| `data-solution` | No | Comma-separated solution moves. If omitted, enables free play mode | `"e2e4,e7e5,Ng1f3"` |
| `data-width` | No | Board width in pixels (default: 400) | `"500"` |
| `data-auto-flip` | No | Auto-rotate board for black's turn (default: false) | `"true"` |

## Examples

### Basic Puzzle
```html
<div class="chess-puzzle" 
     data-fen="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1"
     data-solution="Qd1h5,Kg8h8,Qh5h7">
</div>
```

### Free Play Mode
```html
<div class="chess-puzzle" 
     data-fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1">
</div>
```

### Auto-Flip Board
```html
<div class="chess-puzzle" 
     data-fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
     data-auto-flip="true">
</div>
```

### Custom Size
```html
<div class="chess-puzzle" 
     data-fen="r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"
     data-width="600">
</div>
```

## Development

### Development Setup

For widget development with live reload:

```bash
git clone <repository>
cd chess-widget
npm install
npm run dev    # Starts Vite dev server with live reload
```

### Build Process

The build script automatically:

1. **Bundles Dependencies**: Combines chess.js and chessground into the widget
2. **Creates Multiple Formats**: Generates both minified and development versions  
3. **Includes All CSS**: Bundles chessground themes, piece images, and widget styles
4. **Module Wrapping**: Converts ES6/CommonJS modules to browser-compatible code
5. **No External Calls**: Everything is self-contained and works offline

### Commands

```bash
npm install         # Install all dependencies
npm run build       # Create production files in dist/
npm run dev         # Start development server with live reload
npm run dev:prod    # Test production build with dev server
```

### Development Features

- 🔥 **Vite Development Server** - Lightning-fast live reload
- 📦 **ES Module Imports** - Native browser modules in development
- 🐛 **Source Maps** - Easy debugging of original source code
- 🔄 **Hot Module Replacement** - Instant updates without page refresh

## How It Works

The widget:

1. **Parses Configuration**: Reads data attributes from HTML elements  
2. **Creates Board**: Initializes interactive chessground board (bundled)
3. **Validates Moves**: Uses chess.js for legal move validation (bundled)
4. **Checks Solutions**: Compares player moves against provided solutions
5. **Provides Feedback**: Shows visual feedback for correct/incorrect moves

## Move Notation

Solutions can be provided in two formats:

- **UCI notation**: `e2e4` (from-to squares)
- **SAN notation**: `Nf3` (Standard Algebraic Notation)

Examples:
- `data-solution="e2e4,e7e5,Ng1f3"` (UCI)
- `data-solution="e4,e5,Nf3"` (SAN)

## Browser Support

- Chrome 60+
- Firefox 55+  
- Safari 12+
- Edge 79+

## Dependencies

The widget bundles these libraries internally:

- [chessground](https://github.com/lichess-org/chessground) v9.2.1 - Chess board UI
- [chess.js](https://github.com/jhlywa/chess.js) v1.4.0 - Chess logic and validation

All dependencies are bundled during the build process - no external CDN calls are made.

## License

MIT License - feel free to use in personal and commercial projects.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test with `npm run dev`
5. Build with `npm run build`
6. Submit a pull request

---

Made with ♟️ by chess enthusiasts, for chess enthusiasts.