import Editor from "@monaco-editor/react";
import type { FileEntry } from "@fpath/shared";
import type { FileState } from "./useFileEditorStates";
import { languageForExtension } from "./lang-map";

interface Props {
  activeFile: FileEntry;
  state: FileState | undefined;
  onChange: (path: string, value: string) => void;
}

export default function MonacoPane({ activeFile, state, onChange }: Props) {
  if (state?.error) {
    return (
      <div className="viewer-monaco-message viewer-monaco-error">
        Failed to read file: {state.error}
      </div>
    );
  }
  if (!state?.loaded) {
    return (
      <div className="viewer-monaco-message">Loading {activeFile.name}…</div>
    );
  }

  return (
    <Editor
      height="100%"
      language={languageForExtension(activeFile.extension)}
      value={state.content}
      onChange={(value) => onChange(activeFile.path, value ?? "")}
      theme="vs-dark"
      path={activeFile.path}
      options={{
        readOnly: state.truncated,
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
