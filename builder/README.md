# Chess Puzzle Builder (Development)

This directory contains the **development version** of the Chess Puzzle Builder.

## 🔧 Development Mode

To work on the builder:

```bash
cd ..
npm run dev:builder   # Starts Vite dev server
```

The dev server provides:
- 🔥 Live reload
- 📦 ES module support
- 🐛 Source maps for debugging

## 📦 Production Build

The production-ready builder is built to `../dist/builder/`:

```bash
cd ..
npm run build:builder
```

This creates a complete standalone version in `dist/builder/` with:
- ✅ index.html
- ✅ builder-bundle.js (all modules combined)
- ✅ builder.css
- ✅ chess-widget.min.js
- ✅ chess-widget.min.css
- ✅ .nojekyll (for GitHub Pages)

## 🚀 GitHub Pages Deployment

Deploy the production build (`dist/builder/`) to GitHub Pages:

1. Build: `npm run build:builder`
2. Go to **Settings → Pages**
3. Select branch: **main** and folder: **/dist/builder**

## 📁 Directory Structure

```
builder/                    # Development files
├── index.html             # Dev HTML (uses ES modules)
├── builder.js             # Main entry point
├── builder.css            # Styles
├── modules/               # ES modules
│   ├── state.js
│   ├── board-editor.js
│   ├── solution-editor.js
│   └── ...
└── README.md              # This file

dist/builder/              # Production build (created by npm run build:builder)
├── index.html             # Production HTML
├── builder-bundle.js      # All modules bundled
├── builder.css            # Styles
├── chess-widget.min.js    # Widget library
├── chess-widget.min.css   # Widget styles
└── .nojekyll              # GitHub Pages config
```

## ✨ Features

- **🎨 Visual Board Editor** - Drag-and-drop piece placement
- **🎯 Solution Recording** - Record moves by playing them
- **♟️ Lichess Import** - Import puzzles by ID or URL
- **🎭 Premove Support** - Configure opponent's setup move
- **📋 Live Preview** - See puzzle exactly as it will appear
- **💾 Auto-Save** - localStorage auto-save
- **📤 Export** - HTML snippet or JSON download
