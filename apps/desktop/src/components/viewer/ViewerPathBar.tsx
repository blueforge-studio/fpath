import type { FileEntry } from "@fpath/shared";
import type { FileState } from "./useFileEditorStates";

interface Props {
  activeFile: FileEntry;
  workspacePath: string | null;
  state: FileState | undefined;
  isDirty: boolean;
}

export default function ViewerPathBar({
  activeFile,
  workspacePath,
  state,
  isDirty,
}: Props) {
  const display =
    workspacePath && activeFile.path.startsWith(workspacePath)
      ? activeFile.path.slice(workspacePath.length + 1)
      : activeFile.path;

  return (
    <div className="viewer-pathbar">
      {display}
      {state?.truncated && (
        <span className="viewer-pathbar-badge"> read-only · truncated</span>
      )}
      {state?.loaded && !state.truncated && isDirty && (
        <span className="viewer-pathbar-badge"> • modified</span>
      )}
    </div>
  );
}
