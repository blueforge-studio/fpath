import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  readTextFile,
  watch,
  type UnwatchFn,
} from "@tauri-apps/plugin-fs";
import { ask } from "@tauri-apps/plugin-dialog";
import type { FileState } from "./useFileEditorStates";
import { maybeTruncate } from "./lang-map";

const SUPPRESS_AFTER_SAVE_MS = 1500;

interface Options {
  watchedPaths: readonly string[];
  fileStatesRef: React.MutableRefObject<Record<string, FileState>>;
  lastSaveAtRef: React.MutableRefObject<Map<string, number>>;
  applyExternalReload: (path: string, content: string, truncated: boolean) => void;
  onToast?: (msg: string) => void;
}

export function useFileWatchers({
  watchedPaths,
  fileStatesRef,
  lastSaveAtRef,
  applyExternalReload,
  onToast,
}: Options): void {
  const watchersRef = useRef<Map<string, UnwatchFn | null>>(new Map());
  const externalChangePendingRef = useRef<Set<string>>(new Set());

  const handleExternalChange = useCallback(
    async (path: string) => {
      const lastSave = lastSaveAtRef.current.get(path) ?? 0;
      if (Date.now() - lastSave < SUPPRESS_AFTER_SAVE_MS) return;

      if (externalChangePendingRef.current.has(path)) return;
      externalChangePendingRef.current.add(path);

      const fileName = path.split("/").pop() ?? path;
      try {
        let fresh: string;
        try {
          fresh = await readTextFile(path);
        } catch {
          onToast?.(`${fileName} no longer readable on disk`);
          return;
        }

        const cur = fileStatesRef.current[path];
        if (!cur || !cur.loaded) return;

        const { final: freshFinal, truncated } = maybeTruncate(fresh);
        if (freshFinal === cur.original) return;

        const isDirty = cur.content !== cur.original;
        if (!isDirty) {
          applyExternalReload(path, freshFinal, truncated);
          onToast?.(`Reloaded ${fileName} (changed on disk)`);
          return;
        }

        const reload = await ask(
          `${fileName} changed on disk. Reload and discard your unsaved changes?`,
          {
            title: "File changed on disk",
            kind: "warning",
            okLabel: "Reload",
            cancelLabel: "Keep mine",
          }
        );
        if (reload) applyExternalReload(path, freshFinal, truncated);
      } finally {
        externalChangePendingRef.current.delete(path);
      }
    },
    [applyExternalReload, fileStatesRef, lastSaveAtRef, onToast]
  );

  const handleExternalChangeRef = useRef(handleExternalChange);
  handleExternalChangeRef.current = handleExternalChange;

  const watchedKey = useMemo(() => watchedPaths.join(" "), [watchedPaths]);

  useEffect(() => {
    const desired = new Set(watchedPaths);
    const watchers = watchersRef.current;

    for (const [path, unwatch] of watchers) {
      if (!desired.has(path)) {
        try {
          unwatch?.();
        } catch (err) {
          console.warn("unwatch failed", path, err);
        }
        watchers.delete(path);
      }
    }

    for (const path of desired) {
      if (watchers.has(path)) continue;
      watchers.set(path, null);
      watch(
        path,
        () => {
          if (!watchers.has(path)) return;
          void handleExternalChangeRef.current(path);
        },
        { delayMs: 200 }
      )
        .then((fn) => {
          if (!watchers.has(path)) {
            try {
              fn();
            } catch {
              /* noop */
            }
            return;
          }
          watchers.set(path, fn);
        })
        .catch((err) => {
          console.warn("watch failed", path, err);
          watchers.delete(path);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedKey]);

  useEffect(() => {
    const watchers = watchersRef.current;
    return () => {
      for (const unwatch of watchers.values()) {
        try {
          unwatch?.();
        } catch {
          /* noop */
        }
      }
      watchers.clear();
    };
  }, []);
}
