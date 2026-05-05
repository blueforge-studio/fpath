export default function Hero() {
  return (
    <section className="px-6 pt-24 pb-16 max-w-5xl mx-auto text-center">
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
        Find files. Edit files.{" "}
        <span className="text-blue-400">Without leaving your terminal flow.</span>
      </h1>
      <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        A keyboard-first desktop file browser with a real Monaco editor, a
        Bubble Tea TUI, and an MCP server so AI agents can browse the same
        workspace. Live external-change detection. Right-click to reveal in
        Finder or open in your editor of choice.
      </p>
      <p className="mt-3 text-sm text-zinc-500 font-mono">
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Cmd+P</kbd>{" "}
        files ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
          Cmd+Shift+F
        </kbd>{" "}
        text ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Cmd+S</kbd>{" "}
        save ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Enter</kbd>{" "}
        copy paths
      </p>
      <div className="mt-10 flex items-center justify-center gap-4">
        <a
          href="#install"
          className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white hover:bg-blue-400 transition-colors"
        >
          Download for macOS
        </a>
        <a
          href="https://github.com/blueforge-studio/fpath"
          className="rounded-lg bg-zinc-800 px-6 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          View on GitHub
        </a>
      </div>
    </section>
  );
}
