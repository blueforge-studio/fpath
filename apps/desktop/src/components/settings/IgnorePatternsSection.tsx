import { useEffect, useState } from "react";
import { loadSearchIgnore } from "@fpath/shared";

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

interface Props {
  customIgnorePatterns: string;
  onChange: (next: string) => void;
}

export default function IgnorePatternsSection({
  customIgnorePatterns,
  onChange,
}: Props) {
  const [draft, setDraft] = useState(customIgnorePatterns);

  useEffect(() => setDraft(customIgnorePatterns), [customIgnorePatterns]);

  const apply = () => {
    onChange(draft);
    loadSearchIgnore(draft);
  };

  return (
    <section className="settings-section">
      <h3>Ignore patterns</h3>
      <p className="settings-hint">
        Added on top of the built-in defaults (
        {DEFAULT_IGNORE_HINT.split("\n").length} entries). Uses .gitignore
        syntax. Affects the file tree, workspace index, and text search. One
        pattern per line.
      </p>
      <textarea
        className="settings-textarea"
        rows={8}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={"# Examples\n*.bak\nvendor/\nbuild-artifacts/"}
        spellCheck={false}
      />
      <div className="settings-row">
        <button
          type="button"
          className="toolbar-btn"
          onClick={apply}
          disabled={draft === customIgnorePatterns}
        >
          Apply ignore patterns
        </button>
      </div>
    </section>
  );
}
