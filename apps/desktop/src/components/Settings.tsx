import { useEffect } from "react";
import IgnorePatternsSection from "./settings/IgnorePatternsSection";
import SearchExtensionsSection from "./settings/SearchExtensionsSection";
import ExternalEditorSection from "./settings/ExternalEditorSection";
import UpdatesSection from "./settings/UpdatesSection";

interface SettingsProps {
  customIgnorePatterns: string;
  onIgnorePatternsChange: (next: string) => void;
  searchExtensions: string[];
  onSearchExtensionsChange: (next: string[]) => void;
  externalEditor: string;
  onExternalEditorChange: (next: string) => void;
  onClose: () => void;
}

export default function Settings({
  customIgnorePatterns,
  onIgnorePatternsChange,
  searchExtensions,
  onSearchExtensionsChange,
  externalEditor,
  onExternalEditorChange,
  onClose,
}: SettingsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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

        <IgnorePatternsSection
          customIgnorePatterns={customIgnorePatterns}
          onChange={onIgnorePatternsChange}
        />
        <SearchExtensionsSection
          searchExtensions={searchExtensions}
          onChange={onSearchExtensionsChange}
        />
        <ExternalEditorSection
          externalEditor={externalEditor}
          onChange={onExternalEditorChange}
        />
        <UpdatesSection />
      </div>
    </div>
  );
}
