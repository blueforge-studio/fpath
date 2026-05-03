function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
      <a href="/" className="text-lg font-semibold tracking-tight">
        fpath
      </a>
      <div className="flex items-center gap-6 text-sm text-zinc-400">
        <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
        <a href="#install" className="hover:text-zinc-100 transition-colors">Install</a>
        <a
          href="https://github.com/kristianmandrup/fpath"
          className="hover:text-zinc-100 transition-colors"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="px-6 pt-24 pb-16 max-w-5xl mx-auto text-center">
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
        Find files.{" "}
        <span className="text-blue-400">Instantly.</span>
      </h1>
      <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        fpath is a lightweight desktop file browser companion for developers.
        Navigate project trees, preview files with syntax highlighting, and copy
        paths — without leaving your flow.
      </p>
      <div className="mt-10 flex items-center justify-center gap-4">
        <a
          href="#install"
          className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white hover:bg-blue-400 transition-colors"
        >
          Download for macOS
        </a>
        <a
          href="https://github.com/kristianmandrup/fpath"
          className="rounded-lg bg-zinc-800 px-6 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          View on GitHub
        </a>
      </div>
    </section>
  );
}

function ScreenshotMock() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-24">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-zinc-500">fpath — ~/Projects/Repos/fpath</span>
        </div>
        <div className="flex h-96">
          <div className="w-64 border-r border-zinc-800 p-4 text-sm text-zinc-400 font-mono overflow-hidden">
            <p className="text-zinc-500 mb-2">Files</p>
            <p className="text-zinc-300">▸ apps/</p>
            <p className="text-zinc-300 ml-3">▸ desktop/</p>
            <p className="text-zinc-500 ml-6">▸ src/</p>
            <p className="text-zinc-500 ml-6">▸ src-tauri/</p>
            <p className="text-zinc-500 ml-6">package.json</p>
            <p className="text-zinc-300 ml-3">▸ marketing/</p>
            <p className="text-zinc-300">▸ packages/</p>
            <p className="text-zinc-500 ml-3">▸ shared/</p>
            <p className="text-zinc-500">README.md</p>
            <p className="text-zinc-500">package.json</p>
          </div>
          <div className="flex-1 p-4 text-sm text-zinc-400 font-mono">
            <p className="text-zinc-500 mb-3">README.md</p>
            <p className="text-blue-300"># fpath</p>
            <p>&nbsp;</p>
            <p className="text-zinc-300">Navigate, preview, and copy file paths fast.</p>
            <p className="text-zinc-300">Built for developers who live in the terminal.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const modes = [
  {
    title: "Desktop",
    tag: "Available now",
    desc: "Full Tauri desktop app. Open any folder, browse the tree, preview files with Monaco syntax highlighting, and copy paths to your clipboard.",
  },
  {
    title: "Popup",
    tag: "Coming soon",
    desc: "Frameless overlay window summoned by a global shortcut. Quick file lookup without leaving your editor or terminal.",
  },
  {
    title: "TUI",
    tag: "Phase 3",
    desc: "Terminal-native file browser. Go + Bubble Tea with vim keybindings and fuzzy search. For the die-hard terminal crowd.",
  },
];

function Features() {
  return (
    <section id="features" className="px-6 py-24 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center">Three Modes. One Purpose.</h2>
      <p className="mt-3 text-center text-zinc-400">
        Pick the interface that fits your workflow.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {modes.map((m) => (
          <div
            key={m.title}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
          >
            <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
              {m.tag}
            </span>
            <h3 className="mt-3 text-lg font-semibold">{m.title}</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              {m.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const features = [
  { title: "File tree navigation", desc: "Fast keyboard-driven tree with multi-select, expand/collapse, and hidden file toggle." },
  { title: "Syntax-highlighted preview", desc: "Monaco Editor powers the preview pane — the same engine behind VS Code." },
  { title: "Quick search", desc: "Cmd+P fuzzy file search across the entire workspace, with instant preview." },
  { title: "Copy paths", desc: "Copy absolute or relative paths for any file. Paste directly into your terminal or editor." },
  { title: "Multi-tab viewer", desc: "Open multiple files in tabs. Close, reorder, or switch — familiar browser-like UX." },
  { title: "gitignore aware", desc: "Ignores .gitignore patterns out of the box. Only see files that matter." },
];

function FeatureGrid() {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto border-t border-zinc-800">
      <h2 className="text-3xl font-bold text-center">Capabilities</h2>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border border-zinc-800 p-5">
            <h3 className="font-semibold text-sm">{f.title}</h3>
            <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Install() {
  return (
    <section id="install" className="px-6 py-24 max-w-5xl mx-auto border-t border-zinc-800">
      <h2 className="text-3xl font-bold text-center">Get fpath</h2>
      <p className="mt-3 text-center text-zinc-400">Works on macOS. Windows and Linux builds planned.</p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-semibold">Download .dmg</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Grab the latest signed build from GitHub Releases. Open, drag to
            Applications, done.
          </p>
          <a
            href="https://github.com/kristianmandrup/fpath/releases"
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
            <p>git clone https://github.com/kristianmandrup/fpath</p>
            <p>cd fpath && pnpm install</p>
            <p>cd apps/desktop && pnpm tauri build</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-8 max-w-5xl mx-auto border-t border-zinc-800 text-center text-sm text-zinc-500">
      <p>fpath — built by <a href="https://blueforge.studio" className="hover:text-zinc-300 transition-colors">BlueForge Studio</a>. MIT licensed.</p>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ScreenshotMock />
        <Features />
        <FeatureGrid />
        <Install />
      </main>
      <Footer />
    </>
  );
}
