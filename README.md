# fpath — File Browser Companion

Navigate, preview, and copy file paths fast. Built for developers who live in the terminal and need quick file discovery during CLI and IDE sessions.

[![CI](https://github.com/blueforge-studio/fpath/actions/workflows/ci.yml/badge.svg)](https://github.com/blueforge-studio/fpath/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Lazy file tree** — directories load on expand; large workspaces stay snappy.
- **Background workspace index** — full-workspace file index built in the background, so the filter input and Cmd+P quick search find every file (not just what's expanded).
- **Three filter toggles** — `Hide .` (dotfiles), `Dirs only` (no files at root), `Repos only` (top-level dirs that contain a `.git` child). All persisted across sessions.
- **Multi-tab Monaco editor** — the same editor that powers VS Code. Edit and save with `Cmd+S`. Dirty tabs are marked with a `●`; closing one prompts before discarding. Files >2 MB stay read-only.
- **Live external-change detection** — open files are watched. Clean tabs reload silently when the file changes on disk; dirty tabs prompt with *Reload* / *Keep mine*. Self-events from your own saves are suppressed.
- **Right-click actions** — Reveal in Finder / Explorer / file manager (platform-aware) and Open in `$EDITOR` (configurable in Settings; falls back to `$VISUAL`/`$EDITOR`/`code`).
- **Tab navigation** — `Cmd+1..8` jump to tab N, `Cmd+9` jumps to last, `Cmd+W` closes (with dirty guard), `Cmd+Shift+[` / `Cmd+Shift+]` cycle prev/next.
- **Resizable splitter** — drag the divider between tree and viewer; width persists.
- **Auto window resize** — window snaps to half-width when no tab is open, restores to your wide width when you open a file.
- **Quick file search** — `Cmd+P` searches the full workspace index by name and relative path.
- **Text content search** — `Cmd+Shift+F` runs a Rust-side recursive grep across `.ts` / `.tsx` / `.md` (toggle which extensions). Case-insensitive substring match.
- **Path clipboard** — multi-select files, then `Enter` (relative paths) or `Shift+Enter` (absolute) to copy. Toast confirms what was copied.
- **Persistent state** — workspace, recent picker, splitter width, window width, filter toggles, and external-editor command all survive restarts (`@tauri-apps/plugin-store`).
- **Settings panel** — gear icon in the toolbar opens a modal: custom ignore patterns (gitignore syntax), text-search extension list, external editor command, and updates.
- **Auto-update** — built-in updater checks GitHub Releases for signed builds and installs in-place (see [Releases & signing](./docs/USAGE.md#releases--signing)).
- **Popup mode (Mode B)** — frameless overlay summoned anywhere with `Cmd+Option+Space`. Type to fuzzy-find a file in the workspace, `Enter` copies the relative path and dismisses; `Shift+Enter` copies the absolute path.
- **TUI mode (Mode C)** — `fpath-tui` Go binary built with [Bubble Tea](https://github.com/charmbracelet/bubbletea). Vim-style keys (`j`/`k`, `/`, `Space`, `y`/`Y`), workspace-wide filter, multi-select clipboard, plus `e` to open the highlighted file in `$EDITOR`. See [apps/tui/README.md](./apps/tui/README.md).
- **MCP server (Mode D)** — `@fpath/mcp` exposes the workspace tools (`list_directory`, `find_files`, `search_text`, `read_file`) over MCP/stdio. Drop the binary into Claude Code, Claude Desktop, or any MCP client. See [apps/mcp/README.md](./apps/mcp/README.md).

## Modes

| Mode | Name | Technology | Status |
|------|------|------------|--------|
| **A** | Desktop | Tauri v2 + React 19 | Active |
| **B** | Popup | Frameless overlay (`Cmd+Option+Space`) | Active |
| **C** | TUI | Go + Bubble Tea (`fpath-tui`) | Active — see [apps/tui/README.md](./apps/tui/README.md) |
| **D** | MCP server | Node + `@modelcontextprotocol/sdk` | Active — see [apps/mcp/README.md](./apps/mcp/README.md) |

## Installation (macOS)

### Option 1 — Download the App (easiest)

Download the latest `.dmg` from [releases](https://github.com/blueforge-studio/fpath/releases), open, and drag **fpath** to `/Applications`.

On first launch, right-click → **Open** to bypass Gatekeeper (or `xattr -d com.apple.quarantine /Applications/fpath.app`).

### Option 2 — Build from Source

**Prerequisites**

- **Rust** — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node ≥ 24** — `brew install node` or via [nvm](https://github.com/nvm-sh/nvm)
- **pnpm ≥ 9** — `corepack enable && corepack prepare pnpm@latest --activate`
- **Xcode Command Line Tools** — `xcode-select --install`

```bash
git clone https://github.com/blueforge-studio/fpath.git
cd fpath
pnpm install
pnpm build:desktop
cd apps/desktop
pnpm tauri build      # produces .app in src-tauri/target/release/bundle/macos/
cp -r src-tauri/target/release/bundle/macos/fpath.app /Applications/
```

### Option 3 — Dev Mode (for contributors)

```bash
pnpm install
cd apps/desktop && pnpm tauri dev
```

Vite hot-reloads the React side; Cargo rebuilds the Rust side on `src-tauri/` changes.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle Popup mode (global) | `Cmd+Option+Space` |
| Quick file search | `Cmd+P` |
| Text content search | `Cmd+Shift+F` |
| Focus tree filter input | `Cmd+F` |
| Save active tab | `Cmd+S` |
| Close active tab (dirty-guarded) | `Cmd+W` |
| Jump to tab N (1..8) / last (9) | `Cmd+1..9` |
| Previous / next tab (cyclical) | `Cmd+Shift+[` / `Cmd+Shift+]` |
| Copy selected paths (relative) | `Enter` |
| Copy selected paths (absolute) | `Shift+Enter` |
| Select-only on a folder (no expand) | `Shift+Click` |
| Toggle directory expand | Click the row |
| Toggle file selection | Click the checkbox |
| Right-click an entry | Reveal in Finder / Open in editor |

## Project Structure

```
fpath/
├── apps/
│   ├── desktop/         # Tauri v2 + React 19 + Vite + Monaco
│   │   ├── src/         # React frontend
│   │   └── src-tauri/   # Rust backend (search_text, list_directory, reveal_in_file_manager, open_in_editor, ...)
│   ├── marketing/       # Next.js landing page
│   ├── mcp/             # @fpath/mcp — MCP server (Node + stdio)
│   └── tui/             # Go + Bubble Tea TUI (fpath-tui)
├── packages/
│   └── shared/          # @fpath/shared — types, tree logic, ignore, tests
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## Commands

```bash
pnpm dev:desktop      # Start desktop dev server (Vite + Tauri)
pnpm dev:marketing    # Start marketing site dev server
pnpm build            # Build all packages
pnpm typecheck        # Type-check all packages
pnpm test             # Run all test suites (vitest in @fpath/shared, @fpath/desktop, @fpath/mcp)
pnpm lint             # Lint all packages
```

## Tech Stack

- **Desktop shell:** Tauri v2 (Rust)
- **Frontend:** React 19, Vite 6, TypeScript 5, Monaco Editor, Tailwind via plain CSS
- **Plugins:** `plugin-fs`, `plugin-dialog`, `plugin-clipboard-manager`, `plugin-store`
- **Marketing site:** Next.js 16, Tailwind 4
- **Monorepo:** pnpm workspaces, Turborepo
- **Tests:** Vitest across `@fpath/shared` (tree/ignore), `@fpath/desktop` (lang-map, file editor states, file watchers, tab keybindings — `jsdom` + `@testing-library/react`), and `@fpath/mcp` (per-tool tests against tmp workspaces)
- **TUI:** Go 1.24, Bubble Tea, Lipgloss, atotto/clipboard (chroma syntax-highlight planned)

## Documentation

- [Usage guide](./docs/USAGE.md) — keyboard shortcuts, filters, search modes, tips.

## License

MIT — see [LICENSE](./LICENSE).
