import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export const DEFAULT_IGNORE = new Set([
  "node_modules",
  ".git",
  ".claude",
  "target",
  "dist",
  ".turbo",
  ".next",
  "__pycache__",
  "build",
  "out",
  ".vercel",
  ".cache",
  ".DS_Store",
]);

export interface WalkEntry {
  path: string;
  relativePath: string;
  isDir: boolean;
  size: number;
}

export interface WalkOptions {
  extensions?: string[];
  maxResults?: number;
  filesOnly?: boolean;
  includeIgnored?: boolean;
}

export async function walk(
  root: string,
  options: WalkOptions = {}
): Promise<WalkEntry[]> {
  const out: WalkEntry[] = [];
  const max = options.maxResults ?? 5000;
  const exts = options.extensions?.map((e) => e.replace(/^\./, "").toLowerCase());
  const includeIgnored = options.includeIgnored ?? false;

  async function recur(dir: string): Promise<void> {
    if (out.length >= max) return;
    let entries: import("node:fs").Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= max) return;
      if (!includeIgnored && DEFAULT_IGNORE.has(e.name)) continue;
      const full = join(dir, e.name);

      if (e.isSymbolicLink()) continue;

      if (e.isDirectory()) {
        if (!options.filesOnly) {
          out.push({
            path: full,
            relativePath: relative(root, full),
            isDir: true,
            size: 0,
          });
        }
        await recur(full);
        continue;
      }

      if (!e.isFile()) continue;

      if (exts && exts.length > 0) {
        const dot = e.name.lastIndexOf(".");
        const ext = dot >= 0 ? e.name.slice(dot + 1).toLowerCase() : "";
        if (!exts.includes(ext)) continue;
      }

      let size = 0;
      try {
        size = (await stat(full)).size;
      } catch {
        // ignore
      }
      out.push({
        path: full,
        relativePath: relative(root, full),
        isDir: false,
        size,
      });
    }
  }

  await recur(root);
  return out;
}
