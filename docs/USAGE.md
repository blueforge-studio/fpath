# Usage Guide

## Opening a Workspace

Click **Open** in the toolbar to pick a directory. The app remembers your last workspace and reopens it on launch. The **Recent…** dropdown lists up to 10 recent workspaces.

The chosen directory becomes the **workspace root**. Relative paths are computed against it.

## File Tree

The left pane shows a lazy-loaded tree:

- **Click a folder row** — expand or collapse. Children load on first expand via Tauri's `readDir`.
- **Click the checkbox** — toggle selection (does *not* expand).
- **Click a file row** — open it in a new viewer tab.
- **Shift+Click any row** — toggle selection only (never expands or opens).

Default ignore list (applied during walk):
`node_modules`, `.git`, `dist`, `.turbo`, `.next`, `target`, `__pycache__`, `.DS_Store`, `Thumbs.db`, `*.log`.

### Filter Toggles

Three buttons sit under the filter input. State is persisted across sessions.

| Toggle | Effect |
|--------|--------|
| **Hide .** | Hides any entry whose name starts with `.` (recursive — applies at every depth). |
| **Dirs only** | At the root level, hides files (only directories visible). Nested files unaffected. |
| **Repos only** | At the root level, shows only directories that contain a `.git/` subdirectory. Useful when your workspace is a parent of multiple cloned repos. |

### Filter Input

`Cmd+F` focuses the filter input. Typing switches the tree to flat mode showing matching files (substring match, case-insensitive, against name and relative path). Backed by the **workspace index** so it sees every file in the workspace, not only what you've expanded. Capped at 500 results.

## Multi-Select & Copy Paths

Use the row checkboxes to multi-select files. Then:

- **Enter** — copy **relative** paths (one per line) to the clipboard.
- **Shift+Enter** — copy **absolute** paths.
- **Reset** — toolbar button clears the selection.

A toast at the bottom of the window confirms what was copied (e.g. *"Copied 3 relative paths"*; for a single file, the path itself is shown).

## Quick File Search (`Cmd+P`)

A modal opens with a single input. Type any substring of a filename or relative path; up to 100 matches appear. Arrow keys navigate, **Enter** opens the highlighted file. **Esc** dismisses.

The placeholder text shows how many files have been indexed so far. The index walks the workspace in the background after every workspace change — for a folder containing many repos this typically takes a few seconds to several seconds.

## Text Content Search (`Cmd+Shift+F`)

A second modal runs a Rust-side recursive scan across files matching your selected extensions. Default extensions: `.ts`, `.tsx`, `.md` — toggle them via the checkboxes in the modal. The selection persists across sessions.

- Case-insensitive substring match against each line.
- Returns up to 500 matches with `path:line` and the matching line of source.
- Skips `node_modules`, `.git`, `target`, `dist`, `.turbo`, `.next`, `__pycache__`, `build`, `out`, `.vercel`, `.cache`.
- Arrow keys navigate, **Enter** opens the file (currently lands at the top — line jump is on the roadmap).
- Searches debounced 250ms after the last keystroke.

## Viewer (Monaco)

Files open as tabs in the right pane. The editor is read-only and dark-themed, with syntax highlighting for ~25 common languages. Files larger than 2 MB are truncated with a notice.

- Click a tab to switch.
- Click the **×** on a tab to close.
- Closing the last tab hides the viewer pane and the window snaps back to half-width.

### Splitter

The thin vertical bar between the tree and viewer is draggable — `cursor: col-resize`. Drag horizontally to change the tree/viewer width ratio. Width is clamped between 180px and 800px and persists across sessions.

## Window Behavior

- **Tree-only mode** (no tabs open): window collapses to about half its previous width and the tree fills the entire window.
- **Viewer mode** (one or more tabs): window expands to your last "wide" width.

Manual resizing while in viewer mode updates the saved wide width.

## Persisted Settings

Stored at `~/Library/Application Support/studio.blueforge.fpath/settings.json`:

| Key | What it remembers |
|-----|-------------------|
| `workspacePath` | The currently open workspace |
| `recentWorkspaces` | Last 10 workspaces opened |
| `filter.hideDotfiles` / `filter.rootDirsOnly` / `filter.repoOnly` | Filter toggle state |
| `layout.treeWidth` | Drag-set tree pane width |
| `window.expandedWidth` | Window width to restore when opening a tab |
| `textsearch.exts` | Selected extensions for Cmd+Shift+F |

Delete the file to reset to defaults.

## Troubleshooting

- **App icon shows a generic blue box in dev mode.** Expected — `pnpm tauri dev` runs the bare Cargo binary, which has no embedded icon. Bundled `.app` (via `pnpm tauri build`) shows the real icon.
- **"Repos only" hides everything for a moment.** The probe runs lazily after toggling on; entries appear as their `.git` checks complete.
- **QuickSearch only finds a few files right after launch.** The workspace index is still building. Watch the placeholder text — it shows the live count.
- **Filter toggle shortcuts don't fire while focus is in a textarea.** None exists in the app today, but the global Enter handler skips textareas to future-proof against accidental capture.
