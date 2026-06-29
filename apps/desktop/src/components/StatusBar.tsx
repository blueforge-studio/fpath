interface StatusBarProps {
  fileCount: number;
  selectedCount: number;
  workspacePath: string | null;
  gitBranch?: string | null;
}

export default function StatusBar({
  fileCount,
  selectedCount,
  workspacePath,
  gitBranch,
}: StatusBarProps) {
  const shortcuts = [
    "⌘C copy abs",
    "⌘⇧C copy rel",
    "⌘P search",
    "⌘K toggle tree",
    "⌘O open workspace",
  ];

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        {workspacePath ? (
          <>
            {gitBranch && <span className="statusbar-branch">⎇ {gitBranch}</span>}
            <span>{fileCount} files loaded</span>
            {selectedCount > 0 && (
              <span className="statusbar-selected">
                {selectedCount} selected
              </span>
            )}
          </>
        ) : (
          <span>No workspace — ⌘O to open</span>
        )}
      </div>
      <div className="statusbar-right">
        {shortcuts.map((s) => (
          <span key={s} className="statusbar-shortcut">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
