import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useUpdater } from "../../hooks/useUpdater";

export default function UpdatesSection() {
  const [version, setVersion] = useState<string>("");
  const { state, checkForUpdates, installUpdate } = useUpdater();

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion("?"));
  }, []);

  return (
    <section className="settings-section">
      <h3>Updates</h3>
      <p className="settings-hint">
        Current version: <code>{version || "loading…"}</code>. Auto-updater
        checks GitHub Releases for new signed builds.
      </p>
      <div className="settings-row">
        {state.kind === "checking" ? (
          <span className="settings-hint">Checking…</span>
        ) : state.kind === "available" ? (
          <>
            <span className="settings-hint">v{state.version} available.</span>
            <button type="button" className="toolbar-btn" onClick={installUpdate}>
              Download &amp; install
            </button>
          </>
        ) : state.kind === "downloading" ? (
          <span className="settings-hint">
            Downloading… {Math.round(state.downloaded / 1024)} KB
            {state.total ? ` / ${Math.round(state.total / 1024)} KB` : ""}
          </span>
        ) : state.kind === "ready" ? (
          <span className="settings-hint">Restarting…</span>
        ) : state.kind === "uptodate" ? (
          <>
            <span className="settings-hint">
              You&rsquo;re on the latest version.
            </span>
            <button
              type="button"
              className="toolbar-btn"
              onClick={checkForUpdates}
            >
              Check again
            </button>
          </>
        ) : state.kind === "error" ? (
          <>
            <span
              className="settings-hint"
              style={{ color: "var(--accent-red)" }}
            >
              {state.message}
            </span>
            <button
              type="button"
              className="toolbar-btn"
              onClick={checkForUpdates}
            >
              Retry
            </button>
          </>
        ) : (
          <button type="button" className="toolbar-btn" onClick={checkForUpdates}>
            Check for updates
          </button>
        )}
      </div>
      {state.kind === "available" && state.notes && (
        <pre className="settings-textarea" style={{ marginTop: 8 }}>
          {state.notes}
        </pre>
      )}
    </section>
  );
}
