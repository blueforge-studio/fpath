# fpath — File Browser Companion

Navigate, preview, and copy file paths fast. Built for developers who live in the terminal and need quick file discovery during CLI and IDE sessions.

## Modes

| Mode | Name | Technology | Status |
|------|------|------------|--------|
| **A** | Desktop | Tauri v2 + React 19 | Active |
| **B** | Popup | Tauri window (frameless overlay) | Planned |
| **C** | TUI | Go + Bubble Tea | Planned |

## Installation (macOS)

### Option 1 — Download the App (easiest)

Download the latest `.dmg` from [releases](https://github.com/kristianmandrup/fpath/releases), open, and drag **fpath** to `/Applications`.

### Option 2 — Build from Source

**Prerequisites**

- **Rust** — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node >= 20** — `brew install node` or via [nvm](https://github.com/nvm-sh/nvm)
- **pnpm >= 9** — `npm install -g pnpm`
- **Xcode Command Line Tools** (for macOS code-signing) — `xcode-select --install`

```bash
git clone https://github.com/kristianmandrup/fpath.git
cd fpath

pnpm install
pnpm build          # build shared + frontend
cd apps/desktop
pnpm tauri build    # produces .app in src-tauri/target/release/bundle/macos/
```

### Option 3 — Dev Mode (for contributors)

```bash
pnpm install
pnpm dev:desktop    # starts Vite + Tauri dev window

# Or run Tauri directly from the desktop app:
cd apps/desktop
pnpm tauri dev       # same, but from within the app directory
```

After build, move the app:

```bash
cp -r apps/desktop/src-tauri/target/release/bundle/macos/fpath.app /Applications/
```

On first launch, right-click → **Open** to bypass Gatekeeper (or `xattr -d com.apple.quarantine /Applications/fpath.app`).

## Usage

| Action | Shortcut |
|--------|----------|
| Open workspace | `Cmd+O` |
| Quick file search | `Cmd+P` |
| Navigate tree | Arrow keys |
| Preview file | Enter |
| Copy file path | `Cmd+Shift+C` |
| Toggle hidden files | `Cmd+Shift+.` |

## Project Structure

```
fpath/
├── apps/
│   ├── desktop/         # Tauri v2 + React 19
│   │   ├── src/         # React frontend (Vite)
│   │   └── src-tauri/   # Rust backend
│   └── tui/             # Go TUI (Phase 3)
├── packages/
│   └── shared/          # @fpath/shared — types, tree, path utils
├── package.json         # Root workspace config
├── pnpm-workspace.yaml
├── turbo.json           # Turborepo pipeline
└── tsconfig.base.json
```

## Commands

```bash
pnpm dev              # Run all apps in dev mode
pnpm dev:desktop      # Desktop app only
pnpm build            # Build all packages
pnpm build:desktop    # Build desktop app only
pnpm typecheck        # Type-check all packages
pnpm lint             # Lint all packages
```

## Tech Stack

- **Desktop shell:** Tauri v2 (Rust)
- **Frontend:** React 19, Vite 6, Tailwind CSS, Monaco Editor
- **Monorepo:** pnpm workspaces, Turborepo
- **TUI (future):** Go, Bubble Tea, Chroma

## License

MIT
