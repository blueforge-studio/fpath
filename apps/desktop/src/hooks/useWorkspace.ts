import { useState, useCallback } from "react";

export function useWorkspace() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([]);

  const changeWorkspace = useCallback((path: string) => {
    setWorkspacePath(path);
    setRecentWorkspaces((prev) =>
      [path, ...prev.filter((p) => p !== path)].slice(0, 10)
    );
  }, []);

  return {
    workspacePath,
    recentWorkspaces,
    changeWorkspace,
  };
}
