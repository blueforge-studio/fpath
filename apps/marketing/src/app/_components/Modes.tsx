const modes = [
  {
    title: "Desktop",
    tag: "Available now",
    desc: "Full Tauri desktop app. Browse the tree, edit files in Monaco with Cmd+S, dirty-tab indicator, prompt-on-close, and live external-change detection.",
  },
  {
    title: "Popup",
    tag: "Available now",
    desc: "Frameless overlay summoned anywhere with Cmd+Option+Space. Type to find a file in your workspace, Enter copies the relative path, Shift+Enter copies absolute. Hides on Esc or shortcut toggle.",
  },
  {
    title: "TUI",
    tag: "Available now",
    desc: "fpath-tui — Go + Bubble Tea, runs in any terminal. Vim keys (j/k, /, Space, y/Y), workspace-wide fuzzy filter, multi-select clipboard, and `e` to open the highlighted file in $EDITOR.",
  },
  {
    title: "MCP",
    tag: "Available now",
    desc: "@fpath/mcp — speak MCP over stdio so Claude Code, Claude Desktop, or any MCP client can list, search, grep, and read your workspace without you copy-pasting paths.",
  },
];

export default function Modes() {
  return (
    <section id="features" className="px-6 py-24 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center">Four Modes. One Purpose.</h2>
      <p className="mt-3 text-center text-zinc-400">
        Pick the interface that fits your workflow — or run several at once.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((m) => (
          <div
            key={m.title}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
          >
            <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
              {m.tag}
            </span>
            <h3 className="mt-3 text-lg font-semibold">{m.title}</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
