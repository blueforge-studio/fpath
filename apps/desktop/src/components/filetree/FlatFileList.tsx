import type { FileEntry } from "@fpath/shared";

interface Props {
  nodes: FileEntry[];
  selectedFiles: Set<string>;
  onSelect: (path: string) => void;
  onOpen: (file: FileEntry) => void;
  activeFile: FileEntry | null;
  onContextMenu: (e: React.MouseEvent, node: FileEntry) => void;
}

export function FlatFileList({
  nodes,
  selectedFiles,
  onSelect,
  onOpen,
  activeFile,
  onContextMenu,
}: Props) {
  return (
    <>
      {nodes.map((node) => (
        <div
          key={node.path}
          className={`treenode ${
            selectedFiles.has(node.path) ? "selected" : ""
          } ${activeFile?.path === node.path ? "active" : ""}`}
          style={{ paddingLeft: 20 }}
          onClick={() => onOpen(node)}
          onContextMenu={(e) => onContextMenu(e, node)}
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
