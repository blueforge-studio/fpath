const features = [
  {
    title: "Edit & save with Cmd+S",
    desc: "Monaco is fully editable. Dirty tabs are marked with ●; closing one prompts before discarding. Files >2 MB stay read-only.",
  },
  {
    title: "Live external-change detection",
    desc: "Open files are watched. Clean tabs reload silently when something else writes them; dirty tabs prompt with Reload / Keep mine.",
  },
  {
    title: "Right-click actions",
    desc: "Reveal in Finder, Explorer, or your file manager. Open in $EDITOR (or a configurable command — code, cursor, subl -n, zed --wait).",
  },
  {
    title: "Tab navigation",
    desc: "Cmd+1..9 jump, Cmd+9 lands on the last tab, Cmd+W closes (with dirty guard), Cmd+Shift+[/] cycles prev/next.",
  },
  {
    title: "Lazy file tree",
    desc: "Children load on expand, so workspaces with thousands of folders stay fast.",
  },
  {
    title: "Background workspace index",
    desc: "Whole-workspace file index built in the background. Cmd+P and the filter input search every file, not just what's expanded.",
  },
  {
    title: "Smart filters",
    desc: "Hide dotfiles, restrict the root to directories, or only show top-level dirs that contain a .git folder. State persists across sessions.",
  },
  {
    title: "Cmd+Shift+F text search",
    desc: "Rust-powered recursive grep across the files you choose by extension. Case-insensitive, capped at 500 matches.",
  },
  {
    title: "Path clipboard",
    desc: "Multi-select files, then Enter (relative) or Shift+Enter (absolute) to copy. Toast confirms what landed in your clipboard.",
  },
  {
    title: "Resizable splitter",
    desc: "Drag the divider between tree and viewer. Width persists. Window auto-shrinks when no tab is open.",
  },
  {
    title: "Persistent state",
    desc: "Workspace, recents, splitter width, window width, filter toggles, and external-editor command all survive restarts.",
  },
  {
    title: "Ignore-aware walker",
    desc: "Skips node_modules, .git, target, dist, .turbo, .next, .claude, and friends out of the box.",
  },
];

export default function FeatureGrid() {
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
