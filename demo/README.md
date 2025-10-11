# Chess Widget Demo

This directory contains the demo page for the Chess Widget, optimized for both local development and GitHub Pages deployment.

## 🌐 GitHub Pages Deployment

The demo is **ready for GitHub Pages** with zero configuration needed!

### What's Included:

- ✅ **index.html** - Demo page with all features showcased
- ✅ **chess-widget.min.js** - Standalone bundled JavaScript (all dependencies included)
- ✅ **chess-widget.min.css** - Complete styles (chessground + widget styles)
- ✅ **.nojekyll** - Tells GitHub Pages to serve files as-is

### How to Deploy:

1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Set source to: **Deploy from a branch**
4. Select branch: **main** (or your default branch)
5. Select folder: **/demo**
6. Click **Save**

Your demo will be live at: `https://yourusername.github.io/your-repo-name/`

## 🔧 Local Development

The demo has two modes:

### Production Mode (Current)
Uses the built files (`chess-widget.min.js` and `chess-widget.min.css`).

**To test:**
```bash
# Simply open in browser (no server needed!)
open index.html
```

### Development Mode (Vite)
Uses ES modules with live reload for development.

**To enable:**
1. Edit `index.html`:
   - Comment out lines 149 and 524 (production CSS/JS)
   - Uncomment line 527 (Vite module script)
2. Run dev server:
   ```bash
   cd ..
   npm run dev
   ```

## 📦 Updating Built Files

After making changes to the source code:

```bash
cd ..
npm run build
cp dist/chess-widget.min.* demo/
```

This copies the latest built files to the demo directory.

## ✨ Features Showcased

- **20+ Chess Puzzles** - Ranging from ELO 600 to 2400
- **Alternative Solutions** - Multiple valid solution paths
- **Internationalization** - English and German examples
- **Stockfish Integration** - AI counter-move feedback with arrows
- **Free Play Mode** - Board without puzzle constraints
- **Auto-Flip Board** - Automatic rotation based on turn
- **Responsive Design** - Mobile-friendly layout

## 🎯 Zero Dependencies

The demo works completely standalone:
- ❌ No CDN calls
- ❌ No internet connection required
- ❌ No build process needed for deployment
- ✅ All dependencies bundled
- ✅ All assets included

Perfect for offline demos, presentations, and GitHub Pages!
