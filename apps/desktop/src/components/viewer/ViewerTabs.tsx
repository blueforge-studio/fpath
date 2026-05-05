import type { FileEntry } from "@fpath/shared";

interface Props {
  openFiles: FileEntry[];
  activeFile: FileEntry | null;
  dirtyPaths: Set<string>;
  onTabSelect: (file: FileEntry) => void;
  onTabClose: (file: FileEntry) => void;
}

export default function ViewerTabs({
  openFiles,
  activeFile,
  dirtyPaths,
  onTabSelect,
  onTabClose,
}: Props) {
  return (
    <div className="viewer-tabs">
      {openFiles.map((file) => {
        const isDirty = dirtyPaths.has(file.path);
        const isActive = activeFile?.path === file.path;
        return (
          <div
            key={file.path}
            className={`viewer-tab ${isActive ? "active" : ""} ${isDirty ? "dirty" : ""}`}
            onClick={() => onTabSelect(file)}
            title={file.path}
          >
            <span className="viewer-tab-name">{file.name}</span>
            <span
              className="viewer-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(file);
              }}
              aria-label={isDirty ? "Close (unsaved)" : "Close"}
            >
              {isDirty ? "●" : "×"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
