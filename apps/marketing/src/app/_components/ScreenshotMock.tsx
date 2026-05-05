export default function ScreenshotMock() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-24">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-3 text-xs text-zinc-500 font-mono">
            fpath — ~/Projects/Repos
          </span>
        </div>
        <div className="flex h-96">
          <div className="w-64 border-r border-zinc-800 flex flex-col">
            <div className="px-3 py-2 border-b border-zinc-800 space-y-2">
              <div className="text-xs text-zinc-500 px-2 py-1 rounded bg-zinc-950 border border-zinc-800">
                Filter files (Cmd+F) — 12,481 indexed
              </div>
              <div className="flex gap-1.5 text-[10px]">
                <span className="px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">
                  Hide .
                </span>
                <span className="px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">
                  Dirs only
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/30 border border-blue-400 text-blue-300">
                  Repos only
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-2 text-xs text-zinc-400 font-mono space-y-0.5">
              <p>
                ▾ <span className="text-zinc-200">fpath</span>
              </p>
              <p className="ml-4">▸ apps</p>
              <p className="ml-4">▸ packages</p>
              <p className="ml-4">README.md</p>
              <p>▸ blueforge-org</p>
              <p>▸ booking-platform</p>
              <p className="bg-blue-500/10 text-blue-300 px-1 rounded">
                ▸ character-creation
              </p>
              <p>▸ clinic-os</p>
              <p>▸ engine-core</p>
              <p>▸ marketing-site</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex border-b border-zinc-800 text-xs">
              <div className="px-3 py-1.5 bg-zinc-900 border-r border-zinc-800 text-zinc-300">
                package.json{" "}
                <span className="text-blue-400 ml-1" title="unsaved">
                  ●
                </span>
              </div>
              <div className="px-3 py-1.5 text-zinc-500 border-r border-zinc-800">
                README.md <span className="text-zinc-700 ml-1">×</span>
              </div>
            </div>
            <div className="px-3 py-1 text-[10px] text-zinc-600 font-mono border-b border-zinc-800">
              character-creation/package.json
              <span className="ml-2 italic text-zinc-500">• modified</span>
            </div>
            <pre className="flex-1 p-3 text-xs font-mono text-zinc-300 overflow-hidden leading-relaxed">
{`{
  `}
              <span className="text-blue-300">&quot;name&quot;</span>
              {`: `}
              <span className="text-emerald-300">
                &quot;@bf/character-creation&quot;
              </span>
              {`,
  `}
              <span className="text-blue-300">&quot;version&quot;</span>
              {`: `}
              <span className="text-emerald-300">&quot;0.1.0&quot;</span>
              {`,
  `}
              <span className="text-blue-300">&quot;type&quot;</span>
              {`: `}
              <span className="text-emerald-300">&quot;module&quot;</span>
              {`,
  `}
              <span className="text-blue-300">&quot;scripts&quot;</span>
              {`: {
    `}
              <span className="text-blue-300">&quot;test&quot;</span>
              {`: `}
              <span className="text-emerald-300">&quot;vitest&quot;</span>
              {`
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
