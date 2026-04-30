import { invoke } from "@tauri-apps/api/core";
import type { FileEntry } from "@fpath/shared";

export async function listDirectory(
  dirPath: string,
  workspaceRoot: string
): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_directory", {
    dirPath,
    workspaceRoot,
  });
}

export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { filePath: path });
}

export async function listAllFiles(
  workspaceRoot: string
): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_all_files", {
    workspaceRoot,
  });
}

export async function readSearchIgnore(
  workspaceRoot: string
): Promise<string> {
  return invoke<string>("read_search_ignore", {
    workspaceRoot,
  });
}

export async function revealInFinder(path: string): Promise<void> {
  return invoke<void>("reveal_in_finder", { path });
}

export async function openInDefaultApp(path: string): Promise<void> {
  return invoke<void>("open_in_default_app", { path });
}
