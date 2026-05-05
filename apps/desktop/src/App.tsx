import { useCallback, useEffect, useState } from "react";
import Toolbar from "./components/Toolbar";
import FileTree from "./components/FileTree";
import FileViewer from "./components/FileViewer";
import QuickSearch from "./components/QuickSearch";
import TextSearch from "./components/TextSearch";
import StatusBar from "./components/StatusBar";
import Splitter from "./components/Splitter";
import Settings from "./components/Settings";
import Toast from "./components/Toast";
import { loadSearchIgnore } from "@fpath/shared";
import { useFileTree } from "./hooks/useFileTree";
import { useStored } from "./hooks/useStored";
import { useWorkspaceIndex } from "./hooks/useWorkspaceIndex";
import { useWindowAutoSize } from "./hooks/useWindowAutoSize";
import { useCopySelection } from "./hooks/useCopySelection";
import { useGlobalKeybindings } from "./hooks/useGlobalKeybindings";
import { useOpenFiles } from "./hooks/useOpenFiles";
import type { FileEntry } from "@fpath/shared";

const DEFAULT_EXPANDED_WIDTH = 1200;
const DEFAULT_TREE_WIDTH = 320;
const MIN_TREE_WIDTH = 180;
const MAX_TREE_WIDTH = 800;

export default function App() {
  const [workspacePath, setWorkspacePath] = useStored<string | null>(
    "workspacePath",
    null
  );
  const [recent, setRecent] = useStored<string[]>("recentWorkspaces", []);
  const [expandedWidth, setExpandedWidth] = useStored<number>(
    "window.expandedWidth",
    DEFAULT_EXPANDED_WIDTH
  );
  const [treeWidth, setTreeWidth] = useStored<number>(
    "layout.treeWidth",
    DEFAULT_TREE_WIDTH
  );
  const [customIgnorePatterns, setCustomIgnorePatterns] = useStored<string>(
    "settings.customIgnorePatterns",
    ""
  );
  const [searchExtensions, setSearchExtensions] = useStored<string[]>(
    "settings.searchExtensions",
    ["ts", "tsx", "md"]
  );
  const [externalEditor, setExternalEditor] = useStored<string>(
    "settings.externalEditor",
    ""
  );

  const { nodes: fileTree, loadChildren } = useFileTree(workspacePath);
  const { files: workspaceIndex, scanning: indexScanning } =
    useWorkspaceIndex(workspacePath);
  const { openFiles, activeFile, setActiveFile, openFile, closeFile } =
    useOpenFiles();

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [showTextSearch, setShowTextSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadSearchIgnore(customIgnorePatterns);
  }, [customIgnorePatterns]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const handleTreeResize = useCallback(
    (deltaPx: number) => {
      setTreeWidth((prev) =>
        Math.min(MAX_TREE_WIDTH, Math.max(MIN_TREE_WIDTH, prev + deltaPx))
      );
    },
    [setTreeWidth]
  );

  const resetSelection = useCallback(() => setSelectedFiles(new Set()), []);

  const handleWorkspaceChange = useCallback(
    (path: string) => {
      setWorkspacePath(path);
      setRecent((prev) =>
        [path, ...prev.filter((r) => r !== path)].slice(0, 10)
      );
    },
    [setWorkspacePath, setRecent]
  );

  const copySelection = useCopySelection(selectedFiles, workspacePath, showToast);

  useWindowAutoSize(openFiles.length > 0, expandedWidth, setExpandedWidth);

  useGlobalKeybindings({
    selectedCount: selectedFiles.size,
    onOpenQuickSearch: () => setShowSearch(true),
    onOpenTextSearch: () => setShowTextSearch(true),
    onCopy: copySelection,
  });

  const handleSearchSelect = useCallback(
    (file: FileEntry) => {
      setShowSearch(false);
      openFile(file);
    },
    [openFile]
  );

  return (
    <div className="app">
      <Toolbar
        workspacePath={workspacePath}
        onWorkspaceChange={handleWorkspaceChange}
        recent={recent}
        selectedFiles={selectedFiles}
        onCopy={copySelection}
        onResetSelection={resetSelection}
        onSearchOpen={() => setShowSearch(true)}
        onSettingsOpen={() => setShowSettings(true)}
      />
      <div className={`main-panel ${openFiles.length === 0 ? "tree-only" : ""}`}>
        <div
          className="filetree-wrap"
          style={openFiles.length > 0 ? { width: treeWidth } : undefined}
        >
          <FileTree
            nodes={fileTree}
            workspaceIndex={workspaceIndex}
            indexScanning={indexScanning}
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
            onFileOpen={openFile}
            onLoadChildren={loadChildren}
            activeFile={activeFile}
            externalEditor={externalEditor}
            onToast={showToast}
          />
        </div>
        {openFiles.length > 0 && (
          <>
            <Splitter onResize={handleTreeResize} />
            <FileViewer
              openFiles={openFiles}
              activeFile={activeFile}
              onTabSelect={setActiveFile}
              onTabClose={closeFile}
              workspacePath={workspacePath}
              onToast={showToast}
            />
          </>
        )}
      </div>
      <StatusBar
        fileCount={fileTree.length}
        selectedCount={selectedFiles.size}
        workspacePath={workspacePath}
      />
      {showSearch && (
        <QuickSearch
          index={workspaceIndex}
          scanning={indexScanning}
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showTextSearch && (
        <TextSearch
          workspacePath={workspacePath}
          availableExtensions={searchExtensions}
          onOpenFile={openFile}
          onClose={() => setShowTextSearch(false)}
        />
      )}
      {showSettings && (
        <Settings
          customIgnorePatterns={customIgnorePatterns}
          onIgnorePatternsChange={setCustomIgnorePatterns}
          searchExtensions={searchExtensions}
          onSearchExtensionsChange={setSearchExtensions}
          externalEditor={externalEditor}
          onExternalEditorChange={setExternalEditor}
          onClose={() => setShowSettings(false)}
        />
      )}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
