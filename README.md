# Chess Widget

Professional chess puzzle widget using chessground and chess.js. Create interactive chess experiences like Lichess with just 2 files - completely standalone and offline-ready.

## 🎮 Live Demo

**[Try the interactive demo here!](https://dimonka2.github.io/chess-board/demo/)**

Experience 20+ real Lichess puzzles ranging from ELO 600 to 2400, featuring:
- ♟️ Classic tactical themes (Forks, Pins, Discovered Attacks)
- 🤖 Stockfish AI counter-move feedback with visual arrows
- 🌍 Multi-language support (English/German)
- 🎭 Premove system for Lichess-style puzzle imports

**Perfect for**: Puzzle websites, chess training apps, blog articles, educational platforms

## 🛠️ Puzzle Builder Tool

**Visual puzzle creation tool with live preview!**

Create custom chess puzzles with our interactive builder - no coding required! Features drag-and-drop board setup, solution recording, Lichess imports, and instant HTML export.

**[Try the puzzle builder live here!](https://dimonka2.github.io/chess-board/dist/builder/)**

[Learn more about the Builder →](builder/README.md)

## Features

- ♟️ **Interactive Chess Puzzles** - Drag & drop pieces with solution validation
- 🎭 **Premove Support** - Automatic opponent moves before puzzle starts (perfect for Lichess imports!)
- 🔀 **Alternative Solutions** - Support multiple valid solution paths with `|` separator
- 🌍 **Internationalization** - Multi-language support (English, German, extensible)
- 🤖 **Stockfish Integration** - AI-powered counter-move feedback for wrong moves
- 🏹 **Visual Arrows** - Red arrows showing Stockfish's counter-moves
- 💾 **Smart Caching** - localStorage caching reduces API calls by >80%
- 🔄 **Free Play Mode** - Analysis mode without puzzle constraints
- 🔄 **Auto-Flip Board** - Automatically rotate board for black's turn
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🎨 **Professional UI** - Lichess-quality board and piece graphics
- ⚡ **Zero Dependencies** - No CDN calls, works completely offline
- 🔧 **Easy Integration** - Just include 2 files in your HTML
- 🚀 **Modern Development** - Vite dev server with live reload
- 🎯 **Multiple Widgets** - Add multiple boards to the same page
- ⚙️ **Highly Configurable** - FEN positions, solutions, board sizes, languages, AI feedback

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

### Core Configuration

| Attribute | Required | Description | Example |
|-----------|----------|-------------|---------|
| `data-fen` | Yes | Chess position in FEN notation | `"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"` |
| `data-solution` | No | Solution moves (comma-separated). Use `\|` for alternative paths | `"e2e4,e7e5,Nf3\|e2e4,e7e5,Bc4"` |
| `data-premove-enabled` | No | First move is auto-played as opponent's move (default: false) | `"true"` |
| `data-width` | No | Board width in pixels (default: 400) | `"500"` |
| `data-auto-flip` | No | Auto-rotate board for black's turn (default: false) | `"true"` |
| `data-orientation` | No | Fixed board orientation: 'white' or 'black' | `"black"` |
| `data-lang` | No | Language code: 'en' (English) or 'de' (German) | `"de"` |

### Stockfish AI Features

| Attribute | Required | Description | Example |
|-----------|----------|-------------|---------|
| `data-stockfish-enabled` | No | Enable AI counter-move feedback (default: false) | `"true"` |
| `data-stockfish-depth` | No | AI analysis depth, 1-20 (default: 12) | `"15"` |
| `data-stockfish-timeout` | No | API timeout in milliseconds (default: 2000) | `"3000"` |
| `data-stockfish-show-arrow` | No | Show red arrow for counter-moves (default: true) | `"true"` |
| `data-stockfish-show-animation` | No | Animate counter-moves (default: true) | `"true"` |
| `data-stockfish-cache-enabled` | No | Enable localStorage caching (default: true) | `"true"` |

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

### Alternative Solutions
```html
<!-- Puzzle with multiple correct paths -->
<div class="chess-puzzle"
     data-fen="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1"
     data-solution="f1e1,e5e4,d1h5|f1e1,e5e4,d1f3">
     <!-- Both Qh5 and Qf3 are correct after Re1 -->
</div>
```

### German Language
```html
<!-- Puzzle with German interface -->
<div class="chess-puzzle"
     data-fen="rnb3kr/p4ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1"
     data-solution="e1e8"
     data-lang="de">
</div>
```

### Stockfish AI Feedback
```html
<!-- Puzzle with AI counter-move feedback and arrows -->
<div class="chess-puzzle"
     data-fen="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1"
     data-solution="d1e2,f6e4,e2e4"
     data-stockfish-enabled="true"
     data-stockfish-depth="12"
     data-stockfish-show-arrow="true">
     <!-- Wrong moves trigger Stockfish counter-move with red arrow -->
</div>
```

### Premove (Lichess-Style Puzzles)
```html
<!-- Puzzle with opponent's premove (common in Lichess imports) -->
<div class="chess-puzzle"
     data-fen="rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3"
     data-solution="d2d4,e5d4,c2c3"
     data-premove-enabled="true"
     data-orientation="white">
     <!-- First move (d2d4) is auto-played as opponent's move -->
     <!-- Board automatically flips to show player's perspective -->
     <!-- Perfect for imported Lichess puzzles! -->
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
npm install           # Install all dependencies
npm run build         # Create widget production files in dist/
npm run build:builder # Build widget + builder for production
npm run dev           # Start demo dev server with live reload
npm run dev:prod      # Test production build with dev server
npm run dev:builder   # Start builder dev server
```

### Development Features

- 🔥 **Vite Development Server** - Lightning-fast live reload
- 📦 **ES Module Imports** - Native browser modules in development
- 🐛 **Source Maps** - Easy debugging of original source code
- 🔄 **Hot Module Replacement** - Instant updates without page refresh

## How It Works

The widget:

1. **Parses Configuration**: Reads data attributes from HTML elements (language, Stockfish settings, etc.)
2. **Creates Board**: Initializes interactive chessground board (bundled)
3. **Validates Moves**: Uses chess.js for legal move validation (bundled)
4. **Checks Solutions**: Supports multiple solution paths with alternative move sequences
5. **Provides Feedback**: Shows visual feedback in the selected language
6. **AI Counter-Moves**: When enabled, wrong moves trigger Stockfish analysis with visual arrows
7. **Smart Caching**: Stores Stockfish responses in localStorage to reduce API calls

## Move Notation

Solutions can be provided in two formats:

- **UCI notation**: `e2e4` (from-to squares)
- **SAN notation**: `Nf3` (Standard Algebraic Notation)

Examples:
- `data-solution="e2e4,e7e5,Ng1f3"` (UCI)
- `data-solution="e4,e5,Nf3"` (SAN)

### Alternative Solution Paths

Separate multiple valid solution paths with the pipe character (`|`):

```html
data-solution="e2e4,e7e5,Nf3|e2e4,e7e5,Bc4"
```

This allows the puzzle to accept either `Nf3` OR `Bc4` as the third move. Perfect for tactical puzzles with multiple winning continuations!

## Advanced Features

### Premove System

The premove feature allows puzzles to start with an opponent's move being played automatically. This is perfect for Lichess puzzle imports where puzzles typically start after the opponent's last move.

**How it works:**
1. Set `data-premove-enabled="true"`
2. Include the opponent's move as the **first** move in the solution
3. The widget will automatically:
   - Play the first move with animation (500ms delay)
   - Flip the board to show the player's perspective
   - Wait for the player to make their move
4. When the puzzle is reset, the premove replays automatically

**Example:**
```html
<div class="chess-puzzle"
     data-fen="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1"
     data-solution="d2d4,f1e1,e5e4"
     data-premove-enabled="true"
     data-orientation="black">
     <!-- d2d4 plays automatically as white's move -->
     <!-- Board shows from black's perspective -->
     <!-- Player must respond with Re1 -->
</div>
```

**Benefits:**
- ✅ Matches Lichess puzzle experience exactly
- ✅ Clear visual feedback showing opponent's setup move
- ✅ Automatic board orientation for better UX
- ✅ Works seamlessly with reset functionality

### Internationalization

The widget supports multiple languages. Currently available:

- **English** (default): `data-lang="en"`
- **German**: `data-lang="de"`

All feedback messages, button labels, and status text will be displayed in the selected language. The system is extensible - additional languages can be added by extending the translation files.

### Stockfish AI Integration

When `data-stockfish-enabled="true"` is set, wrong moves trigger an AI analysis:

1. User makes an incorrect move
2. Widget shows "loading" indicator
3. Stockfish API analyzes the position (or retrieves from cache)
4. Best counter-move is displayed with:
   - **Animation**: Piece moves on the board
   - **Red Arrow**: Visual indicator showing the move direction
   - **Status Message**: Shows the move in UCI notation
5. After 2 seconds, both moves are undone
6. User can try again

**Caching**: Stockfish responses are cached in localStorage for 30 days, dramatically reducing API calls and improving performance. The cache is puzzle-specific and automatically manages storage quota.

**Configuration Tips**:
- **Depth 8-10**: Fast responses, good for beginners
- **Depth 12-15**: Balanced (default: 12)
- **Depth 16-20**: Strongest analysis, slower responses

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

## 🚀 GitHub Pages Deployment

Both the demo and builder are ready for GitHub Pages deployment!

### Demo Deployment

1. Go to **Settings → Pages** in your GitHub repository
2. Set source: **Deploy from a branch**
3. Select branch: **main** and folder: **/demo**
4. Your demo will be live at: `https://username.github.io/repo-name/`

[See demo deployment guide →](demo/README.md)

### Builder Deployment

1. First, build the builder: `npm run build:builder`
2. Go to **Settings → Pages** in your GitHub repository
3. Set source: **Deploy from a branch**
4. Select branch: **main** and folder: **/dist/builder**
5. Your builder will be live at: `https://username.github.io/repo-name/`

[See builder deployment guide →](builder/README.md)

**Note**:
- Demo deploys from `/demo` directory (production-ready by default)
- Builder deploys from `/dist/builder` directory (requires `npm run build:builder` first)
- You can deploy both by creating separate GitHub Pages sites or separate repositories

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