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

## Settings (⚙ in the toolbar)

A modal that exposes two configurations:

### Custom ignore patterns

Free-form text area; one pattern per line, .gitignore syntax. Applied **on top of** the built-in defaults (`node_modules`, `.git`, `dist`, `.turbo`, `.next`, `target`, `__pycache__`, `.DS_Store`, `Thumbs.db`, `*.log`).

Affects the file tree, the workspace index (Cmd+P, filter input), and Popup mode. Click **Apply ignore patterns** to commit; the index re-walks immediately. Note: Cmd+Shift+F text search uses a separate Rust-side ignore list and is not yet affected by custom patterns.

### Text search extensions

The list of file extensions that appear as toggle checkboxes in the Cmd+Shift+F modal. Default: `ts`, `tsx`, `md`. Add or remove freely. Removing an extension from this list also unticks it from any persisted text-search selection.

## Updates

Settings → **Updates** section.

- Shows the current version (read from the Tauri bundle).
- **Check for updates** queries the GitHub Releases endpoint configured in `tauri.conf.json` for a `latest.json` describing the newest signed build.
- If an update is available, click **Download & install** — the updater downloads the signed package, verifies the signature against the embedded public key, replaces the app in place, and the app relaunches into the new version.
- Errors (no network, no release published yet, etc.) are shown inline and the button becomes **Retry**.

## Popup mode (`Cmd+Option+Space`)

A frameless, always-on-top overlay window for **fast file-path lookup from anywhere on the OS** — including from outside the app. The shortcut toggles it: press once to show + focus, again to hide. `Esc` also hides.

- The popup uses the same workspace as the main window (read from persisted settings).
- Type to fuzzy-search by filename or relative path.
- Arrow keys navigate; the highlighted result is the active one.
- `Enter` copies the **relative** path to the clipboard and hides the popup.
- `Shift+Enter` copies the **absolute** path.

The first time you open the popup after launch it builds its own copy of the workspace index in the background. Subsequent activations are instant.

## Releases & signing

The auto-updater requires signed builds. The repo ships a public key in `apps/desktop/src-tauri/tauri.conf.json` that matches a private key stored at `apps/desktop/.keys/fpath_updater.key` (gitignored).

To produce a signed release:

```bash
cd apps/desktop
TAURI_SIGNING_PRIVATE_KEY=$(cat .keys/fpath_updater.key) \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
pnpm tauri build
```

Tauri produces:

- The platform installer (`.dmg`, `.msi`, `.deb`)
- A signed updater bundle alongside it (`.app.tar.gz` + `.app.tar.gz.sig` on macOS)

Upload **both** the installer and the `.sig` to the GitHub Release, plus a `latest.json` of the form:

```json
{
  "version": "0.1.0",
  "notes": "Release notes here",
  "pub_date": "2026-05-04T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "...contents of .sig file...",
      "url": "https://github.com/blueforge-studio/fpath/releases/download/v0.1.0/fpath_0.1.0_aarch64.app.tar.gz"
    }
  }
}
```

To rotate keys (if the private key leaks), regenerate with `pnpm tauri signer generate` and update both `tauri.conf.json` and any local key files; users on the old key will need to install the new version manually.
