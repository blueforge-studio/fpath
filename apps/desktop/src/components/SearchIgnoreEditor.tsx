import { useState, useEffect, useRef, useCallback } from "react";
import { readSearchIgnore, writeSearchIgnore } from "../bridge";

interface SearchIgnoreEditorProps {
  workspacePath: string;
  onClose: () => void;
}

export default function SearchIgnoreEditor({
  workspacePath,
  onClose,
}: SearchIgnoreEditorProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    readSearchIgnore(workspacePath)
      .then((text) => { setContent(text); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [workspacePath]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await writeSearchIgnore(workspacePath, content);
      setDirty(false);
    } catch (e) {
      setError(String(e));
    }
    setSaving(false);
  }, [workspacePath, content]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (dirty && !confirm("Discard unsaved changes?")) return;
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, handleSave, onClose]);

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { if (!dirty || confirm("Discard unsaved changes?")) onClose(); } }}>
      <div className="modal-panel">
        <div className="modal-header">
          <span className="modal-title">Edit .searchignore</span>
          <span className="modal-close" onClick={onClose}>x</span>
        </div>
        {loading ? (
          <div className="modal-loading">Loading...</div>
        ) : (
          <>
            <div className="modal-hint">
              One pattern per line. Changes apply on next workspace reload.
            </div>
            <textarea
              ref={textareaRef}
              className="searchignore-textarea"
              value={content}
              onChange={(e) => { setContent(e.target.value); setDirty(true); }}
              placeholder={"node_modules\n.git\ndist\n*.log"}
              spellCheck={false}
            />
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-footer">
              <button className="modal-btn" onClick={onClose}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={handleSave} disabled={saving || !dirty}>
                {saving ? "Saving..." : "Save (Cmd+S)"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
