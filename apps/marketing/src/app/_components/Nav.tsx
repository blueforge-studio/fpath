export default function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
      <a href="/" className="text-lg font-semibold tracking-tight">
        fpath
      </a>
      <div className="flex items-center gap-6 text-sm text-zinc-400">
        <a href="#features" className="hover:text-zinc-100 transition-colors">
          Features
        </a>
        <a href="#mcp" className="hover:text-zinc-100 transition-colors">
          MCP
        </a>
        <a href="#install" className="hover:text-zinc-100 transition-colors">
          Install
        </a>
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
