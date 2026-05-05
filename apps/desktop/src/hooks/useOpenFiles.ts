import { useCallback, useState } from "react";
import type { FileEntry } from "@fpath/shared";

export interface UseOpenFilesResult {
  openFiles: FileEntry[];
  activeFile: FileEntry | null;
  setActiveFile: (file: FileEntry | null) => void;
  openFile: (file: FileEntry) => void;
  closeFile: (file: FileEntry) => void;
}

export function useOpenFiles(): UseOpenFilesResult {
  const [openFiles, setOpenFiles] = useState<FileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<FileEntry | null>(null);

  const openFile = useCallback((file: FileEntry) => {
    setOpenFiles((prev) =>
      prev.some((f) => f.path === file.path) ? prev : [...prev, file]
    );
    setActiveFile(file);
  }, []);

  const closeFile = useCallback(
    (file: FileEntry) => {
      setOpenFiles((prev) => {
        const idx = prev.findIndex((f) => f.path === file.path);
        if (idx === -1) return prev;
        const next = prev.filter((f) => f.path !== file.path);
        if (activeFile?.path === file.path) {
          setActiveFile(prev[idx - 1] ?? prev[idx + 1] ?? null);
        }
        return next;
      });
    },
    [activeFile]
  );

  return { openFiles, activeFile, setActiveFile, openFile, closeFile };
}
