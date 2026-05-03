import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { FileEntry } from "@fpath/shared";
import { useStored } from "../hooks/useStored";

interface TextMatch {
  path: string;
  relativePath: string;
  lineNumber: number;
  lineText: string;
}

interface TextSearchProps {
  workspacePath: string | null;
  availableExtensions: string[];
  onOpenFile: (file: FileEntry) => void;
  onClose: () => void;
}

const DEBOUNCE_MS = 250;
const MAX_RESULTS = 500;

function fileEntryFromMatch(m: TextMatch): FileEntry {
  const name = m.path.split("/").pop() ?? m.path;
  const dot = name.lastIndexOf(".");
  return {
    name,
    path: m.path,
    relativePath: m.relativePath,
    kind: "file",
    extension: dot > 0 ? name.slice(dot + 1) : undefined,
    isSymlink: false,
  };
}

export default function TextSearch({
  workspacePath,
  availableExtensions,
  onOpenFile,
  onClose,
}: TextSearchProps) {
  const [query, setQuery] = useState("");
  const [storedExts, setStoredExts] = useStored<string[]>(
    "textsearch.exts",
    availableExtensions
  );
  const exts = storedExts.filter((e) => availableExtensions.includes(e));
  const setExts = setStoredExts;
  const [results, setResults] = useState<TextMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query, exts]);

  useEffect(() => {
    if (!query.trim() || !workspacePath || exts.length === 0) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }
    const seq = ++seqRef.current;
    setSearching(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const matches = await invoke<TextMatch[]>("search_text", {
          workspacePath,
          query,
          extensions: exts,
          maxResults: MAX_RESULTS,
        });
        if (seq !== seqRef.current) return;
        setResults(matches);
      } catch (err) {
        if (seq !== seqRef.current) return;
        setError(typeof err === "string" ? err : String(err));
      } finally {
        if (seq === seqRef.current) setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, exts, workspacePath]);

  const toggleExt = useCallback(
    (ext: string) => {
      setExts((prev) =>
        prev.includes(ext) ? prev.filter((e) => e !== ext) : [...prev, ext]
      );
    },
    [setExts]
  );

  const openMatch = useCallback(
    (m: TextMatch) => {
      onOpenFile(fileEntryFromMatch(m));
      onClose();
    },
    [onOpenFile, onClose]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIdx]) {
        openMatch(results[selectedIdx]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, results, selectedIdx, openMatch]);

  return (
    <div
      className="textsearch-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="textsearch-panel">
        <div className="textsearch-header">
          <input
            ref={inputRef}
            className="textsearch-input"
            type="text"
            placeholder="Search text in files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="textsearch-exts">
            {availableExtensions.map((ext) => (
              <label key={ext} className="textsearch-ext">
                <input
                  type="checkbox"
                  checked={exts.includes(ext)}
                  onChange={() => toggleExt(ext)}
                />
                .{ext}
              </label>
            ))}
            {availableExtensions.length === 0 && (
              <span className="textsearch-status">
                No extensions configured. Open Settings to add some.
              </span>
            )}
            <span className="textsearch-status">
              {searching
                ? "searching…"
                : error
                  ? `error: ${error}`
                  : results.length === MAX_RESULTS
                    ? `${results.length}+ matches`
                    : `${results.length} matches`}
            </span>
          </div>
        </div>
        <div className="textsearch-results">
          {results.map((m, i) => (
            <div
              key={`${m.path}:${m.lineNumber}`}
              className={`textsearch-result ${i === selectedIdx ? "active" : ""}`}
              onClick={() => openMatch(m)}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <div className="textsearch-result-path">
                {m.relativePath}
                <span className="textsearch-result-line-no">:{m.lineNumber}</span>
              </div>
              <pre className="textsearch-result-line">{m.lineText}</pre>
            </div>
          ))}
          {!searching && query && results.length === 0 && !error && (
            <div className="textsearch-empty">No matches</div>
          )}
        </div>
      </div>
    </div>
  );
}
