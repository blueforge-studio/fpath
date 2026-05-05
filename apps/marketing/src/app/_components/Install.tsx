export default function Install() {
  return (
    <section
      id="install"
      className="px-6 py-24 max-w-5xl mx-auto border-t border-zinc-800"
    >
      <h2 className="text-3xl font-bold text-center">Get fpath</h2>
      <p className="mt-3 text-center text-zinc-400">
        Works on macOS. Windows and Linux builds planned. The TUI and MCP
        server run on any OS.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-semibold">Download .dmg</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Grab the latest signed build from GitHub Releases. Open, drag to
            Applications, done.
          </p>
          <a
            href="https://github.com/blueforge-studio/fpath/releases"
            className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Browse releases →
          </a>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-semibold">Build from source</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Clone the repo, install deps, and run one command. Requires Rust and
            Node.js.
          </p>
          <div className="mt-4 rounded-lg bg-zinc-950 p-3 text-xs font-mono text-zinc-300 overflow-x-auto">
            <p>git clone https://github.com/blueforge-studio/fpath</p>
            <p>cd fpath &amp;&amp; pnpm install</p>
            <p>cd apps/desktop &amp;&amp; pnpm tauri build</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-semibold">TUI binary</h3>
          <p className="mt-2 text-sm text-zinc-400">
            For ssh sessions, tmux panes, and remote boxes.
          </p>
          <div className="mt-4 rounded-lg bg-zinc-950 p-3 text-xs font-mono text-zinc-300 overflow-x-auto">
            <p>cd apps/tui</p>
            <p>go build -o fpath-tui .</p>
            <p>./fpath-tui ~/Projects</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-semibold">MCP server</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Build the server, then drop the path into your MCP client config.
          </p>
          <div className="mt-4 rounded-lg bg-zinc-950 p-3 text-xs font-mono text-zinc-300 overflow-x-auto">
            <p>pnpm install</p>
            <p>pnpm --filter @fpath/mcp build</p>
            <p># node apps/mcp/dist/index.js --workspace /path</p>
          </div>
        </div>
      </div>
    </section>
  );
}
