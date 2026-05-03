import { useCallback, useEffect, useState } from "react";
import { readDir } from "@tauri-apps/plugin-fs";
import { shouldIgnoreSync, sortTree } from "@fpath/shared";
import type { FileEntry } from "@fpath/shared";

function joinPath(parent: string, name: string): string {
  return parent.endsWith("/") ? parent + name : `${parent}/${name}`;
}

async function listDir(absPath: string, workspaceRoot: string): Promise<FileEntry[]> {
  let entries;
  try {
    entries = await readDir(absPath);
  } catch (err) {
    console.warn(`readDir failed for ${absPath}`, err);
    return [];
  }
  const mapped: FileEntry[] = [];
  for (const e of entries) {
    if (shouldIgnoreSync(e.name)) continue;
    const full = joinPath(absPath, e.name);
    const rel =
      full === workspaceRoot
        ? ""
        : full.startsWith(workspaceRoot + "/")
          ? full.slice(workspaceRoot.length + 1)
          : full;
    const kind: FileEntry["kind"] = e.isDirectory ? "directory" : "file";
    const dotIdx = e.name.lastIndexOf(".");
    mapped.push({
      name: e.name,
      path: full,
      relativePath: rel,
      kind,
      extension: kind === "file" && dotIdx > 0 ? e.name.slice(dotIdx + 1) : undefined,
      isSymlink: e.isSymlink,
    });
  }
  return sortTree(mapped);
}

function patchChildren(
  nodes: FileEntry[],
  targetPath: string,
  children: FileEntry[]
): FileEntry[] {
  return nodes.map((node) => {
    if (node.path === targetPath) return { ...node, children };
    if (node.children) {
      return { ...node, children: patchChildren(node.children, targetPath, children) };
    }
    return node;
  });
}

export function useFileTree(workspacePath: string | null) {
  const [nodes, setNodes] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspacePath) {
      setNodes([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listDir(workspacePath, workspacePath).then((top) => {
      if (cancelled) return;
      setNodes(top);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [workspacePath]);

  const loadChildren = useCallback(
    async (dirPath: string) => {
      if (!workspacePath) return;
      const children = await listDir(dirPath, workspacePath);
      setNodes((prev) => patchChildren(prev, dirPath, children));
    },
    [workspacePath]
  );

  const refresh = useCallback(async () => {
    if (!workspacePath) return;
    setLoading(true);
    const top = await listDir(workspacePath, workspacePath);
    setNodes(top);
    setLoading(false);
  }, [workspacePath]);

  return { nodes, loading, loadChildren, refresh };
}
