import { useEffect, useState } from "react";

interface Props {
  externalEditor: string;
  onChange: (next: string) => void;
}

export default function ExternalEditorSection({
  externalEditor,
  onChange,
}: Props) {
  const [draft, setDraft] = useState(externalEditor);

  useEffect(() => setDraft(externalEditor), [externalEditor]);

  return (
    <section className="settings-section">
      <h3>External editor</h3>
      <p className="settings-hint">
        Command used by &ldquo;Open in editor&rdquo; in the right-click menu.
        Leave blank to use <code>$VISUAL</code> or <code>$EDITOR</code>{" "}
        (falling back to <code>code</code>). The command must be on{" "}
        <code>PATH</code>; arguments are passed before the file path.
      </p>
      <div className="settings-row">
        <input
          type="text"
          className="settings-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. code, cursor, subl -n, zed --wait"
          spellCheck={false}
        />
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(draft)}
          disabled={draft === externalEditor}
        >
          Apply
        </button>
      </div>
    </section>
  );
}
