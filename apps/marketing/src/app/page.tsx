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
          href="https://github.com/blueforge-studio/fpath"
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
        A keyboard-first desktop file browser. Lazy tree, background index,
        Monaco preview, and a Rust-powered grep — bundled into a single
        Tauri app under 20MB.
      </p>
      <p className="mt-3 text-sm text-zinc-500 font-mono">
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Cmd+P</kbd>{" "}
        files ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Cmd+Shift+F</kbd>{" "}
        text ·{" "}
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

function ScreenshotMock() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-24">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-3 text-xs text-zinc-500 font-mono">fpath — ~/Projects/Repos</span>
        </div>
        <div className="flex h-96">
          <div className="w-64 border-r border-zinc-800 flex flex-col">
            <div className="px-3 py-2 border-b border-zinc-800 space-y-2">
              <div className="text-xs text-zinc-500 px-2 py-1 rounded bg-zinc-950 border border-zinc-800">
                Filter files (Cmd+F) — 12,481 indexed
              </div>
              <div className="flex gap-1.5 text-[10px]">
                <span className="px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">Hide .</span>
                <span className="px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">Dirs only</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/30 border border-blue-400 text-blue-300">Repos only</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-2 text-xs text-zinc-400 font-mono space-y-0.5">
              <p>▾ <span className="text-zinc-200">fpath</span></p>
              <p className="ml-4">▸ apps</p>
              <p className="ml-4">▸ packages</p>
              <p className="ml-4">README.md</p>
              <p>▸ blueforge-org</p>
              <p>▸ booking-platform</p>
              <p className="bg-blue-500/10 text-blue-300 px-1 rounded">▸ character-creation</p>
              <p>▸ clinic-os</p>
              <p>▸ engine-core</p>
              <p>▸ marketing-site</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex border-b border-zinc-800 text-xs">
              <div className="px-3 py-1.5 bg-zinc-900 border-r border-zinc-800 text-zinc-300">
                package.json <span className="text-zinc-600 ml-1">×</span>
              </div>
              <div className="px-3 py-1.5 text-zinc-500 border-r border-zinc-800">
                README.md <span className="text-zinc-700 ml-1">×</span>
              </div>
            </div>
            <div className="px-3 py-1 text-[10px] text-zinc-600 font-mono border-b border-zinc-800">
              character-creation/package.json
            </div>
            <pre className="flex-1 p-3 text-xs font-mono text-zinc-300 overflow-hidden leading-relaxed">
{`{
  `}<span className="text-blue-300">&quot;name&quot;</span>{`: `}<span className="text-emerald-300">&quot;@bf/character-creation&quot;</span>{`,
  `}<span className="text-blue-300">&quot;version&quot;</span>{`: `}<span className="text-emerald-300">&quot;0.0.0&quot;</span>{`,
  `}<span className="text-blue-300">&quot;type&quot;</span>{`: `}<span className="text-emerald-300">&quot;module&quot;</span>{`,
  `}<span className="text-blue-300">&quot;scripts&quot;</span>{`: {
    `}<span className="text-blue-300">&quot;test&quot;</span>{`: `}<span className="text-emerald-300">&quot;vitest&quot;</span>{`
  }
}`}
            </pre>
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
    tag: "Available now",
    desc: "Frameless overlay window summoned anywhere with Cmd+Option+Space. Type to find a file in your workspace, Enter copies the relative path, Shift+Enter copies absolute. Hides on Esc or shortcut toggle.",
  },
  {
    title: "TUI",
    tag: "Available now",
    desc: "fpath-tui — Go + Bubble Tea, runs in any terminal. Vim keys (j/k, /, Space, y/Y), workspace-wide fuzzy filter, multi-select clipboard. For ssh sessions and tmux panes.",
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
  { title: "Lazy file tree", desc: "Children load on expand, so workspaces with thousands of folders stay fast." },
  { title: "Background workspace index", desc: "Whole-workspace file index built in the background. Cmd+P and the filter input search every file, not just what's expanded." },
  { title: "Smart filters", desc: "Hide dotfiles, restrict the root to directories, or only show top-level dirs that contain a .git folder. State persists across sessions." },
  { title: "Multi-tab Monaco viewer", desc: "The editor that powers VS Code, with syntax highlighting for ~25 languages and a familiar tab strip." },
  { title: "Cmd+Shift+F text search", desc: "Rust-powered recursive grep across the files you choose by extension (.ts, .tsx, .md). Case-insensitive, capped at 500 matches." },
  { title: "Path clipboard", desc: "Multi-select files, then Enter (relative) or Shift+Enter (absolute) to copy. Toast confirms what landed in your clipboard." },
  { title: "Resizable splitter", desc: "Drag the divider between tree and viewer. Width persists. Window auto-shrinks when no tab is open." },
  { title: "Persistent state", desc: "Workspace, recents, splitter width, window width, and filter toggles all survive restarts." },
  { title: "Ignore-aware walker", desc: "Skips node_modules, .git, target, dist, .turbo, .next, and friends out of the box." },
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
