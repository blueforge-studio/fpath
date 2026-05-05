import { invoke } from "@tauri-apps/api/core";
import type { FileEntry } from "@fpath/shared";
import type { ContextMenuItem } from "../ContextMenu";

export const REVEAL_LABEL = (() => {
  const p = navigator.platform.toLowerCase();
  if (p.includes("mac")) return "Reveal in Finder";
  if (p.includes("win")) return "Reveal in Explorer";
  return "Show in file manager";
})();

function asMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return String(err);
}

export interface BuildMenuOptions {
  externalEditor: string;
  onFileOpen: (file: FileEntry) => void;
  onToast?: (msg: string) => void;
}

export function buildContextMenuItems(
  node: FileEntry,
  { externalEditor, onFileOpen, onToast }: BuildMenuOptions
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];
  if (node.kind === "file") {
    items.push({
      label: "Open in viewer",
      onSelect: () => onFileOpen(node),
    });
  }

  items.push({
    label: REVEAL_LABEL,
    onSelect: async () => {
      try {
        await invoke("reveal_in_file_manager", { path: node.path });
      } catch (err) {
        onToast?.(`Reveal failed: ${asMessage(err)}`);
      }
    },
  });

  const editorTrim = externalEditor.trim();
  const editorLabel = editorTrim
    ? `Open in ${editorTrim.split(/\s+/)[0]}`
    : "Open in $EDITOR";
  items.push({
    label: editorLabel,
    onSelect: async () => {
      try {
        await invoke("open_in_editor", {
          path: node.path,
          editorCmd: editorTrim || null,
        });
      } catch (err) {
        onToast?.(`Open in editor failed: ${asMessage(err)}`);
      }
    },
  });

  return items;
}
