import { useState, useCallback } from "react";
import Toolbar from "./components/Toolbar";
import FileTree from "./components/FileTree";
import FileViewer from "./components/FileViewer";
import QuickSearch from "./components/QuickSearch";
import StatusBar from "./components/StatusBar";
import type { FileEntry } from "@fpath/shared";

export default function App() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [openFiles, setOpenFiles] = useState<FileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<FileEntry | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const handleOpenFile = useCallback(
    (file: FileEntry) => {
      if (!openFiles.find((f) => f.path === file.path)) {
        setOpenFiles((prev) => [...prev, file]);
      }
      setActiveFile(file);
    },
    [openFiles]
  );

  const handleCloseTab = useCallback(
    (file: FileEntry) => {
      setOpenFiles((prev) => prev.filter((f) => f.path !== file.path));
      if (activeFile?.path === file.path) {
        const idx = openFiles.findIndex((f) => f.path === file.path);
        setActiveFile(openFiles[idx - 1] ?? openFiles[idx + 1] ?? null);
      }
    },
    [activeFile, openFiles]
  );

  const handleSearchSelect = useCallback(
    (file: FileEntry) => {
      setShowSearch(false);
      handleOpenFile(file);
    },
    [handleOpenFile]
  );

  return (
    <div className="app">
      <Toolbar
        workspacePath={workspacePath}
        onWorkspaceChange={setWorkspacePath}
        fileTree={fileTree}
        onFileTreeLoad={setFileTree}
        selectedFiles={selectedFiles}
        onSearchOpen={() => setShowSearch(true)}
      />
      <div className="main-panel">
        <FileTree
          nodes={fileTree}
          selectedFiles={selectedFiles}
          onSelectionChange={setSelectedFiles}
          onFileOpen={handleOpenFile}
          activeFile={activeFile}
        />
        <FileViewer
          openFiles={openFiles}
          activeFile={activeFile}
          onTabSelect={setActiveFile}
          onTabClose={handleCloseTab}
          workspacePath={workspacePath}
        />
      </div>
      <StatusBar
        fileCount={fileTree.length}
        selectedCount={selectedFiles.size}
        workspacePath={workspacePath}
      />
      {showSearch && (
        <QuickSearch
          fileTree={fileTree}
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
