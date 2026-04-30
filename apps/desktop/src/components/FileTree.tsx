import { useState, useMemo, useCallback, useEffect } from "react";
import type { FileEntry } from "@fpath/shared";
import { flattenTree } from "@fpath/shared";

interface FileTreeProps {
  nodes: FileEntry[];
  selectedFiles: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onFileOpen: (file: FileEntry) => void;
  activeFile: FileEntry | null;
}

export default function FileTree({
  nodes,
  selectedFiles,
  onSelectionChange,
  onFileOpen,
  activeFile,
}: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["/"]));
  const [filter, setFilter] = useState("");

  const visibleNodes = useMemo(() => {
    if (!filter) return nodes;
    // When filtering, show only matching files (no tree structure)
    return flattenTree(nodes).filter(
      (f: FileEntry) =>
        f.kind === "file" && f.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [nodes, filter]);

  const toggleExpand = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

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
          placeholder="Filter files (Cmd+F)"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
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

function TreeNodeList({
  nodes,
  depth,
  expanded,
  selectedFiles,
  activeFile,
  onToggleExpand,
  onToggleSelect,
  onOpen,
}: {
  nodes: FileEntry[];
  depth: number;
  expanded: Set<string>;
  selectedFiles: Set<string>;
  activeFile: FileEntry | null;
  onToggleExpand: (path: string) => void;
  onToggleSelect: (path: string) => void;
  onOpen: (file: FileEntry) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={depth}
          isExpanded={expanded.has(node.path)}
          isSelected={selectedFiles.has(node.path)}
          isActive={activeFile?.path === node.path}
          selectedFiles={selectedFiles}
          activeFile={activeFile}
          onToggleExpand={onToggleExpand}
          onToggleSelect={onToggleSelect}
          onOpen={onOpen}
        />
      ))}
    </>
  );
}

function TreeNode({
  node,
  depth,
  isExpanded,
  isSelected,
  isActive,
  selectedFiles,
  activeFile,
  onToggleExpand,
  onToggleSelect,
  onOpen,
}: {
  node: FileEntry;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  isActive: boolean;
  selectedFiles: Set<string>;
  activeFile: FileEntry | null;
  onToggleExpand: (path: string) => void;
  onToggleSelect: (path: string) => void;
  onOpen: (file: FileEntry) => void;
}) {
  const paddingLeft = 8 + depth * 16;
  const isDir = node.kind === "directory";
  const icon = isDir ? "📁" : "📄";

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Context menu will be added in a follow-up
    },
    []
  );

  return (
    <>
      <div
        className={`treenode ${isSelected ? "selected" : ""} ${isActive ? "active" : ""}`}
        style={{ paddingLeft }}
        onClick={() => {
          if (isDir) onToggleExpand(node.path);
          else onOpen(node);
        }}
        onContextMenu={handleContextMenu}
      >
        <span className="treenode-expand">
          {isDir ? (isExpanded ? "▼" : "▶") : ""}
        </span>
        <input
          type="checkbox"
          checked={isSelected}
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
        <TreeNodeList
          nodes={node.children}
          depth={depth + 1}
          expanded={new Set()}
          selectedFiles={selectedFiles}
          activeFile={activeFile}
          onToggleExpand={onToggleExpand}
          onToggleSelect={onToggleSelect}
          onOpen={onOpen}
        />
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
