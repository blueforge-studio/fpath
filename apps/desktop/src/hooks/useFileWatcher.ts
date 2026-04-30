import { useEffect, useRef, useCallback } from "react";

interface WatchOptions {
  workspacePath: string | null;
  onChange: () => void;
  debounceMs?: number;
}

export function useFileWatcher({ workspacePath, onChange, debounceMs = 300 }: WatchOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debouncedChange = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChangeRef.current(), debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    if (!workspacePath) return;

    let unmatch: (() => void) | undefined;

    import("@tauri-apps/plugin-fs")
      .then(({ watchImmediate }) => {
        watchImmediate(workspacePath, debouncedChange, { recursive: true })
          .then((fn) => { unmatch = fn; })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (unmatch) unmatch();
    };
  }, [workspacePath, debouncedChange]);
}
