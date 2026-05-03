# fpath TUI (Mode C)

Terminal file browser. Go + [Bubble Tea](https://github.com/charmbracelet/bubbletea).

A keyboard-only fpath that runs in any terminal — same workspace traversal, same multi-select clipboard flow, same workspace-wide filename filter.

## Build

```bash
cd apps/tui
go build -o fpath-tui .
./fpath-tui [path]
```

If you omit `path`, the current directory is used.

## Install

```bash
go install github.com/blueforge-studio/fpath/apps/tui@latest
# binary lands in $(go env GOPATH)/bin as 'tui' — rename if you want
```

Or build the binary above and drop `fpath-tui` somewhere on your `$PATH`.

## Usage

```bash
fpath-tui ~/Projects/Repos
```

### Keys (browse mode)

| Key | Action |
|-----|--------|
| `j` / `↓` | Move cursor down |
| `k` / `↑` | Move cursor up |
| `g` / `G` | Jump to top / bottom |
| `Ctrl+d` / `Ctrl+u` | Page down / up (10 rows) |
| `h` / `←` | Collapse current directory or move cursor to parent |
| `l` / `→` / `Enter` | Expand directory |
| `Space` | Toggle selection on current entry |
| `u` | Clear all selection |
| `y` | Copy relative path(s) of selection (or current entry) |
| `Y` | Copy absolute path(s) |
| `/` | Enter filter mode (workspace-wide) |
| `?` | Toggle help overlay |
| `q` / `Ctrl+C` | Quit |

### Keys (filter mode)

`/` opens a single-line input that searches across the **entire workspace** (not just expanded directories — the index is built in the background at startup).

| Key | Action |
|-----|--------|
| Type | Refine the filter |
| `↑` / `↓` (or `Ctrl+p` / `Ctrl+n`) | Move through results |
| `Space` | Toggle selection on the highlighted match |
| `Ctrl+y` | Copy selection while staying in the modal |
| `Enter` | Commit and return to browse mode |
| `Esc` | Cancel and return to browse mode |

## Behavior parity

| Feature | Desktop (Mode A) | TUI (Mode C) |
|---------|------------------|--------------|
| Lazy-loaded tree | ✓ | ✓ (per-directory) |
| Multi-select | ✓ checkbox | ✓ Space + ✔ marker |
| Copy relative / absolute | ✓ Enter / Shift+Enter | ✓ y / Y |
| Workspace-wide name filter | ✓ Cmd+F + Cmd+P | ✓ / |
| Ignore patterns | extensible via Settings | hardcoded defaults (matches `@fpath/shared`) |
| Text content search | ✓ Cmd+Shift+F | not yet |
| Monaco preview | ✓ | not yet |
| Auto-update | ✓ | rebuild manually |

## Roadmap

- Split-pane preview with [chroma](https://github.com/alecthomas/chroma) syntax highlighting
- ripgrep-backed text content search to match Mode A
- Custom ignore patterns from a config file
- Bookmarks / pinned roots

## Development

```bash
go vet ./...
go build .
```

The TUI is a standalone Go module — it doesn't share code with the Tauri/React app today (it has its own minimal `ignore.go` mirroring `@fpath/shared/ignore.ts`). If they grow significantly, a shared schema or a thin Rust core could unify them.
