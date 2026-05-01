# Mode B (Popup) — Design Spec

**Goal:** Add a Spotlight-style popup window to fpath for quick file path discovery during Claude Code sessions. Summoned via global hotkey or CLI, navigated by keyboard, copies file paths and auto-dismisses.

**Architecture:** Same Tauri app, two windows (labels: `"main"` and `"popup"`). `main.tsx` branches on `getCurrentWindow().label` to render `<DesktopApp />` or `<PopupApp />`. All existing Rust commands, bridge functions, hooks, and UI components are shared. Three new Tauri plugins: `global-shortcut`, `single-instance`, and `window` (or use Tauri core Window APIs).

**Tech Stack:** Same as existing — Tauri v2, React 19, TypeScript 5.9, Catppuccin CSS custom properties.

---

## User Experience

### Triggers
- **Global hotkey:** `Cmd+Shift+F` from anywhere summons the popup with the last-known workspace
- **CLI:** `fpath popup [path]` opens the popup. If `path` is given, it becomes the workspace. If omitted, uses `$PWD`.
- If the Tauri app is not running, either trigger launches it in popup-only mode (no main window)

### Window Behavior
- **Always-on-top**, frameless, centered on screen, ~420×520px
- **Hidden on blur** — clicking outside the popup or pressing Escape hides it (does not close, just hides)
- **Skip taskbar** — no dock/taskbar entry for the popup window
- **Re-shown on trigger** — hotkey or CLI shows the window again with the tree refreshed

### Interactions
| Key | Action |
|-----|--------|
| `↑↓` | Move focus between visible tree nodes |
| `→` | Expand focused directory |
| `←` | Collapse focused directory / move to parent |
| `Enter` | Copy focused file's **absolute** path → auto-dismiss |
| `Space` | Toggle checkbox on focused node |
| `Cmd+Enter` | Copy **all checked** paths (one per line) → auto-dismiss |
| `Cmd+K` | Toggle tree visibility (search-only mode) |
| `Cmd+F` | Focus search bar |
| `Esc` | Dismiss popup (hide window) |
| Click outside | Dismiss popup (window blur event) |

### Search
- Uses FileTree's built-in `.filetree-search` input (no separate search bar needed)
- The search input is auto-focused when the popup appears (via `document.querySelector('.filetree-search')?.focus()` in a `useEffect`)
- Typing filters the tree in real-time — flattens to matching files by name
- Clearing the search restores the tree view
- Identical behavior to the desktop FileTree filter

### Visual Design
- Same Catppuccin Mocha theme as Mode A
- FileTree fills the popup (its built-in search bar is at the top, auto-focused on show)
- Tree nodes show file-type icons, expand arrows, checkboxes, git status dots
- Compact footer below the tree: `⎇ {branch}` | `{N} files` | `{N} selected`
- No toolbar, no viewer, no status bar shortcuts

---

## Architecture

### Window Configuration (`tauri.conf.json`)

```json
{
  "windows": [
    { "label": "main", "title": "fpath", "width": 1200, "height": 800, ... },
    {
      "label": "popup",
      "title": "fpath",
      "width": 420,
      "height": 520,
      "alwaysOnTop": true,
      "decorations": false,
      "center": true,
      "visible": false,
      "focus": true,
      "skipTaskbar": true
    }
  ]
}
```

### Rust App State

```rust
struct AppState {
    last_workspace: Mutex<Option<String>>,
    popup_created: Mutex<bool>,
}
```

- `last_workspace` updated whenever `list_directory` or `list_all_files` is called with a workspace root
- `popup_created` tracks whether the popup window has been created (only create once, show/hide after)

### New Rust Command

```rust
#[tauri::command]
fn show_popup(state: State<AppState>, app: AppHandle, path: Option<String>) -> Result<(), String> {
    // Update last_workspace if path is provided
    // Get or create popup window via app.get_webview_window("popup")
    // Show + focus it
    // Emit event "popup-opened" with the workspace path
}
```

### Plugins Added
1. **`tauri-plugin-single-instance`** — catches CLI re-launch, routes `--popup <path>` to running instance
2. **`tauri-plugin-global-shortcut`** — registers `Cmd+Shift+F` to call `show_popup`
3. Window management via Tauri core `WebviewWindow` API (no plugin needed for show/hide/focus)

### Entry Point Branching (`main.tsx`)

```typescript
import { getCurrentWindow } from "@tauri-apps/api/window";
import DesktopApp from "./App";
import PopupApp from "./PopupApp";

const label = getCurrentWindow().label;
if (label === "popup") {
  root.render(<PopupApp />);
} else {
  root.render(<DesktopApp />);
}
```

`App.tsx` default export is renamed for clarity (no behavior change).

---

## Components

### `PopupApp.tsx` (new)

Self-contained React component for the popup window.

**State:**
- `workspacePath: string | null`
- `fileTree: FileEntry[]`
- `selectedFiles: Set<string>`
- `focusedPath: string | null`

**Hooks used:**
- `useState` for workspace, tree, selection, focus
- `useGitStatus(workspacePath)` — 5-second polling (shared)
- `useFileWatcher(workspacePath, refresh)` — fs watcher (shared)
- `useEffect` — loads workspace on mount via Tauri event `popup-opened`

**On mount:**
1. Listen for Tauri event `"popup-opened"` carrying the workspace path
2. Load root directory via `listDirectory`
3. Focus the search input

**On blur:**
- `useEffect` with `getCurrentWindow().onFocusChanged()` — hide on blur

**Rendered elements:**
```jsx
<div className="popup-app">
  <div className="popup-tree">
    <FileTree 
      nodes={fileTree}
      selectedFiles={selectedFiles}
      onSelectionChange={setSelectedFiles}
      onFileOpen={handleFileOpen}  // copies path + dismisses
      onDirectoryToggle={handleToggleDirectory}
      activeFile={null}
      gitStatusMap={gitStatusMap}
    />
  </div>
  <div className="popup-footer">
    <span>⎇ {branch}</span>
    <span>{fileCount} files</span>
    {selectedCount > 0 && <span>{selectedCount} selected</span>}
  </div>
</div>
```

Auto-focus FileTree's search on mount:
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    document.querySelector<HTMLInputElement>('.filetree-search')?.focus();
  }, 100);
  return () => clearTimeout(timer);
}, []);
```

**Key handlers:**
- `handleFileOpen` — copies absolute path via clipboard bridge, then `getCurrentWindow().hide()`
- `handleCopyAll` — joins all checked paths with newline, copies, hides
- Escape — `getCurrentWindow().hide()`
- Cmd+Enter — calls `handleCopyAll`

### FileTree (reused, no changes)

The existing `FileTree.tsx` component is used as-is. It already supports all needed props: `gitStatusMap`, `focusedPath` (for keyboard nav), checkbox selection, icons, search filtering. The popup's FileTree is used in its default tree mode (no `filter` prop on the FileTree component itself — search filtering is handled by the popup's own search bar).

### hooks/useWorkspace.ts (minor tweak)

If the hook doesn't already expose a way to set workspace externally (i.e., from a Tauri event), add that. The popup gets its workspace path from the `popup-opened` event rather than user file dialog.

---

## Data Flow

```
CLI / Hotkey
  → Rust show_popup command
    → Creates or reveals popup window
    → Emits "popup-opened" event with workspace path
      → PopupApp receives event
        → Sets workspacePath state
        → useGitStatus starts polling
        → useFileWatcher starts watching
        → FileTree renders
```

User navigates → Enter on file → `handleFileOpen`:
```
1. import { writeText } from clipboard bridge
2. writeText(file.path)
3. getCurrentWindow().hide()
```

---

## CLI Script

`fpath` shell script (installed to a directory on PATH):

```bash
#!/bin/bash
APP="fpath"
WORKSPACE="${1:-$PWD}"

if pgrep -q "$APP"; then
  # App is running — trigger via single-instance
  open -a "$APP" --args --popup "$WORKSPACE"
else
  # Launch fresh in popup-only mode
  open -a "$APP" --args --popup "$WORKSPACE"
fi
```

Single-instance plugin forwards `--popup <workspace>` to the running instance. On first launch with `--popup`, the app opens only the popup window (not main).

---

## Files Summary

| File | Action |
|------|--------|
| `apps/desktop/src-tauri/tauri.conf.json` | Modify — add popup window definition |
| `apps/desktop/src-tauri/Cargo.toml` | Modify — add 2 plugins (single-instance, global-shortcut) |
| `apps/desktop/src-tauri/src/lib.rs` | Modify — add AppState, show_popup command |
| `apps/desktop/src-tauri/src/main.rs` | Modify — set up single-instance + global-shortcut |
| `apps/desktop/src-tauri/capabilities/default.json` | Modify — add new permissions |
| `apps/desktop/src/main.tsx` | Modify — branch on window label |
| `apps/desktop/src/App.tsx` | Modify — rename default export to `DesktopApp` |
| `apps/desktop/src/PopupApp.tsx` | **Create** — popup component |
| `apps/desktop/src/PopupApp.css` | **Create** — popup-specific styles |
| `apps/desktop/src/index.css` | Modify — add popup-related styles |
| `scripts/fpath.sh` | **Create** — CLI wrapper script |

---

## Testing

- **Typecheck:** `pnpm typecheck` — must pass
- **Rust build:** `cargo build` — must pass
- **Existing tests:** `cargo test` + `pnpm test` — must pass
- **Manual verification:** Popup opens via hotkey, keyboard nav works, Enter copies path and dismisses, Escape dismisses, Cmd+Enter copies all checked, blur dismisses, CLI trigger works
