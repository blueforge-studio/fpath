import { useEffect, useState } from "react";
import { readDir } from "@tauri-apps/plugin-fs";
import { shouldIgnoreSync } from "@fpath/shared";
import type { FileEntry } from "@fpath/shared";

const FLUSH_INTERVAL_MS = 250;
const MAX_FILES = 200_000;

export function useWorkspaceIndex(workspacePath: string | null) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!workspacePath) {
      setFiles([]);
      setScanning(false);
      return;
    }
    let cancelled = false;
    setScanning(true);
    setFiles([]);

    const collected: FileEntry[] = [];
    const queue: string[] = [workspacePath];
    let lastFlush = Date.now();

    (async () => {
      while (queue.length > 0 && !cancelled) {
        if (collected.length >= MAX_FILES) break;
        const dir = queue.shift()!;
        let entries;
        try {
          entries = await readDir(dir);
        } catch {
          continue;
        }
        for (const e of entries) {
          if (shouldIgnoreSync(e.name)) continue;
          if (e.isSymlink) continue;
          const full = `${dir}/${e.name}`;
          if (e.isDirectory) {
            queue.push(full);
            continue;
          }
          const rel = full.startsWith(workspacePath + "/")
            ? full.slice(workspacePath.length + 1)
            : full;
          const dot = e.name.lastIndexOf(".");
          collected.push({
            name: e.name,
            path: full,
            relativePath: rel,
            kind: "file",
            extension: dot > 0 ? e.name.slice(dot + 1) : undefined,
            isSymlink: false,
          });
        }
        if (Date.now() - lastFlush > FLUSH_INTERVAL_MS) {
          setFiles([...collected]);
          lastFlush = Date.now();
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      if (!cancelled) {
        setFiles([...collected]);
        setScanning(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspacePath]);

  return { files, scanning };
}
