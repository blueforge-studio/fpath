import { useState, useMemo, useCallback } from "react";
import type { FileEntry } from "@fpath/shared";

interface ToolbarProps {
  workspacePath: string | null;
  onWorkspaceChange: (path: string) => void;
  fileTree: FileEntry[];
  onFileTreeLoad: (tree: FileEntry[]) => void;
  selectedFiles: Set<string>;
  onSearchOpen: () => void;
}

export default function Toolbar({
  workspacePath,
  onWorkspaceChange,
  selectedFiles,
  onSearchOpen,
}: ToolbarProps) {
  const [recent, setRecent] = useState<string[]>([]);

  const handleCopy = useCallback(
    async (mode: "absolute" | "relative") => {
      const paths = [...selectedFiles];
      if (paths.length === 0) return;
      const text = paths
        .map((p) =>
          mode === "relative" && workspacePath
            ? p.startsWith(workspacePath)
              ? p.slice(workspacePath.length + 1)
              : p
            : p
        )
        .join("\n");
      await navigator.clipboard.writeText(text);
    },
    [selectedFiles, workspacePath]
  );

  const handleOpenWorkspace = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });
      if (selected) {
        onWorkspaceChange(selected as string);
        setRecent((prev) =>
          [selected as string, ...prev.filter((r) => r !== selected)].slice(0, 10)
        );
      }
    } catch {
      // Fallback for browser dev: prompt for path
      const path = prompt("Enter workspace path:");
      if (path) {
        onWorkspaceChange(path);
        setRecent((prev) =>
          [path, ...prev.filter((r) => r !== path)].slice(0, 10)
        );
      }
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
          onClick={() => handleCopy("absolute")}
          disabled={selectedFiles.size === 0}
        >
          Copy Abs
        </button>
        <button
          className="toolbar-btn"
          onClick={() => handleCopy("relative")}
          disabled={selectedFiles.size === 0}
        >
          Copy Rel
        </button>
        <span className="toolbar-selection">{selectionLabel}</span>
      </div>
    </div>
  );
}
