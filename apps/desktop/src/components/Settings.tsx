import { useCallback, useEffect, useState } from "react";
import { loadSearchIgnore } from "@fpath/shared";
import { check } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";

interface SettingsProps {
  customIgnorePatterns: string;
  onIgnorePatternsChange: (next: string) => void;
  searchExtensions: string[];
  onSearchExtensionsChange: (next: string[]) => void;
  onClose: () => void;
}

const DEFAULT_IGNORE_HINT = `node_modules
.git
dist
.turbo
.next
target
__pycache__
.DS_Store
Thumbs.db
*.log`;

export default function Settings({
  customIgnorePatterns,
  onIgnorePatternsChange,
  searchExtensions,
  onSearchExtensionsChange,
  onClose,
}: SettingsProps) {
  const [draftIgnore, setDraftIgnore] = useState(customIgnorePatterns);
  const [draftExt, setDraftExt] = useState("");
  const [version, setVersion] = useState<string>("");
  const [updateState, setUpdateState] = useState<
    | { kind: "idle" }
    | { kind: "checking" }
    | { kind: "available"; version: string; notes?: string }
    | { kind: "uptodate" }
    | { kind: "downloading"; downloaded: number; total?: number }
    | { kind: "ready" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion("?"));
  }, []);

  useEffect(() => setDraftIgnore(customIgnorePatterns), [customIgnorePatterns]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSaveIgnore = useCallback(() => {
    onIgnorePatternsChange(draftIgnore);
    loadSearchIgnore(draftIgnore);
  }, [draftIgnore, onIgnorePatternsChange]);

  const addExt = useCallback(() => {
    const cleaned = draftExt.trim().replace(/^\./, "").toLowerCase();
    if (!cleaned) return;
    if (searchExtensions.includes(cleaned)) {
      setDraftExt("");
      return;
    }
    onSearchExtensionsChange([...searchExtensions, cleaned]);
    setDraftExt("");
  }, [draftExt, searchExtensions, onSearchExtensionsChange]);

  const removeExt = useCallback(
    (ext: string) => {
      onSearchExtensionsChange(searchExtensions.filter((e) => e !== ext));
    },
    [searchExtensions, onSearchExtensionsChange]
  );

  const checkForUpdates = useCallback(async () => {
    setUpdateState({ kind: "checking" });
    try {
      const update = await check();
      if (!update) {
        setUpdateState({ kind: "uptodate" });
        return;
      }
      setUpdateState({
        kind: "available",
        version: update.version,
        notes: update.body,
      });
    } catch (err) {
      setUpdateState({
        kind: "error",
        message: typeof err === "string" ? err : (err as Error).message ?? String(err),
      });
    }
  }, []);

  const installUpdate = useCallback(async () => {
    try {
      const update = await check();
      if (!update) {
        setUpdateState({ kind: "uptodate" });
        return;
      }
      let downloaded = 0;
      let total: number | undefined;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength;
          setUpdateState({ kind: "downloading", downloaded: 0, total });
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setUpdateState({ kind: "downloading", downloaded, total });
        } else if (event.event === "Finished") {
          setUpdateState({ kind: "ready" });
        }
      });
      await relaunch();
    } catch (err) {
      setUpdateState({
        kind: "error",
        message: typeof err === "string" ? err : (err as Error).message ?? String(err),
      });
    }
  }, []);

  return (
    <div
      className="settings-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            type="button"
            className="settings-close"
            onClick={onClose}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        <section className="settings-section">
          <h3>Ignore patterns</h3>
          <p className="settings-hint">
            Added on top of the built-in defaults ({DEFAULT_IGNORE_HINT.split("\n").length} entries).
            Uses .gitignore syntax. Affects the file tree, workspace index, and text search.
            One pattern per line.
          </p>
          <textarea
            className="settings-textarea"
            rows={8}
            value={draftIgnore}
            onChange={(e) => setDraftIgnore(e.target.value)}
            placeholder={"# Examples\n*.bak\nvendor/\nbuild-artifacts/"}
            spellCheck={false}
          />
          <div className="settings-row">
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleSaveIgnore}
              disabled={draftIgnore === customIgnorePatterns}
            >
              Apply ignore patterns
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h3>Text search extensions</h3>
          <p className="settings-hint">
            File extensions offered as toggles in Cmd+Shift+F. Add or remove freely.
          </p>
          <div className="settings-chips">
            {searchExtensions.map((ext) => (
              <span key={ext} className="settings-chip">
                .{ext}
                <button
                  type="button"
                  className="settings-chip-x"
                  onClick={() => removeExt(ext)}
                  title={`Remove .${ext}`}
                >
                  ×
                </button>
              </span>
            ))}
            {searchExtensions.length === 0 && (
              <span className="settings-hint">(none — text search will be disabled)</span>
            )}
          </div>
          <div className="settings-row">
            <input
              type="text"
              className="settings-input"
              value={draftExt}
              onChange={(e) => setDraftExt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExt();
                }
              }}
              placeholder="Add extension (e.g. rs)"
            />
            <button
              type="button"
              className="toolbar-btn"
              onClick={addExt}
              disabled={!draftExt.trim()}
            >
              Add
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h3>Updates</h3>
          <p className="settings-hint">
            Current version: <code>{version || "loading…"}</code>. Auto-updater
            checks GitHub Releases for new signed builds.
          </p>
          <div className="settings-row">
            {updateState.kind === "checking" ? (
              <span className="settings-hint">Checking…</span>
            ) : updateState.kind === "available" ? (
              <>
                <span className="settings-hint">
                  v{updateState.version} available.
                </span>
                <button type="button" className="toolbar-btn" onClick={installUpdate}>
                  Download & install
                </button>
              </>
            ) : updateState.kind === "downloading" ? (
              <span className="settings-hint">
                Downloading… {Math.round(updateState.downloaded / 1024)} KB
                {updateState.total
                  ? ` / ${Math.round(updateState.total / 1024)} KB`
                  : ""}
              </span>
            ) : updateState.kind === "ready" ? (
              <span className="settings-hint">Restarting…</span>
            ) : updateState.kind === "uptodate" ? (
              <>
                <span className="settings-hint">You&rsquo;re on the latest version.</span>
                <button type="button" className="toolbar-btn" onClick={checkForUpdates}>
                  Check again
                </button>
              </>
            ) : updateState.kind === "error" ? (
              <>
                <span className="settings-hint" style={{ color: "var(--accent-red)" }}>
                  {updateState.message}
                </span>
                <button type="button" className="toolbar-btn" onClick={checkForUpdates}>
                  Retry
                </button>
              </>
            ) : (
              <button type="button" className="toolbar-btn" onClick={checkForUpdates}>
                Check for updates
              </button>
            )}
          </div>
          {updateState.kind === "available" && updateState.notes && (
            <pre className="settings-textarea" style={{ marginTop: 8 }}>
              {updateState.notes}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}
