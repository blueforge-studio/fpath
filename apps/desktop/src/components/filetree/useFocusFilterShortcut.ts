import { useEffect } from "react";

/**
 * Focus the .filetree-search input when the user presses Cmd/Ctrl+F.
 */
export function useFocusFilterShortcut(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        const input =
          document.querySelector<HTMLInputElement>(".filetree-search");
        input?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
