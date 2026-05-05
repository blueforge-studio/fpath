# @fpath/mcp

MCP (Model Context Protocol) server for fpath. Exposes the workspace browsing
tools used by the desktop UI to MCP clients (Claude Code, Claude Desktop,
Cursor, etc.) so an AI agent can list files, search by name, grep contents,
and read files directly.

## Tools

| Tool             | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `list_directory` | List immediate entries in a directory.                     |
| `find_files`     | Substring match on file name / relative path.              |
| `search_text`    | Grep across files filtered by extension.                   |
| `read_file`      | Read a UTF-8 text file (size-capped).                      |

All tools accept an optional `workspace` argument. If omitted, the server's
configured workspace (passed at startup) is used.

## Building

```sh
pnpm install
pnpm --filter @fpath/mcp build
```

This produces an executable at `apps/mcp/dist/index.js`.

## Wiring it into Claude Code

Add to `~/.claude/mcp.json` (or your project's `.mcp.json`):

```json
{
  "mcpServers": {
    "fpath": {
      "command": "node",
      "args": [
        "/absolute/path/to/fpath/apps/mcp/dist/index.js",
        "--workspace",
        "/absolute/path/to/your/repo"
      ]
    }
  }
}
```

Alternatively, set `FPATH_WORKSPACE` via `env`:

```json
{
  "mcpServers": {
    "fpath": {
      "command": "node",
      "args": ["/absolute/path/to/fpath/apps/mcp/dist/index.js"],
      "env": {
        "FPATH_WORKSPACE": "/absolute/path/to/your/repo"
      }
    }
  }
}
```

## Running directly (dev)

```sh
FPATH_WORKSPACE=$PWD pnpm --filter @fpath/mcp dev
```

This runs `tsx watch` for fast iteration. The MCP server speaks JSON-RPC over
stdio — connect a client (e.g. `mcp-inspector`) to it.
