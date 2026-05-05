import type { FileEntry } from "@fpath/shared";

export function fileFixture(
  path: string,
  name = path.split("/").pop() ?? path
): FileEntry {
  return {
    path,
    name,
    relativePath: name,
    kind: "file",
    extension: name.split(".").pop() ?? null,
    isSymlink: false,
  } as FileEntry;
}
