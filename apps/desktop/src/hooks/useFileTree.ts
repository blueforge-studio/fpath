import { useState, useCallback, useEffect } from "react";
import type { FileEntry } from "@fpath/shared";

export function useFileTree(workspacePath: string | null) {
  const [nodes, setNodes] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [flatFileList, setFlatFileList] = useState<FileEntry[]>([]);

  // Placeholder: will connect to Tauri backend to walk directory
  useEffect(() => {
    if (!workspacePath) {
      setNodes([]);
      setFlatFileList([]);
      return;
    }
    setLoading(true);
    // TODO: invoke Tauri command list_directory(workspacePath)
    setNodes([]);
    setFlatFileList([]);
    setLoading(false);
  }, [workspacePath]);

  const refresh = useCallback(() => {
    // Re-trigger the effect
    if (workspacePath) {
      setLoading(true);
      // TODO: invoke Tauri command
      setLoading(false);
    }
  }, [workspacePath]);

  return { nodes, flatFileList, loading, refresh };
}
