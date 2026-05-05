import { useCallback } from "react";
import type { FileEntry } from "@fpath/shared";

export interface TreeNodeListProps {
  nodes: FileEntry[];
  depth: number;
  expanded: Set<string>;
  loadingPaths: Set<string>;
  selectedFiles: Set<string>;
  activeFile: FileEntry | null;
  onToggleExpand: (node: FileEntry) => void;
  onToggleSelect: (path: string) => void;
  onOpen: (file: FileEntry) => void;
  onContextMenu: (e: React.MouseEvent, node: FileEntry) => void;
}

export function TreeNodeList(props: TreeNodeListProps) {
  const { nodes, depth, expanded, loadingPaths, selectedFiles, activeFile } =
    props;
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
  const { onToggleExpand, onToggleSelect, onOpen, onContextMenu } = listProps;
  const paddingLeft = 8 + depth * 16;
  const isDir = node.kind === "directory";
  const icon = isDir ? "📁" : "📄";

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => onContextMenu(e, node),
    [onContextMenu, node]
  );

  const expandGlyph = isDir ? (isLoading ? "⋯" : isExpanded ? "▼" : "▶") : "";

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
