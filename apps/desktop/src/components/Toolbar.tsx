import { useMemo, useCallback } from "react";
import type { CopyPathMode } from "@fpath/shared";

interface ToolbarProps {
  workspacePath: string | null;
  onWorkspaceChange: (path: string) => void;
  recent: string[];
  selectedFiles: Set<string>;
  onCopy: (mode: CopyPathMode) => void;
  onSearchOpen: () => void;
}

export default function Toolbar({
  workspacePath,
  onWorkspaceChange,
  recent,
  selectedFiles,
  onCopy,
  onSearchOpen,
}: ToolbarProps) {
  const handleOpenWorkspace = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (selected) onWorkspaceChange(selected as string);
    } catch {
      const path = prompt("Enter workspace path:");
      if (path) onWorkspaceChange(path);
    }
  }, [onWorkspaceChange]);

  const selectionLabel = useMemo(() => {
    const count = selectedFiles.size;
    if (count === 0) return "";
    return `${count} selected`;
  }, [selectedFiles]);

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-label">Workspace:</span>
        <span className="toolbar-path">
          {workspacePath ?? "No workspace open"}
        </span>
        <button className="toolbar-btn" onClick={handleOpenWorkspace}>
          Open
        </button>
        {recent.length > 0 && (
          <select
            className="toolbar-select"
            onChange={(e) => onWorkspaceChange(e.target.value)}
            value=""
          >
            <option value="" disabled>
              Recent...
            </option>
            {recent.map((r) => (
              <option key={r} value={r}>
                {r.split("/").pop()}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={onSearchOpen} title="Quick search (Cmd+P)">
          Search
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onCopy("absolute")}
          disabled={selectedFiles.size === 0}
          title="Copy absolute paths (Shift+Enter)"
        >
          Copy Abs
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onCopy("relative")}
          disabled={selectedFiles.size === 0}
          title="Copy relative paths (Enter)"
        >
          Copy Rel
        </button>
        <span className="toolbar-selection">{selectionLabel}</span>
      </div>
    </div>
  );
}
