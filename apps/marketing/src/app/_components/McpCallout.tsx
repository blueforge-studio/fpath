const tools = [
  { name: "list_directory", desc: "Immediate entries in a directory." },
  { name: "find_files", desc: "Substring match on file name / relative path." },
  { name: "search_text", desc: "Grep across files filtered by extension." },
  { name: "read_file", desc: "Read a UTF-8 text file (size-capped)." },
];

export default function McpCallout() {
  return (
    <section
      id="mcp"
      className="px-6 py-24 max-w-5xl mx-auto border-t border-zinc-800"
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
            Mode D — MCP
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Use fpath from Claude Code.
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed">
            <code className="text-zinc-300">@fpath/mcp</code> exposes the same
            workspace tools the desktop app uses to any{" "}
            <a
              href="https://modelcontextprotocol.io"
              className="text-blue-400 hover:text-blue-300"
            >
              MCP client
            </a>
            . Drop the binary into Claude Code, point it at a workspace, and the
            agent can list, fuzzy-find, grep, and read files directly — no
            copy-pasting paths back and forth.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {tools.map((t) => (
              <li key={t.name} className="flex gap-3">
                <code className="text-emerald-300 font-mono shrink-0">
                  {t.name}
                </code>
                <span className="text-zinc-400">{t.desc}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="px-4 py-2 text-[11px] text-zinc-500 font-mono border-b border-zinc-800">
            ~/.claude/mcp.json
          </div>
          <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "fpath": {
      "command": "node",
      "args": [
        "/abs/path/to/fpath/apps/mcp/dist/index.js",
        "--workspace",
        "/abs/path/to/your/repo"
      ]
    }
  }
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}
