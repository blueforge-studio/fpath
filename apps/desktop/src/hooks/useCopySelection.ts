import { useCallback } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import type { CopyPathMode } from "@fpath/shared";

export function useCopySelection(
  selectedFiles: Set<string>,
  workspacePath: string | null,
  showToast: (msg: string) => void
) {
  return useCallback(
    async (mode: CopyPathMode) => {
      if (selectedFiles.size === 0) {
        showToast("Nothing selected");
        return;
      }
      const paths = [...selectedFiles].sort();
      const text = paths
        .map((p) =>
          mode === "relative" && workspacePath && p.startsWith(workspacePath + "/")
            ? p.slice(workspacePath.length + 1)
            : p
        )
        .join("\n");
      try {
        await writeText(text);
      } catch {
        await navigator.clipboard.writeText(text);
      }
      const noun = paths.length === 1 ? "path" : "paths";
      const preview = paths.length === 1 ? ` — ${text}` : "";
      showToast(`Copied ${paths.length} ${mode} ${noun}${preview}`);
    },
    [selectedFiles, workspacePath, showToast]
  );
}
