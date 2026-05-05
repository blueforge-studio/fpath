import { useState } from "react";

interface Props {
  searchExtensions: string[];
  onChange: (next: string[]) => void;
}

export default function SearchExtensionsSection({
  searchExtensions,
  onChange,
}: Props) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const cleaned = draft.trim().replace(/^\./, "").toLowerCase();
    if (!cleaned) return;
    if (searchExtensions.includes(cleaned)) {
      setDraft("");
      return;
    }
    onChange([...searchExtensions, cleaned]);
    setDraft("");
  };

  const remove = (ext: string) => {
    onChange(searchExtensions.filter((e) => e !== ext));
  };

  return (
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
              onClick={() => remove(ext)}
              title={`Remove .${ext}`}
            >
              ×
            </button>
          </span>
        ))}
        {searchExtensions.length === 0 && (
          <span className="settings-hint">
            (none — text search will be disabled)
          </span>
        )}
      </div>
      <div className="settings-row">
        <input
          type="text"
          className="settings-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add extension (e.g. rs)"
        />
        <button
          type="button"
          className="toolbar-btn"
          onClick={add}
          disabled={!draft.trim()}
        >
          Add
        </button>
      </div>
    </section>
  );
}
