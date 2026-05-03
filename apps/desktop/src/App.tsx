import { useState, useCallback, useEffect, useRef } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import Toolbar from "./components/Toolbar";
import FileTree from "./components/FileTree";
import FileViewer from "./components/FileViewer";
import QuickSearch from "./components/QuickSearch";
import TextSearch from "./components/TextSearch";
import StatusBar from "./components/StatusBar";
import Splitter from "./components/Splitter";
import Toast from "./components/Toast";
import { useFileTree } from "./hooks/useFileTree";
import { useStored } from "./hooks/useStored";
import { useWorkspaceIndex } from "./hooks/useWorkspaceIndex";
import type { FileEntry, CopyPathMode } from "@fpath/shared";

const DEFAULT_EXPANDED_WIDTH = 1200;
const MIN_COMPACT_WIDTH = 360;
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

  const handleTreeResize = useCallback(
    (deltaPx: number) => {
      setTreeWidth((prev) =>
        Math.min(MAX_TREE_WIDTH, Math.max(MIN_TREE_WIDTH, prev + deltaPx))
      );
    },
    [setTreeWidth]
  );

  const resetSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);
  const { nodes: fileTree, loadChildren } = useFileTree(workspacePath);
  const { files: workspaceIndex, scanning: indexScanning } = useWorkspaceIndex(workspacePath);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [openFiles, setOpenFiles] = useState<FileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<FileEntry | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showTextSearch, setShowTextSearch] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleWorkspaceChange = useCallback(
    (path: string) => {
      setWorkspacePath(path);
      setRecent((prev) => [path, ...prev.filter((r) => r !== path)].slice(0, 10));
    },
    [setWorkspacePath, setRecent]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const copySelection = useCallback(
    async (mode: CopyPathMode) => {
      if (selectedFiles.size === 0) {
        showToast("Nothing selected");
        return;
      }
      const paths = [...selectedFiles].sort();
      const text = paths
        .map((p) =>
          mode === "relative" && workspacePath && p.startsWith(workspacePath + "/")
            ? p.slice(workspacePath.length + 1)
            : p
        )
        .join("\n");
      try {
        await writeText(text);
      } catch {
        await navigator.clipboard.writeText(text);
      }
      const noun = paths.length === 1 ? "path" : "paths";
      const preview = paths.length === 1 ? ` — ${text}` : "";
      showToast(`Copied ${paths.length} ${mode} ${noun}${preview}`);
    },
    [selectedFiles, workspacePath, showToast]
  );

  const prevHasFilesRef = useRef<boolean | null>(null);
  useEffect(() => {
    const hasFiles = openFiles.length > 0;
    const prev = prevHasFilesRef.current;
    prevHasFilesRef.current = hasFiles;

    (async () => {
      const win = getCurrentWindow();
      const factor = await win.scaleFactor();
      const inner = await win.innerSize();
      const currentW = Math.round(inner.width / factor);
      const heightLogical = Math.round(inner.height / factor);
      const compactW = Math.max(MIN_COMPACT_WIDTH, Math.round(expandedWidth / 2));

      if (prev === null) {
        const target = hasFiles ? expandedWidth : compactW;
        if (currentW !== target) {
          await win.setSize(new LogicalSize(target, heightLogical));
        }
      } else if (prev && !hasFiles) {
        if (currentW > MIN_COMPACT_WIDTH * 2) setExpandedWidth(currentW);
        await win.setSize(new LogicalSize(compactW, heightLogical));
      } else if (!prev && hasFiles) {
        await win.setSize(new LogicalSize(expandedWidth, heightLogical));
      }
    })().catch((err) => console.warn("window resize failed", err));
  }, [openFiles.length, expandedWidth, setExpandedWidth]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setShowSearch(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowTextSearch(true);
        return;
      }
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "TEXTAREA") return;
      if (selectedFiles.size === 0) return;
      e.preventDefault();
      copySelection(e.shiftKey ? "absolute" : "relative");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [copySelection, selectedFiles.size]);

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
        onWorkspaceChange={handleWorkspaceChange}
        recent={recent}
        selectedFiles={selectedFiles}
        onCopy={copySelection}
        onResetSelection={resetSelection}
        onSearchOpen={() => setShowSearch(true)}
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
            onFileOpen={handleOpenFile}
            onLoadChildren={loadChildren}
            activeFile={activeFile}
          />
        </div>
        {openFiles.length > 0 && (
          <>
            <Splitter onResize={handleTreeResize} />
            <FileViewer
              openFiles={openFiles}
              activeFile={activeFile}
              onTabSelect={setActiveFile}
              onTabClose={handleCloseTab}
              workspacePath={workspacePath}
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
          onOpenFile={handleOpenFile}
          onClose={() => setShowTextSearch(false)}
        />
      )}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
