import { useState, useMemo, useCallback, useEffect } from "react";
import { readDir } from "@tauri-apps/plugin-fs";
import type { FileEntry } from "@fpath/shared";
import { flattenTree, applyTreeFilters } from "@fpath/shared";
import { useStored } from "../hooks/useStored";

interface FileTreeProps {
  nodes: FileEntry[];
  workspaceIndex: FileEntry[];
  indexScanning: boolean;
  selectedFiles: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onFileOpen: (file: FileEntry) => void;
  onLoadChildren: (dirPath: string) => Promise<void>;
  activeFile: FileEntry | null;
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
}: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["/"]));
  const [filter, setFilter] = useState("");
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(() => new Set());
  const [hideDotfiles, setHideDotfiles] = useStored("filter.hideDotfiles", false);
  const [rootDirsOnly, setRootDirsOnly] = useStored("filter.rootDirsOnly", false);
  const [repoOnly, setRepoOnly] = useStored("filter.repoOnly", false);
  const [repoMap, setRepoMap] = useState<Map<string, boolean>>(() => new Map());

  useEffect(() => {
    if (!repoOnly) return;
    const toProbe = nodes.filter(
      (n) => n.kind === "directory" && !repoMap.has(n.path)
    );
    if (toProbe.length === 0) return;
    let cancelled = false;
    Promise.all(
      toProbe.map(async (n) => {
        try {
          const entries = await readDir(n.path);
          const isRepo = entries.some((e) => e.name === ".git" && e.isDirectory);
          return [n.path, isRepo] as const;
        } catch (err) {
          console.warn(`Repo probe failed for ${n.path}`, err);
          return [n.path, false] as const;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setRepoMap((prev) => {
        const next = new Map(prev);
        for (const [p, v] of results) next.set(p, v);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [repoOnly, nodes, repoMap]);

  const filteredTree = useMemo(
    () => applyTreeFilters(nodes, { hideDotfiles, rootDirsOnly, repoOnly, repoMap }, 0),
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(".filetree-search");
        input?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
          />
        )}
      </div>
    </div>
  );
}

interface TreeNodeListProps {
  nodes: FileEntry[];
  depth: number;
  expanded: Set<string>;
  loadingPaths: Set<string>;
  selectedFiles: Set<string>;
  activeFile: FileEntry | null;
  onToggleExpand: (node: FileEntry) => void;
  onToggleSelect: (path: string) => void;
  onOpen: (file: FileEntry) => void;
}

function TreeNodeList(props: TreeNodeListProps) {
  const { nodes, depth, expanded, loadingPaths, selectedFiles, activeFile } = props;
  return (
    <>
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={depth}
          isExpanded={expanded.has(node.path)}
          isLoading={loadingPaths.has(node.path)}
          isSelected={selectedFiles.has(node.path)}
          isActive={activeFile?.path === node.path}
          listProps={props}
        />
      ))}
    </>
  );
}

function TreeNode({
  node,
  depth,
  isExpanded,
  isLoading,
  isSelected,
  isActive,
  listProps,
}: {
  node: FileEntry;
  depth: number;
  isExpanded: boolean;
  isLoading: boolean;
  isSelected: boolean;
  isActive: boolean;
  listProps: TreeNodeListProps;
}) {
  const { onToggleExpand, onToggleSelect, onOpen } = listProps;
  const paddingLeft = 8 + depth * 16;
  const isDir = node.kind === "directory";
  const icon = isDir ? "📁" : "📄";

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const expandGlyph = isDir
    ? isLoading
      ? "⋯"
      : isExpanded
        ? "▼"
        : "▶"
    : "";

  return (
    <>
      <div
        className={`treenode ${isSelected ? "selected" : ""} ${isActive ? "active" : ""}`}
        style={{ paddingLeft }}
        onClick={(e) => {
          if (e.shiftKey) {
            onToggleSelect(node.path);
            return;
          }
          if (isDir) onToggleExpand(node);
          else onOpen(node);
        }}
        onContextMenu={handleContextMenu}
      >
        <span className="treenode-expand">{expandGlyph}</span>
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(node.path);
          }}
          className="treenode-checkbox"
        />
        <span className="treenode-icon">{icon}</span>
        <span className="treenode-name">{node.name}</span>
      </div>
      {isDir && isExpanded && node.children && (
        <TreeNodeList {...listProps} nodes={node.children} depth={depth + 1} />
      )}
    </>
  );
}

function FlatFileList({
  nodes,
  selectedFiles,
  onSelect,
  onOpen,
  activeFile,
}: {
  nodes: FileEntry[];
  selectedFiles: Set<string>;
  onSelect: (path: string) => void;
  onOpen: (file: FileEntry) => void;
  activeFile: FileEntry | null;
}) {
  return (
    <>
      {nodes.map((node) => (
        <div
          key={node.path}
          className={`treenode ${selectedFiles.has(node.path) ? "selected" : ""} ${activeFile?.path === node.path ? "active" : ""}`}
          style={{ paddingLeft: 20 }}
          onClick={() => onOpen(node)}
        >
          <input
            type="checkbox"
            checked={selectedFiles.has(node.path)}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(node.path);
            }}
            className="treenode-checkbox"
          />
          <span className="treenode-icon">📄</span>
          <span className="treenode-name">{node.name}</span>
        </div>
      ))}
    </>
  );
}

