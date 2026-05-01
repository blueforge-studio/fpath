import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import FileTree from "./components/FileTree";
import { useGitStatus } from "./hooks/useGitStatus";
import { useFileWatcher } from "./hooks/useFileWatcher";
import { listDirectory, readSearchIgnore } from "./bridge";
import { loadSearchIgnore, updateNodeChildren } from "@fpath/shared";
import type { FileEntry } from "@fpath/shared";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

export default function PopupApp() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const selectedFilesRef = useRef(selectedFiles);
  selectedFilesRef.current = selectedFiles;

  const loadWorkspace = useCallback(async (wsPath: string) => {
    setWorkspacePath(wsPath);
    try {
      const [root, ignoreContent] = await Promise.all([
        listDirectory(wsPath, wsPath),
        readSearchIgnore(wsPath).catch(() => ""),
      ]);
      if (ignoreContent) {
        loadSearchIgnore(ignoreContent);
      }
      setFileTree(root);
    } catch (e) {
      console.error("Failed to load popup workspace:", e);
      setFileTree([]);
    }
  }, []);

  // Listen for popup-opened event from Rust backend
  useEffect(() => {
    const unlisten = listen<string | null>("popup-opened", (event) => {
      const path = event.payload;
      if (path) {
        loadWorkspace(path);
      }
    });
    return () => { unlisten.then((fn) => fn()).catch(() => {}); };
  }, [loadWorkspace]);

  // Auto-focus FileTree search input when tree loads
  useEffect(() => {
    if (fileTree.length > 0) {
      const timer = setTimeout(() => {
        document.querySelector<HTMLInputElement>(".filetree-search")?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return;
  }, [fileTree]);

  // Hide on blur — dismiss popup when user clicks outside
  useEffect(() => {
    const window = getCurrentWindow();
    const unlisten = window.onFocusChanged(({ payload: focused }) => {
      if (!focused) {
        window.hide();
      }
    });
    return () => { unlisten.then((fn) => fn()).catch(() => {}); };
  }, []);

  // Global key handlers for copy-all and dismiss
  useEffect(() => {
    const handleKey = async (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd+Enter: copy all checked paths and dismiss
      if (mod && e.key === "Enter") {
        e.preventDefault();
        if (selectedFilesRef.current.size > 0) {
          const paths = Array.from(selectedFilesRef.current).join("\n");
          try {
            const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
            await writeText(paths);
          } catch {
            await navigator.clipboard.writeText(paths);
          }
          getCurrentWindow().hide();
        }
        return;
      }

      // Escape: dismiss popup
      if (e.key === "Escape") {
        e.preventDefault();
        getCurrentWindow().hide();
        return;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleToggleDirectory = useCallback(
    async (path: string) => {
      if (!workspacePath) return;
      try {
        const children = await listDirectory(path, workspacePath);
        setFileTree((prev) => updateNodeChildren(prev, path, children));
      } catch (e) {
        console.error("Failed to load directory:", e);
      }
    },
    [workspacePath]
  );

  const handleFileOpen = useCallback(
    async (file: FileEntry) => {
      try {
        const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
        await writeText(file.path);
      } catch {
        await navigator.clipboard.writeText(file.path);
      }
      getCurrentWindow().hide();
    },
    []
  );

  const refreshWorkspace = useCallback(async () => {
    if (!workspacePath) return;
    try {
      const [root, ignoreContent] = await Promise.all([
        listDirectory(workspacePath, workspacePath),
        readSearchIgnore(workspacePath).catch(() => ""),
      ]);
      if (ignoreContent) {
        loadSearchIgnore(ignoreContent);
      }
      setFileTree(root);
    } catch (e) {
      console.error("Failed to refresh popup workspace:", e);
    }
  }, [workspacePath]);

  useFileWatcher({ workspacePath, onChange: refreshWorkspace, debounceMs: 300 });

  const gitInfo = useGitStatus(workspacePath);

  const gitStatusMap = useMemo(() => {
    if (!gitInfo) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const s of gitInfo.statuses) {
      map.set(s.path, s.status);
      map.set(s.relativePath, s.status);
    }
    return map;
  }, [gitInfo]);

  const fileCount = useMemo(() => {
    let count = 0;
    const walk = (nodes: FileEntry[]) => {
      for (const n of nodes) {
        count++;
        if (n.kind === "directory" && n.children) walk(n.children);
      }
    };
    walk(fileTree);
    return count;
  }, [fileTree]);

  return (
    <div className="popup-app">
      <div className="popup-tree">
        {workspacePath ? (
          <FileTree
            nodes={fileTree}
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
            onFileOpen={handleFileOpen}
            onDirectoryToggle={handleToggleDirectory}
            activeFile={null}
            gitStatusMap={gitStatusMap}
          />
        ) : (
          <div className="popup-placeholder">
            <span>No workspace</span>
          </div>
        )}
      </div>
      <div className="popup-footer">
        <span className="popup-footer-item">
          {gitInfo?.branch ? `⎇ ${gitInfo.branch}` : "---"}
        </span>
        <span className="popup-footer-item">{fileCount} files</span>
        {selectedFiles.size > 0 && (
          <span className="popup-footer-item popup-footer-selected">
            {selectedFiles.size} selected
          </span>
        )}
      </div>
    </div>
  );
}
