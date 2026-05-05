import { useCallback, useMemo, useState } from "react";
import type { FileEntry } from "@fpath/shared";
import { applyTreeFilters, flattenTree } from "@fpath/shared";
import { useStored } from "../hooks/useStored";
import ContextMenu from "./ContextMenu";
import { TreeNodeList } from "./filetree/TreeNode";
import { FlatFileList } from "./filetree/FlatFileList";
import { buildContextMenuItems } from "./filetree/menu";
import { useRepoProbe } from "./filetree/useRepoProbe";
import { useFocusFilterShortcut } from "./filetree/useFocusFilterShortcut";

interface FileTreeProps {
  nodes: FileEntry[];
  workspaceIndex: FileEntry[];
  indexScanning: boolean;
  selectedFiles: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onFileOpen: (file: FileEntry) => void;
  onLoadChildren: (dirPath: string) => Promise<void>;
  activeFile: FileEntry | null;
  externalEditor: string;
  onToast?: (msg: string) => void;
}

const FILTER_MAX_RESULTS = 500;

export default function FileTree({
  nodes,
  workspaceIndex,
  indexScanning,
  selectedFiles,
  onSelectionChange,
  onFileOpen,
  onLoadChildren,
  activeFile,
  externalEditor,
  onToast,
}: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["/"]));
  const [filter, setFilter] = useState("");
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(() => new Set());
  const [hideDotfiles, setHideDotfiles] = useStored("filter.hideDotfiles", false);
  const [rootDirsOnly, setRootDirsOnly] = useStored("filter.rootDirsOnly", false);
  const [repoOnly, setRepoOnly] = useStored("filter.repoOnly", false);
  const [contextMenu, setContextMenu] = useState<
    { x: number; y: number; node: FileEntry } | null
  >(null);

  const repoMap = useRepoProbe(nodes, repoOnly);

  const openContextMenu = useCallback((e: React.MouseEvent, node: FileEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const filteredTree = useMemo(
    () =>
      applyTreeFilters(
        nodes,
        { hideDotfiles, rootDirsOnly, repoOnly, repoMap },
        0
      ),
    [nodes, hideDotfiles, rootDirsOnly, repoOnly, repoMap]
  );

  const visibleNodes = useMemo(() => {
    if (!filter) return filteredTree;
    const lower = filter.toLowerCase();
    const source =
      workspaceIndex.length > 0 ? workspaceIndex : flattenTree(filteredTree);
    return source
      .filter(
        (f: FileEntry) =>
          f.kind === "file" &&
          (f.name.toLowerCase().includes(lower) ||
            f.relativePath.toLowerCase().includes(lower))
      )
      .slice(0, FILTER_MAX_RESULTS);
  }, [filteredTree, workspaceIndex, filter]);

  const toggleExpand = useCallback(
    (node: FileEntry) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(node.path)) next.delete(node.path);
        else next.add(node.path);
        return next;
      });
      if (node.kind === "directory" && node.children === undefined) {
        setLoadingPaths((prev) => new Set(prev).add(node.path));
        onLoadChildren(node.path).finally(() => {
          setLoadingPaths((prev) => {
            const next = new Set(prev);
            next.delete(node.path);
            return next;
          });
        });
      }
    },
    [onLoadChildren]
  );

  const toggleSelect = useCallback(
    (path: string) => {
      const next = new Set(selectedFiles);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      onSelectionChange(next);
    },
    [selectedFiles, onSelectionChange]
  );

  useFocusFilterShortcut();

  return (
    <div className="filetree">
      <div className="filetree-header">
        <input
          className="filetree-search"
          type="text"
          placeholder={
            indexScanning
              ? `Filter files (Cmd+F) — indexing ${workspaceIndex.length}…`
              : `Filter files (Cmd+F) — ${workspaceIndex.length} indexed`
          }
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="filetree-toggles">
          <button
            type="button"
            className={`filetree-toggle ${hideDotfiles ? "active" : ""}`}
            onClick={() => setHideDotfiles((v) => !v)}
            title="Hide dot-prefixed entries (.git, .claude, ...)"
          >
            Hide .
          </button>
          <button
            type="button"
            className={`filetree-toggle ${rootDirsOnly ? "active" : ""}`}
            onClick={() => setRootDirsOnly((v) => !v)}
            title="At the root, hide files — show only directories"
          >
            Dirs only
          </button>
          <button
            type="button"
            className={`filetree-toggle ${repoOnly ? "active" : ""}`}
            onClick={() => setRepoOnly((v) => !v)}
            title="At the root, show only directories that contain a .git folder"
          >
            Repos only
          </button>
        </div>
      </div>
      <div className="filetree-body">
        {filter ? (
          <FlatFileList
            nodes={visibleNodes as FileEntry[]}
            selectedFiles={selectedFiles}
            onSelect={toggleSelect}
            onOpen={onFileOpen}
            activeFile={activeFile}
            onContextMenu={openContextMenu}
          />
        ) : (
          <TreeNodeList
            nodes={visibleNodes}
            depth={0}
            expanded={expanded}
            loadingPaths={loadingPaths}
            selectedFiles={selectedFiles}
            activeFile={activeFile}
            onToggleExpand={toggleExpand}
            onToggleSelect={toggleSelect}
            onOpen={onFileOpen}
            onContextMenu={openContextMenu}
          />
        )}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildContextMenuItems(contextMenu.node, {
            externalEditor,
            onFileOpen,
            onToast,
          })}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
