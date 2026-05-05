import { useEffect } from "react";
import type { CopyPathMode } from "@fpath/shared";

interface Bindings {
  selectedCount: number;
  onOpenQuickSearch: () => void;
  onOpenTextSearch: () => void;
  onCopy: (mode: CopyPathMode) => void;
}

export function useGlobalKeybindings({
  selectedCount,
  onOpenQuickSearch,
  onOpenTextSearch,
  onCopy,
}: Bindings): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "p") {
        e.preventDefault();
        onOpenQuickSearch();
        return;
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onOpenTextSearch();
        return;
      }
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "TEXTAREA") return;
      if (selectedCount === 0) return;
      e.preventDefault();
      onCopy(e.shiftKey ? "absolute" : "relative");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedCount, onOpenQuickSearch, onOpenTextSearch, onCopy]);
}
