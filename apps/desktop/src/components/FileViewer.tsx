import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { readTextFile } from "@tauri-apps/plugin-fs";
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

const LANG_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  css: "css",
  scss: "scss",
  html: "html",
  rs: "rust",
  go: "go",
  py: "python",
  rb: "ruby",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  cs: "csharp",
  yaml: "yaml",
  yml: "yaml",
  toml: "ini",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  dockerfile: "dockerfile",
  xml: "xml",
  svg: "xml",
};

const MAX_BYTES = 2_000_000;

function MonacoViewer({ file }: { file: FileEntry; workspacePath: string | null }) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent("");
    readTextFile(file.path)
      .then((text) => {
        if (cancelled) return;
        if (text.length > MAX_BYTES) {
          setContent(
            text.slice(0, MAX_BYTES) +
              `\n\n— truncated at ${MAX_BYTES.toLocaleString()} chars —`
          );
        } else {
          setContent(text);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(typeof err === "string" ? err : (err?.message ?? String(err)));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file.path]);

  const ext = (file.extension ?? "").toLowerCase();
  const language = LANG_MAP[ext] ?? "plaintext";

  if (error) {
    return (
      <div className="viewer-monaco-message viewer-monaco-error">
        Failed to read file: {error}
      </div>
    );
  }
  if (loading) {
    return <div className="viewer-monaco-message">Loading {file.name}…</div>;
  }

  return (
    <Editor
      height="100%"
      language={language}
      value={content}
      theme="vs-dark"
      path={file.path}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        wordWrap: "on",
        renderWhitespace: "selection",
        smoothScrolling: true,
        automaticLayout: true,
      }}
    />
  );
}
