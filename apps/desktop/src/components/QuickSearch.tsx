import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { FileEntry } from "@fpath/shared";

interface QuickSearchProps {
  index: FileEntry[];
  scanning: boolean;
  onSelect: (file: FileEntry) => void;
  onClose: () => void;
}

const MAX_RESULTS = 100;

export default function QuickSearch({
  index,
  scanning,
  onSelect,
  onClose,
}: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return index
      .filter(
        (f: FileEntry) =>
          f.name.toLowerCase().includes(lower) ||
          f.relativePath.toLowerCase().includes(lower)
      )
      .slice(0, MAX_RESULTS);
  }, [index, query]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        onSelect(results[selectedIdx]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, results, selectedIdx, onSelect]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div className="quicksearch-backdrop" onClick={handleBackdrop}>
      <div className="quicksearch-panel">
        <input
          ref={inputRef}
          className="quicksearch-input"
          type="text"
          placeholder={
            scanning
              ? `Search files by name… (indexing ${index.length} so far)`
              : `Search files by name… (${index.length} indexed)`
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="quicksearch-results">
          {results.map((file: FileEntry, i: number) => (
            <div
              key={file.path}
              className={`quicksearch-result ${i === selectedIdx ? "active" : ""}`}
              onClick={() => onSelect(file)}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span className="quicksearch-result-icon">📄</span>
              <span className="quicksearch-result-name">{file.name}</span>
              <span className="quicksearch-result-path">
                {file.relativePath}
              </span>
            </div>
          ))}
          {query && results.length === 0 && (
            <div className="quicksearch-empty">No files found</div>
          )}
        </div>
      </div>
    </div>
  );
}
