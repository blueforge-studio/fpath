# fpath — File Browser Companion

## Overview
Tauri-based file browser for quick file path discovery during Claude Code sessions. Three modes: Desktop (A), Popup (B), TUI (C).

## Stack
- **Monorepo:** pnpm workspaces + Turbo
- **Desktop/Popup:** Tauri v2 + React 19 + Vite + Tailwind CSS + Monaco Editor
- **TUI (future):** Go + Bubble Tea
- **Shared:** TypeScript package (`@fpath/shared`)

## Project Structure
```
fpath/
├── apps/
│   ├── desktop/          # Tauri v2 + React (modes A & B)
│   └── tui/              # Go TUI (future)
├── packages/
│   └── shared/           # @fpath/shared — tree logic, types, path utils
```

## Development
- `pnpm dev` — start desktop app in dev mode
- `pnpm dev:desktop` — start just the desktop app
- `pnpm build` — build all packages
- `pnpm typecheck` — type-check all packages

## Tauri Commands
Run from `apps/desktop/`:
- `pnpm tauri dev` — dev server with hot reload
- `pnpm tauri build` — production build
