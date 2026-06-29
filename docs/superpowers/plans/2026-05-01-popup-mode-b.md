# Mode B (Popup) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Spotlight-style popup window to fpath — same Tauri app, two windows. Summoned via Cmd+Shift+F or CLI, keyboard-navigable, copies file paths and auto-dismisses.

**Architecture:** Same Tauri v2 app with a second window labeled `"popup"`. All existing Rust commands, bridge functions, hooks, and components are shared. `main.tsx` branches on `getCurrentWindow().label` to render either `<DesktopApp />` (existing `App.tsx`) or `<PopupApp />` (new). Three new Tauri plugins: `tauri-plugin-single-instance`, `tauri-plugin-global-shortcut`. Window management via Tauri core `WebviewWindow` API.

**Tech Stack:** Tauri v2, React 19, TypeScript 5.9, Catppuccin CSS custom properties.

---

### Task 1: Rust Backend — Plugins, App State, and show_popup Command

**Files:**
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `apps/desktop/src-tauri/capabilities/default.json`
- Modify: `apps/desktop/src-tauri/src/lib.rs`
- Modify: `apps/desktop/src-tauri/src/main.rs`

- [ ] **Step 1: Add Rust plugin dependencies**

In `apps/desktop/src-tauri/Cargo.toml`, add after `tauri-plugin-clipboard-manager = "2"`:

```toml
tauri-plugin-single-instance = "2"
tauri-plugin-global-shortcut = "2"
```

- [ ] **Step 2: Add popup window to tauri.conf.json**

In `apps/desktop/src-tauri/tauri.conf.json`, change the `windows` array to include the popup:

```json
"windows": [
  {
    "label": "main",
    "title": "fpath",
    "width": 1200,
    "height": 800,
    "minWidth": 600,
    "minHeight": 400
  },
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
```

And update the plugins section to add global-shortcut config (single-instance needs no JSON config):

```json
"plugins": {
  "fs": {
    "scope": {
      "allow": ["**"]
    }
  },
  "dialog": {
    "all": true
  },
  "clipboard-manager": {
    "all": true
  },
  "global-shortcut": {
    "shortcuts": []
  }
}
```

- [ ] **Step 3: Update capabilities for popup window**

In `apps/desktop/src-tauri/capabilities/default.json`, add `"popup"` to the `windows` array:

```json
{
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main", "popup"],
  "permissions": [
    "core:default",
    "dialog:default",
    "dialog:allow-open",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-read-dir",
    "fs:allow-exists",
    "fs:allow-watch",
    "store:default",
    "clipboard-manager:default",
    "clipboard-manager:allow-write-text"
  ]
}
```

- [ ] **Step 4: Add AppState and show_popup command to lib.rs**

In `apps/desktop/src-tauri/src/lib.rs`, add `use std::sync::Mutex;` to the top imports.

Add after the existing `use` statements:

```rust
use std::sync::Mutex;
use tauri::{Manager, Emitter};
```

Add the `AppState` struct and `show_popup` command before the `run()` function:

```rust
struct AppState {
    last_workspace: Mutex<Option<String>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            last_workspace: Mutex::new(None),
        }
    }
}

#[tauri::command]
fn show_popup(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
    path: Option<String>,
) -> Result<(), String> {
    if let Some(ref p) = path {
        *state.last_workspace.lock().unwrap() = Some(p.clone());
    }

    let workspace = path.or_else(|| state.last_workspace.lock().unwrap().clone());

    match app.get_webview_window("popup") {
        Some(popup) => {
            popup.show().map_err(|e| e.to_string())?;
            popup.set_focus().map_err(|e| e.to_string())?;
            popup.emit("popup-opened", workspace).map_err(|e| e.to_string())?;
        }
        None => {
            return Err("Popup window not found — check tauri.conf.json".to_string());
        }
    }

    Ok(())
}
```

- [ ] **Step 5: Update list_directory and list_all_files to track workspace**

In `lib.rs`, update the signature of `list_directory` to accept `State`:

```rust
#[tauri::command]
fn list_directory(state: tauri::State<'_, AppState>, dir_path: &str, workspace_root: &str) -> Result<Vec<FileEntry>, String> {
    *state.last_workspace.lock().unwrap() = Some(workspace_root.to_string());
    // ... rest of function body unchanged ...
```

Update `list_all_files` similarly:

```rust
#[tauri::command]
fn list_all_files(state: tauri::State<'_, AppState>, workspace_root: &str) -> Result<Vec<FileEntry>, String> {
    *state.last_workspace.lock().unwrap() = Some(workspace_root.to_string());
    // ... rest of function body unchanged ...
```

- [ ] **Step 6: Register show_popup in invoke_handler and manage AppState in run()**

In the `run()` function, add `.manage(AppState::default())` before `.invoke_handler(...)`, and add `show_popup` to the handler:

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            list_directory,
            read_file,
            file_exists,
            list_all_files,
            read_search_ignore,
            write_search_ignore,
            reveal_in_finder,
            open_in_default_app,
            get_git_info,
            show_popup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running fpath");
}
```

- [ ] **Step 7: Register single-instance and global-shortcut plugins in main.rs**

Replace the contents of `apps/desktop/src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    fpath_desktop_lib::run()
}
```

Wait — plugins need to be registered on the `Builder`, and `run()` is in `lib.rs`. Move the plugin registration into `lib.rs::run()` instead.

Replace the `run()` function in `lib.rs`:

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            use tauri::{Manager, Emitter};
            let popup_idx = argv.iter().position(|a| a == "--popup");
            let path: Option<String> = if let Some(idx) = popup_idx {
                argv.get(idx + 1).cloned().or_else(|| Some(cwd.clone()))
            } else if argv.len() == 1 && !argv[0].starts_with('-') {
                // fpath popup /some/path  → argv[0] = "/some/path"
                Some(argv[0].clone())
            } else {
                None
            };

            // Distinguish: if argv contains "--popup", open popup. Otherwise open main.
            let has_popup_flag = popup_idx.is_some() || !argv.is_empty();
            if has_popup_flag {
                if let Some(state) = app.try_state::<AppState>() {
                    if let Some(ref p) = path {
                        *state.last_workspace.lock().unwrap() = Some(p.clone());
                    }
                    let workspace = path.or_else(|| state.last_workspace.lock().unwrap().clone());
                    drop(state);

                    if let Some(popup) = app.get_webview_window("popup") {
                        let _ = popup.show();
                        let _ = popup.set_focus();
                        let _ = popup.emit("popup-opened", workspace);
                    }
                }
            } else {
                // No popup flag — show main window
                if let Some(main) = app.get_webview_window("main") {
                    let _ = main.show();
                    let _ = main.set_focus();
                }
            }
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, _event| {
                if shortcut.matches("CmdOrCtrl+Shift+F") {
                    use tauri::{Manager, Emitter};
                    let workspace = app.try_state::<AppState>()
                        .and_then(|s| s.last_workspace.lock().unwrap().clone());
                    if let Some(popup) = app.get_webview_window("popup") {
                        let _ = popup.show();
                        let _ = popup.set_focus();
                        let _ = popup.emit("popup-opened", workspace);
                    }
                }
            })
            .build())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            list_directory,
            read_file,
            file_exists,
            list_all_files,
            read_search_ignore,
            write_search_ignore,
            reveal_in_finder,
            open_in_default_app,
            get_git_info,
            show_popup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running fpath");
}
```

- [ ] **Step 8: Build and test Rust**

Run: `cargo build --manifest-path apps/desktop/src-tauri/Cargo.toml 2>&1`
Expected: Build succeeds.

Run: `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml 2>&1`
Expected: 2 tests pass.

- [ ] **Step 9: Commit**

```bash
git add apps/desktop/src-tauri/Cargo.toml apps/desktop/src-tauri/tauri.conf.json apps/desktop/src-tauri/capabilities/default.json apps/desktop/src-tauri/src/lib.rs apps/desktop/src-tauri/src/main.rs
git commit -m "feat: add popup window config, AppState, and show_popup Rust command"
```

---

### Task 2: Frontend Entry Point — Window Label Branching

**Files:**
- Modify: `apps/desktop/src/main.tsx`
- Modify: `apps/desktop/src/App.tsx`

- [ ] **Step 1: Update main.tsx to branch on window label**

Replace `apps/desktop/src/main.tsx`:

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import DesktopApp from "./App";
import PopupApp from "./PopupApp";
import "./index.css";

(async () => {
  const label = getCurrentWindow().label;

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      {label === "popup" ? <PopupApp /> : <DesktopApp />}
    </React.StrictMode>
  );
})();
```

- [ ] **Step 2: Rename App.tsx default export to DesktopApp**

In `apps/desktop/src/App.tsx`, change the default export from an anonymous function to a named export:

```typescript
// Change: export default function App() {
// To:
export default function DesktopApp() {
```

No other changes to `App.tsx` — it remains the full Mode A desktop app.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @fpath/desktop typecheck 2>&1`
Expected: No errors (PopupApp.tsx doesn't exist yet — this will fail. Skip typecheck for now, just verify App.tsx and main.tsx have no syntax errors by checking they import correctly).

Actually: the import of `./PopupApp` in main.tsx will fail until we create it. So typecheck will fail at this step. That's expected — proceed to Task 3.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/main.tsx apps/desktop/src/App.tsx
git commit -m "feat: branch main.tsx on window label, rename App to DesktopApp"
```

---

### Task 3: PopupApp Component

**Files:**
- Create: `apps/desktop/src/PopupApp.tsx`

- [ ] **Step 1: Create PopupApp.tsx**

Create `apps/desktop/src/PopupApp.tsx`:

```typescript
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import FileTree from "./components/FileTree";
import { useGitStatus } from "./hooks/useGitStatus";
import { useFileWatcher } from "./hooks/useFileWatcher";
import { listDirectory, readSearchIgnore } from "./bridge";
import { loadSearchIgnore, updateNodeChildren } from "@fpath/shared";
import type { FileEntry } from "@fpath/shared";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

export default function PopupApp() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const focusedPathRef = useRef<string | null>(null);

  const loadWorkspace = useCallback(async (wsPath: string) => {
    setWorkspacePath(wsPath);
    try {
      const root = await listDirectory(wsPath, wsPath);
      const ignoreContent = await readSearchIgnore(wsPath);
      if (ignoreContent) {
        loadSearchIgnore(ignoreContent);
      }
      setFileTree(root);
    } catch (e) {
      console.error("Failed to load popup workspace:", e);
      setFileTree([]);
    }
  }, []);

  // Listen for popup-opened event from Rust
  useEffect(() => {
    const unlisten = listen<string | null>("popup-opened", (event) => {
      const path = event.payload;
      if (path) {
        loadWorkspace(path);
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [loadWorkspace]);

  // Auto-focus FileTree search input when tree loads
  useEffect(() => {
    if (fileTree.length > 0) {
      const timer = setTimeout(() => {
        document.querySelector<HTMLInputElement>(".filetree-search")?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fileTree]);

  // Hide on blur
  useEffect(() => {
    const window = getCurrentWindow();
    const unlisten = window.onFocusChanged(({ payload: focused }) => {
      if (!focused) {
        window.hide();
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  // Global key handlers for copy-all and dismiss
  useEffect(() => {
    const handleKey = async (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd+Enter: copy all checked paths
      if (mod && e.key === "Enter") {
        e.preventDefault();
        if (selectedFiles.size > 0) {
          const paths = Array.from(selectedFiles).join("\n");
          try {
            const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
            await writeText(paths);
          } catch {
            await navigator.clipboard.writeText(paths);
          }
          getCurrentWindow().hide();
        }
        return;
      }

      // Escape: dismiss
      if (e.key === "Escape") {
        e.preventDefault();
        getCurrentWindow().hide();
        return;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedFiles]);

  const handleToggleDirectory = useCallback(
    async (path: string) => {
      if (!workspacePath) return;
      try {
        const children = await listDirectory(path, workspacePath);
        setFileTree((prev) => updateNodeChildren(prev, path, children));
      } catch (e) {
        console.error("Failed to load directory:", e);
      }
    },
    [workspacePath]
  );

  const handleFileOpen = useCallback(
    async (file: FileEntry) => {
      try {
        const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
        await writeText(file.path);
      } catch {
        await navigator.clipboard.writeText(file.path);
      }
      getCurrentWindow().hide();
    },
    []
  );

  const refreshWorkspace = useCallback(async () => {
    if (!workspacePath) return;
    try {
      const root = await listDirectory(workspacePath, workspacePath);
      setFileTree(root);
    } catch (e) {
      console.error("Failed to refresh popup workspace:", e);
    }
  }, [workspacePath]);

  useFileWatcher({ workspacePath, onChange: refreshWorkspace, debounceMs: 300 });

  const gitInfo = useGitStatus(workspacePath);

  const gitStatusMap = useMemo(() => {
    if (!gitInfo) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const s of gitInfo.statuses) {
      map.set(s.path, s.status);
      map.set(s.relativePath, s.status);
    }
    return map;
  }, [gitInfo]);

  const fileCount = useMemo(() => {
    let count = 0;
    const walk = (nodes: FileEntry[]) => {
      for (const n of nodes) {
        count++;
        if (n.kind === "directory" && n.children) walk(n.children);
      }
    };
    walk(fileTree);
    return count;
  }, [fileTree]);

  return (
    <div className="popup-app">
      <div className="popup-tree">
        {workspacePath ? (
          <FileTree
            nodes={fileTree}
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
            onFileOpen={handleFileOpen}
            onDirectoryToggle={handleToggleDirectory}
            activeFile={null}
            gitStatusMap={gitStatusMap}
          />
        ) : (
          <div className="popup-placeholder">
            <span>No workspace</span>
          </div>
        )}
      </div>
      <div className="popup-footer">
        <span className="popup-footer-item">
          {gitInfo?.branch ? `⎇ ${gitInfo.branch}` : "---"}
        </span>
        <span className="popup-footer-item">{fileCount} files</span>
        {selectedFiles.size > 0 && (
          <span className="popup-footer-item popup-footer-selected">
            {selectedFiles.size} selected
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/PopupApp.tsx
git commit -m "feat: add PopupApp component with auto-dismiss, clipboard copy, and event-driven workspace"
```

---

### Task 4: Popup CSS

**Files:**
- Modify: `apps/desktop/src/index.css`

- [ ] **Step 1: Add popup styles to index.css**

Append to `apps/desktop/src/index.css`:

```css
/* Popup */
.popup-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.popup-tree {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.popup-tree .filetree {
  width: 100%;
  border-right: none;
}

.popup-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 13px;
}

.popup-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 10px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
  min-height: 22px;
  flex-shrink: 0;
}

.popup-footer-item {
  font-family: var(--font-mono);
}

.popup-footer-selected {
  color: var(--accent);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/index.css
git commit -m "feat: add popup window styles"
```

---

### Task 5: CLI Wrapper Script

**Files:**
- Create: `scripts/fpath`

- [ ] **Step 1: Create the fpath CLI script**

Create `scripts/fpath`:

```bash
#!/bin/bash
set -euo pipefail

APP_NAME="fpath"
WORKSPACE="${1:-$PWD}"

# Resolve to absolute path
WORKSPACE="$(cd "$WORKSPACE" 2>/dev/null && pwd || echo "$WORKSPACE")"

# Always use open -a with --args --popup
# single-instance plugin handles routing to the running instance
open -a "$APP_NAME" --args --popup "$WORKSPACE"
```

Make it executable:

```bash
chmod +x scripts/fpath
```

- [ ] **Step 2: Commit**

```bash
git add scripts/fpath
git commit -m "feat: add fpath CLI wrapper script for popup trigger"
```

---

### Task 6: Integration Check

**Files:**
- (verification only — no file changes)

- [ ] **Step 1: Run full typecheck**

Run: `pnpm typecheck 2>&1`
Expected: No errors.

If type errors exist, fix them before proceeding.

- [ ] **Step 2: Run Rust build**

Run: `cargo build --manifest-path apps/desktop/src-tauri/Cargo.toml 2>&1`
Expected: Build succeeds.

- [ ] **Step 3: Run all tests**

Run: `pnpm --filter @fpath/shared test 2>&1 && cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml 2>&1`
Expected: All tests pass (27 shared tests, 2 Rust tests).

- [ ] **Step 4: Commit any fixes**

If no fixes were needed, skip. Otherwise:

```bash
git add -A
git commit -m "fix: integration fixes for popup mode"
```

---

### Verification

1. **Typecheck + tests pass:** `pnpm typecheck && cargo test` — all clean
2. **Popup window config:** Verify `tauri.conf.json` has both windows with correct labels and popup-specific flags
3. **Window branching:** Verify `main.tsx` renders PopupApp for label `"popup"` and DesktopApp for label `"main"`
4. **Popup UX (manual):** Build the app, press Cmd+Shift+F — popup appears, centered, always on top, frameless. Type in search bar, navigate with arrows, Enter copies path and dismisses, Escape dismisses, Cmd+Enter copies all checked paths
5. **CLI (manual):** Run `scripts/fpath /some/path` — popup opens with that workspace
