import type { FileEntry } from "./types";

export function flattenTree(nodes: FileEntry[]): FileEntry[] {
  const result: FileEntry[] = [];
  const walk = (items: FileEntry[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children) walk(item.children);
    }
  };
  walk(nodes);
  return result;
}

export function filterTree(
  nodes: FileEntry[],
  query: string
): FileEntry[] {
  const lower = query.toLowerCase();
  const flat = flattenTree(nodes);
  return flat.filter(
    (f) =>
      f.kind === "file" && f.name.toLowerCase().includes(lower)
  );
}

export function sortTree(nodes: FileEntry[]): FileEntry[] {
  return [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function findNodeByPath(
  nodes: FileEntry[],
  targetPath: string
): FileEntry | null {
  const flat = flattenTree(nodes);
  return flat.find((n) => n.path === targetPath) ?? null;
}

export function getParentPaths(filePath: string): string[] {
  const parts = filePath.split("/");
  const parents: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join("/"));
  }
  return parents;
}
