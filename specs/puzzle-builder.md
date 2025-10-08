# What the Puzzle Builder should do (scope & expectations)

1. **Board editor**

   * Drag-and-drop piece palette onto an empty board.
   * Toggle side to move, castling rights, en-passant square, half-move/full-move counters.
   * Live FEN preview (valid/invalid).
   * Buttons: “Empty”, “Start Position”, “Flip”.

2. **Solution editor**

   * From the editor position, play a *linear* move sequence on the board to build the solution.
   * Show a move list (SAN + UCI) with controls to insert, delete, or edit ply.
   * Validate each move for legality from the current state.
   * Allow auto-responses (engine/opponent) by simply adding the next ply in the same list (no engine required).

3. **Metadata (optional but useful)**

   * Title, description, tags, difficulty, thematic motifs, expected result (mate in N, win material, etc.).

4. **Preview**

   * Render your existing **ChessWidget** live in a side panel using the current FEN/solution so authors see exactly what players will see (including autoFlip behavior).

5. **Export**

   * One-click export to:

     * **HTML snippet** your widget accepts:

       ```html
       <div class="chess-puzzle"
            data-fen="…FEN…"
            data-solution="e2e4,e7e5,N g1f3, …"
            data-width="400"
            data-theme="blue"
            data-auto-flip="true"></div>
       ```
     * **JSON** (for storage/pipelines) with FEN, solution (UCI + SAN per ply), metadata.
   * “Copy to clipboard” + “Download .json”.

6. **Persistence**

   * Auto-save drafts to `localStorage` + “Load/Save As…” for local files.
   * (Optional) Import PGN → choose a position (via a ply slider) and/or convert a mainline into the solution list.

7. **Validation & quality checks**

   * Ensure solution is legal from the starting FEN.
   * Ensure side to move in FEN matches first move color.
   * Detect termination (e.g., ends in checkmate or winning material—optional).
   * Warn if castling rights don’t match piece placement.

---

# Implementation steps (milestones)

## 1) Scaffold the Builder page

* **Layout**: two columns (editor on the left, preview/export on the right).
* **Libraries**: reuse your bundled `chess.js` and `Chessground`.
* **State**: a simple store (plain JS object) holding:

  ```js
  {
    fen: string,
    chess: new Chess(fen),
    solution: [ { uci:'e2e4', san:'e4' }, ... ],
    meta: { title:'', tags:[], difficulty:'', theme:'blue', autoFlip:true }
  }
  ```

## 2) Board editor

* **Piece palette**: small row of white/black pieces (KQRRBBNNPP / same in black).
* **Place/remove**:

  * Click a palette piece → next click on a square places it (replace existing).
  * Right-click a square removes a piece.
* **Sync**:

  * After each change, rebuild FEN:

    * Use `Chess#load(fen)` to validate.
    * If valid → update state, refresh Chessground with `{fen}`.
* **Side to move & rights**:

  * Controls: side (w/b), castling (KQkq checkboxes), en passant (square input with validation), halfmove/fullmove numbers.
  * Recompute FEN string from board + these fields.

> Tip: keep a tiny helper to compose/decompose FEN:

```js
function composeFEN(boardArray, turn, castling, ep, half, full) { /* … */ }
function decomposeFEN(fen) { /* … */ }
```

## 3) Solution editor

* **Recording**:

  * “Start Recording” locks the position and side to move; every legal move played on the same `Chess` instance:

    * `const m = chess.move({from,to,promotion})`
    * Push `{ uci: from+to+(promotion||''), san: m.san }` to `solution`.
  * Show a list with index, SAN, UCI. Provide:

    * Delete ply, insert after index (by stepping the `Chess` state to that ply then accepting one move), and “truncate from here”.
* **Editing**:

  * Clicking a ply rewinds the internal `Chess` to that ply (replay from start FEN) to allow inserting/replacing.
* **Constraints**: keep it *linear* (no branches) for v1—matches your widget now.

## 4) Live preview (your existing widget)

* In a `<div class="chess-puzzle" …>` bind:

  * `data-fen` ← current FEN
  * `data-solution` ← `solution.map(s=>s.uci).join(',')`
  * `data-auto-flip` / `data-theme` / `data-width`
* After updates, re-init the preview:

  * Destroy previous preview instance if needed, or re-render by clearing the container then calling `ChessWidget.init()`.

## 5) Exporters

* **HTML exporter**:

  ```js
  function buildHtmlSnippet({fen, solution, width=400, theme='blue', autoFlip=true}) {
    const csv = solution.map(s=>s.uci).join(',');
    return `<div class="chess-puzzle" data-fen="${fen}" data-solution="${csv}" data-width="${width}" data-theme="${theme}" data-auto-flip="${autoFlip}"></div>`;
  }
  ```
* **JSON exporter**:

  ```js
  {
    version: 1,
    fen, 
    solution: state.solution, // {uci, san}[]
    meta: state.meta
  }
  ```
* Clipboard + file download (Blob / `navigator.clipboard.writeText`).

## 6) Validation & UX feedback

* **During recording**: if a user attempts an illegal move, show a toast “Illegal from current position”.
* **On export**:

  * Check: `new Chess(fen)`; replay every `uci` → if any `move` returns `null`, block export with the failing ply index.
  * Check color alignment: `(fenTurn === 'w' && firstMove is white)` etc.
  * Optional: detect mate/stalemate at end (`chess.isCheckmate()`, `isStalemate()`).

## 7) Persistence

* Auto-save state to `localStorage` on every change (`debounce` 300ms).
* “New puzzle”, “Open”, “Save As .json”, “Import .json”.
* Optional PGN import:

  * Parse via `chess.loadPgn(pgn)`, expose a ply slider to pick the FEN at any ply; optionally convert the remaining mainline into the solution list.

---

# Minimal UI map (components)

* **Header**: Title, tags, difficulty.
* **Left panel**

  * Board (Chessground in *setup mode*—no move legality, just placements when palette active).
  * Palette (white/black pieces), trash, “Start pos”, “Empty”, “Flip”.
  * FEN line (readonly + “Copy”).
  * Turn toggle, castling checkboxes, EP square, half/full move inputs.
* **Right panel**

  * **Preview** (your ChessWidget).
  * **Solution list** (table):

    * `# | SAN | UCI | ⟲ Rewind | ＋ Insert | ✖ Delete`
  * **Controls**: Start/Stop recording, Clear solution.
  * **Export**: “Copy HTML”, “Download JSON”.
  * **Settings**: width, theme, autoFlip.

---

# Integration details with your current widget

* Your widget already supports:

  * `data-fen` (string FEN)
  * `data-solution` (CSV; *either* SAN or UCI tokens). For reliability, export UCI.
  * `data-auto-flip`, `data-width`, `data-theme`
* Your move checker accepts equality on either:

  * `move.from + move.to + (promotion || '')` **(UCI)**
  * `move.san` **(SAN)**
* Auto responses are just the *next* token in the sequence; your widget already plays them via `playAutomaticMove`. The builder doesn’t need “side” metadata beyond the FEN turn; just ensure the first ply color matches `fen`’s side to move.

---

# Key utilities you’ll write (pseudocode)

```js
// Board editing vs recording mode
let mode = 'edit' // or 'record'

// When in edit mode and a palette piece is active:
function placePiece(square, role, color) {
  // update internal board array then compose FEN and refresh Chessground
}

// When in record mode:
function onUserMove(orig, dest, promotion) {
  const m = state.chess.move({from:orig, to:dest, promotion})
  if (!m) return toast('Illegal move');
  state.solution.push({ uci: orig+dest+(promotion||''), san: m.san });
  refreshSolutionList();
  refreshPreview();
}
```

---

# Acceptance checklist (done when…)

* [ ] From an empty board, I can place pieces, set side/rights, and get a green “Valid FEN”.
* [ ] Hitting “Start Recording” lets me input a legal sequence and see SAN/UCIs appear.
* [ ] The **Preview** behaves exactly like the final embedded widget (incl. auto-responses).
* [ ] Exported HTML snippet dropped into any page runs correctly with your current bundle.
* [ ] Importing the same JSON/HTML reproduces the identical puzzle.

---

# Future nice-to-haves (v2)

* Branching lines & hints.
* Mate-in-N guardrails (stop recording once mate achieved).
* Engine eval (Stockfish WASM) to suggest refutations for wrong moves.
* Batch export; gallery view; difficulty auto-grading.

