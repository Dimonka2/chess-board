# Repository Guidelines

## Project Structure & Module Organization
- `src/` — Source files: `chess-widget.js` (logic) and `chess-widget.css` (styles).
- `dist/` — Built artifacts (`chess-widget.min.js`, `.min.css`). Do not edit by hand.
- `demo/` — Vite dev site (`index.html`, `dev.html`, `main.js`) for local testing.
- `specs/` — Planning docs; no automated tests yet.

## Build, Test, and Development Commands
- `npm install` — Install dependencies.
- `npm run dev` — Start Vite on `demo/` with live reload at `http://localhost:3001`.
- `npm run build` — Run `build.js` to bundle JS/CSS into `dist/` (offline, self‑contained).
- `npm run dev:prod` — Build first, then serve `demo/` to test production bundles.

## Coding Style & Naming Conventions
- JavaScript: ES2015+, 2‑space indentation, semicolons, prefer single quotes.
- Naming: Classes `PascalCase` (e.g., `ChessWidget`); functions/vars `camelCase`.
- Files: kebab‑case (`chess-widget.js`, `chess-widget.css`). Keep widget exported on `window.ChessWidget`.
- No linter configured; match existing style in `src/`. Keep changes minimal and focused.

## Testing Guidelines
- Manual: Use `npm run dev` and the pages under `demo/` to exercise puzzles, free play, and auto‑flip.
- If adding tests, place them under `tests/` with `*.spec.js` and prefer integration-level checks (DOM + move validation). Keep CI optional.

## Move Notation
- Supports UCI (e.g., `e2e4`, `g1f3`) and SAN (e.g., `Nf3`, `Qh5`).
- Provide solutions via `data-solution` as a comma‑separated list.
  - UCI example: `data-solution="e2e4,e7e5,Ng1f3"`
  - SAN example: `data-solution="e4,e5,Nf3"`

## Commit & Pull Request Guidelines
- Commits: Imperative mood, concise scope (e.g., "build: bundle css", "feat: add autoFlip").
- PRs: Include summary, before/after notes or screenshots, reproduction steps (URL/HTML), and reference issues. Update `README.md` and `demo/` when behavior changes.

## Security & Configuration Tips
- Environment: Node.js 18+ (Vite 5 requirement). No CDN calls in production; bundles must remain self‑contained.
- Build script note: `build.js` relies on chessground’s minified symbols (`Nr`, `Et`) for globals. After upgrading `chessground`, verify these names or adjust wrappers.
- Do not import from networked URLs; all assets should come from `node_modules/` or `src/` and be written to `dist/` via the build.

## Architecture Overview
- The widget auto‑initializes on `.chess-puzzle` elements, reads `data-*` attributes (e.g., `data-fen`, `data-solution`, `data-width`, `data-auto-flip`), and uses chess.js + chessground to render and validate moves.
