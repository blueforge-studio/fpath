import { useCallback, useMemo } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import type { FileEntry } from "@fpath/shared";
import { useFileEditorStates } from "./viewer/useFileEditorStates";
import { useFileWatchers } from "./viewer/useFileWatchers";
import { useTabKeybindings } from "./viewer/useTabKeybindings";
import ViewerTabs from "./viewer/ViewerTabs";
import ViewerPathBar from "./viewer/ViewerPathBar";
import MonacoPane from "./viewer/MonacoPane";

interface FileViewerProps {
  openFiles: FileEntry[];
  activeFile: FileEntry | null;
  onTabSelect: (file: FileEntry) => void;
  onTabClose: (file: FileEntry) => void;
  workspacePath: string | null;
  onToast?: (msg: string) => void;
}

export default function FileViewer({
  openFiles,
  activeFile,
  onTabSelect,
  onTabClose,
  workspacePath,
  onToast,
}: FileViewerProps) {
  const {
    fileStates,
    fileStatesRef,
    lastSaveAtRef,
    dirtyPaths,
    setContent,
    applyExternalReload,
    saveActive,
  } = useFileEditorStates({ openFiles, activeFile, onToast });

  const watchedPaths = useMemo(
    () => openFiles.map((f) => f.path),
    [openFiles]
  );

  useFileWatchers({
    watchedPaths,
    fileStatesRef,
    lastSaveAtRef,
    applyExternalReload,
    onToast,
  });

  const requestClose = useCallback(
    async (file: FileEntry) => {
      if (dirtyPaths.has(file.path)) {
        const ok = await ask(
          `${file.name} has unsaved changes. Discard them?`,
          {
            title: "Unsaved changes",
            kind: "warning",
            okLabel: "Discard",
            cancelLabel: "Cancel",
          }
        );
        if (!ok) return;
      }
      onTabClose(file);
    },
    [dirtyPaths, onTabClose]
  );

  useTabKeybindings({
    openFiles,
    activeFile,
    onTabSelect,
    onRequestClose: (file) => void requestClose(file),
    onSave: () => void saveActive(),
  });

  const activeState = activeFile ? fileStates[activeFile.path] : undefined;

  return (
    <div className="viewer">
      <ViewerTabs
        openFiles={openFiles}
        activeFile={activeFile}
        dirtyPaths={dirtyPaths}
        onTabSelect={onTabSelect}
        onTabClose={requestClose}
      />
      {activeFile && (
        <>
          <ViewerPathBar
            activeFile={activeFile}
            workspacePath={workspacePath}
            state={activeState}
            isDirty={dirtyPaths.has(activeFile.path)}
          />
          <div className="viewer-content">
            <MonacoPane
              activeFile={activeFile}
              state={activeState}
              onChange={setContent}
            />
          </div>
        </>
      )}
    </div>
  );
}
