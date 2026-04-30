import type { FileEntry } from "@fpath/shared";

interface FileViewerProps {
  openFiles: FileEntry[];
  activeFile: FileEntry | null;
  onTabSelect: (file: FileEntry) => void;
  onTabClose: (file: FileEntry) => void;
  workspacePath: string | null;
}

export default function FileViewer({
  openFiles,
  activeFile,
  onTabSelect,
  onTabClose,
  workspacePath,
}: FileViewerProps) {
  if (openFiles.length === 0) {
    return (
      <div className="viewer">
        <div className="viewer-empty">
          <p>No file open</p>
          <p className="viewer-hint">
            Select a file from the tree or use Cmd+P to search
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer">
      <div className="viewer-tabs">
        {openFiles.map((file) => (
          <div
            key={file.path}
            className={`viewer-tab ${activeFile?.path === file.path ? "active" : ""}`}
            onClick={() => onTabSelect(file)}
          >
            <span className="viewer-tab-name">{file.name}</span>
            <span
              className="viewer-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(file);
              }}
            >
              ×
            </span>
          </div>
        ))}
      </div>
      {activeFile && (
        <>
          <div className="viewer-pathbar">
            {workspacePath
              ? activeFile.path.startsWith(workspacePath)
                ? activeFile.path.slice(workspacePath.length + 1)
                : activeFile.path
              : activeFile.path}
          </div>
          <div className="viewer-content">
            <MonacoViewer file={activeFile} workspacePath={workspacePath} />
          </div>
        </>
      )}
    </div>
  );
}

function MonacoViewer({
  file,
}: {
  file: FileEntry;
  workspacePath: string | null;
}) {
  const ext = file.extension ?? "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    css: "css",
    html: "html",
    rs: "rust",
    go: "go",
    py: "python",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
  };

  const language = langMap[ext] ?? ext;

  return (
    <div className="viewer-monaco">
      <p className="viewer-monaco-placeholder">
        Monaco Editor will render <strong>{file.name}</strong> here
        {" "}(language: {language || "auto-detect"})
      </p>
      <p className="viewer-monaco-hint">
        Full Monaco integration — read Tauri backend section in spec
      </p>
    </div>
  );
}
