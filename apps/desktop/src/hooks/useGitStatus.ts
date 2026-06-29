import { useState, useEffect, useRef } from "react";
import type { GitInfo } from "../bridge";
import { getGitInfo } from "../bridge";

export function useGitStatus(workspacePath: string | null) {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!workspacePath) {
      setGitInfo(null);
      return;
    }

    const fetch = () => {
      getGitInfo(workspacePath)
        .then(setGitInfo)
        .catch(() => setGitInfo(null));
    };

    fetch();
    timerRef.current = setInterval(fetch, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [workspacePath]);

  return gitInfo;
}
