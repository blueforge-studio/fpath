import { useEffect } from "react";
import type { FileEntry } from "@fpath/shared";

interface Options {
  openFiles: FileEntry[];
  activeFile: FileEntry | null;
  onTabSelect: (file: FileEntry) => void;
  onRequestClose: (file: FileEntry) => void;
  onSave: () => void;
}

/**
 * Window-level shortcuts for the viewer:
 *   Cmd/Ctrl+S         save active tab
 *   Cmd/Ctrl+W         close active tab (with dirty guard)
 *   Cmd/Ctrl+1..8      jump to tab N
 *   Cmd/Ctrl+9         jump to last tab (VS Code convention)
 *   Cmd/Ctrl+Shift+[   previous tab (cyclical)
 *   Cmd/Ctrl+Shift+]   next tab (cyclical)
 */
export function useTabKeybindings({
  openFiles,
  activeFile,
  onTabSelect,
  onRequestClose,
  onSave,
}: Options): void {
  useEffect(() => {
    const cycle = (delta: number) => {
      if (openFiles.length === 0) return;
      const cur = activeFile
        ? openFiles.findIndex((f) => f.path === activeFile.path)
        : -1;
      const idx =
        cur === -1
          ? 0
          : (cur + delta + openFiles.length) % openFiles.length;
      onTabSelect(openFiles[idx]);
    };

    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      // Save
      if (!e.shiftKey && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
        return;
      }

      // Close active tab
      if (!e.shiftKey && !e.altKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (activeFile) onRequestClose(activeFile);
        return;
      }

      // Tab N (1-9). 9 jumps to last (matches VS Code).
      if (!e.shiftKey && !e.altKey && /^[1-9]$/.test(e.key)) {
        if (openFiles.length === 0) return;
        e.preventDefault();
        const n = parseInt(e.key, 10);
        const target =
          n === 9 ? openFiles[openFiles.length - 1] : openFiles[n - 1];
        if (target) onTabSelect(target);
        return;
      }

      // Prev / next tab via code so layout-agnostic
      if (e.shiftKey && !e.altKey && e.code === "BracketLeft") {
        e.preventDefault();
        cycle(-1);
        return;
      }
      if (e.shiftKey && !e.altKey && e.code === "BracketRight") {
        e.preventDefault();
        cycle(1);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openFiles, activeFile, onTabSelect, onRequestClose, onSave]);
}
