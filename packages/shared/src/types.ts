export interface FileEntry {
  name: string;
  path: string;
  relativePath: string;
  kind: "file" | "directory";
  extension?: string;
  isSymlink: boolean;
  children?: FileEntry[];
}

export interface WorkspaceConfig {
  rootPath: string;
  name: string;
}

export interface SelectionState {
  selectedPaths: Set<string>;
  lastClickedPath: string | null;
}

export interface QuickSearchResult {
  file: FileEntry;
  score: number;
  matchIndices: number[];
}

export type CopyPathMode = "absolute" | "relative";
