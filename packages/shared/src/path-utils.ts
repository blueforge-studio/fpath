import type { CopyPathMode } from "./types";

export function getRelativePath(
  absolutePath: string,
  workspaceRoot: string
): string {
  const root = workspaceRoot.endsWith("/")
    ? workspaceRoot
    : workspaceRoot + "/";
  if (absolutePath.startsWith(root)) {
    return absolutePath.slice(root.length);
  }
  return absolutePath;
}

export function getAbsolutePath(
  relativePath: string,
  workspaceRoot: string
): string {
  if (relativePath.startsWith("/")) return relativePath;
  const root = workspaceRoot.endsWith("/")
    ? workspaceRoot
    : workspaceRoot + "/";
  return root + relativePath;
}

export function formatPathsForClipboard(
  paths: string[],
  mode: CopyPathMode,
  workspaceRoot: string
): string {
  return paths
    .map((p) =>
      mode === "relative" ? getRelativePath(p, workspaceRoot) : p
    )
    .join("\n");
}
