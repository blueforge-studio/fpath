import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

const MIN_COMPACT_WIDTH = 360;

/**
 * When the viewer transitions between empty (tree-only) and non-empty,
 * grow/shrink the window. Saves the user's last "expanded" width when
 * collapsing, and restores it when expanding again.
 */
export function useWindowAutoSize(
  hasOpenFiles: boolean,
  expandedWidth: number,
  setExpandedWidth: (next: number | ((prev: number) => number)) => void
): void {
  const prevHasFilesRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prev = prevHasFilesRef.current;
    prevHasFilesRef.current = hasOpenFiles;

    (async () => {
      const win = getCurrentWindow();
      const factor = await win.scaleFactor();
      const inner = await win.innerSize();
      const currentW = Math.round(inner.width / factor);
      const heightLogical = Math.round(inner.height / factor);
      const compactW = Math.max(MIN_COMPACT_WIDTH, Math.round(expandedWidth / 2));

      if (prev === null) {
        const target = hasOpenFiles ? expandedWidth : compactW;
        if (currentW !== target) {
          await win.setSize(new LogicalSize(target, heightLogical));
        }
      } else if (prev && !hasOpenFiles) {
        if (currentW > MIN_COMPACT_WIDTH * 2) setExpandedWidth(currentW);
        await win.setSize(new LogicalSize(compactW, heightLogical));
      } else if (!prev && hasOpenFiles) {
        await win.setSize(new LogicalSize(expandedWidth, heightLogical));
      }
    })().catch((err) => console.warn("window resize failed", err));
  }, [hasOpenFiles, expandedWidth, setExpandedWidth]);
}
