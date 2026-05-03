import { useCallback, useEffect, useRef, useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStored } from "./hooks/useStored";
import { useWorkspaceIndex } from "./hooks/useWorkspaceIndex";
import type { FileEntry } from "@fpath/shared";

const MAX_RESULTS = 30;

export default function Popup() {
  const [workspacePath] = useStored<string | null>("workspacePath", null);
  const [active, setActive] = useState(false);
  const { files, scanning } = useWorkspaceIndex(active ? workspacePath : null);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const win = getCurrentWindow();
    win.isVisible().then((v) => v && setActive(true));
    const unlistenPromise = win.onFocusChanged(({ payload: focused }) => {
      if (focused) setActive(true);
    });
    return () => {
      unlistenPromise.then((fn) => fn()).catch(() => {});
    };
  }, []);

  const results = (() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return files
      .filter(
        (f) =>
          f.name.toLowerCase().includes(lower) ||
          f.relativePath.toLowerCase().includes(lower)
      )
      .slice(0, MAX_RESULTS);
  })();

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const hide = useCallback(async () => {
    try {
      await getCurrentWindow().hide();
    } catch (err) {
      console.warn("popup hide failed", err);
    }
  }, []);

  const copy = useCallback(
    async (file: FileEntry, mode: "absolute" | "relative") => {
      const text =
        mode === "relative" && workspacePath && file.path.startsWith(workspacePath + "/")
          ? file.path.slice(workspacePath.length + 1)
          : file.path;
      try {
        await writeText(text);
      } catch {
        await navigator.clipboard.writeText(text);
      }
      setQuery("");
      await hide();
    },
    [workspacePath, hide]
  );

  useEffect(() => {
    const focusOnShow = () => inputRef.current?.focus();
    focusOnShow();
    const win = getCurrentWindow();
    const unlistenPromise = win.onFocusChanged(({ payload: focused }) => {
      if (focused) focusOnShow();
    });
    return () => {
      unlistenPromise.then((fn) => fn()).catch(() => {});
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        hide();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIdx]) {
        e.preventDefault();
        copy(results[selectedIdx], e.shiftKey ? "absolute" : "relative");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [results, selectedIdx, copy, hide]);

  return (
    <div className="popup">
      <div className="popup-input-row" data-tauri-drag-region>
        <input
          ref={inputRef}
          className="popup-input"
          type="text"
          placeholder={
            workspacePath
              ? scanning
                ? `Search files… (indexing ${files.length})`
                : `Search files… (${files.length} indexed)`
              : "No workspace — open one in the main window first"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!workspacePath}
        />
      </div>
      {results.length > 0 && (
        <div className="popup-results">
          {results.map((file, i) => (
            <div
              key={file.path}
              className={`popup-result ${i === selectedIdx ? "active" : ""}`}
              onClick={() => copy(file, "relative")}
              onMouseEnter={() => setSelectedIdx(i)}
              title="Enter: copy relative · Shift+Enter: copy absolute"
            >
              <span className="popup-result-name">{file.name}</span>
              <span className="popup-result-path">{file.relativePath}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
