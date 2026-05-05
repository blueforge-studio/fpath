import { useEffect, useState } from "react";
import { readDir } from "@tauri-apps/plugin-fs";
import type { FileEntry } from "@fpath/shared";

/**
 * For root-level directories, probe whether each contains a `.git` folder.
 * Used to power the "Repos only" toggle in the file tree header.
 */
export function useRepoProbe(
  nodes: FileEntry[],
  enabled: boolean
): Map<string, boolean> {
  const [repoMap, setRepoMap] = useState<Map<string, boolean>>(() => new Map());

  useEffect(() => {
    if (!enabled) return;
    const toProbe = nodes.filter(
      (n) => n.kind === "directory" && !repoMap.has(n.path)
    );
    if (toProbe.length === 0) return;

    let cancelled = false;
    Promise.all(
      toProbe.map(async (n) => {
        try {
          const entries = await readDir(n.path);
          const isRepo = entries.some(
            (e) => e.name === ".git" && e.isDirectory
          );
          return [n.path, isRepo] as const;
        } catch (err) {
          console.warn(`Repo probe failed for ${n.path}`, err);
          return [n.path, false] as const;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setRepoMap((prev) => {
        const next = new Map(prev);
        for (const [p, v] of results) next.set(p, v);
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, nodes, repoMap]);

  return repoMap;
}
