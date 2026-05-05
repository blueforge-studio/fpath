import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { FileEntry } from "@fpath/shared";
import { asMessage, maybeTruncate } from "./lang-map";

export interface FileState {
  content: string;
  original: string;
  loaded: boolean;
  error: string | null;
  truncated: boolean;
}

export interface FileEditorStates {
  fileStates: Record<string, FileState>;
  fileStatesRef: React.MutableRefObject<Record<string, FileState>>;
  lastSaveAtRef: React.MutableRefObject<Map<string, number>>;
  dirtyPaths: Set<string>;
  setContent: (path: string, value: string) => void;
  applyExternalReload: (path: string, content: string, truncated: boolean) => void;
  saveActive: () => Promise<void>;
}

interface Options {
  openFiles: FileEntry[];
  activeFile: FileEntry | null;
  onToast?: (msg: string) => void;
}

export function useFileEditorStates({
  openFiles,
  activeFile,
  onToast,
}: Options): FileEditorStates {
  const [fileStates, setFileStates] = useState<Record<string, FileState>>({});
  const fileStatesRef = useRef(fileStates);
  fileStatesRef.current = fileStates;
  const lastSaveAtRef = useRef<Map<string, number>>(new Map());

  // Load active file content if not yet loaded
  useEffect(() => {
    if (!activeFile) return;
    if (fileStates[activeFile.path]?.loaded) return;
    if (fileStates[activeFile.path]?.error) return;
    let cancelled = false;
    const path = activeFile.path;
    readTextFile(path)
      .then((text) => {
        if (cancelled) return;
        const { final, truncated } = maybeTruncate(text);
        setFileStates((prev) => ({
          ...prev,
          [path]: {
            content: final,
            original: final,
            loaded: true,
            error: null,
            truncated,
          },
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        setFileStates((prev) => ({
          ...prev,
          [path]: {
            content: "",
            original: "",
            loaded: false,
            error: asMessage(err),
            truncated: false,
          },
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [activeFile, fileStates]);

  // Drop state for files no longer open
  useEffect(() => {
    setFileStates((prev) => {
      const open = new Set(openFiles.map((f) => f.path));
      const next: Record<string, FileState> = {};
      let changed = false;
      for (const k of Object.keys(prev)) {
        if (open.has(k)) next[k] = prev[k];
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [openFiles]);

  const dirtyPaths = useMemo(() => {
    const set = new Set<string>();
    for (const [path, state] of Object.entries(fileStates)) {
      if (state.loaded && !state.truncated && state.content !== state.original) {
        set.add(path);
      }
    }
    return set;
  }, [fileStates]);

  const setContent = useCallback((path: string, value: string) => {
    setFileStates((prev) => {
      const cur = prev[path];
      if (!cur) return prev;
      return { ...prev, [path]: { ...cur, content: value } };
    });
  }, []);

  const applyExternalReload = useCallback(
    (path: string, content: string, truncated: boolean) => {
      setFileStates((prev) => {
        const c = prev[path];
        if (!c) return prev;
        return {
          ...prev,
          [path]: {
            content,
            original: content,
            loaded: true,
            error: null,
            truncated,
          },
        };
      });
    },
    []
  );

  const saveActive = useCallback(async () => {
    if (!activeFile) return;
    const state = fileStates[activeFile.path];
    if (!state || !state.loaded) return;
    if (state.truncated) {
      onToast?.("File too large — read-only");
      return;
    }
    if (state.content === state.original) return;
    try {
      await writeTextFile(activeFile.path, state.content);
      lastSaveAtRef.current.set(activeFile.path, Date.now());
      setFileStates((prev) => {
        const cur = prev[activeFile.path];
        if (!cur) return prev;
        return {
          ...prev,
          [activeFile.path]: { ...cur, original: cur.content },
        };
      });
      onToast?.(`Saved ${activeFile.name}`);
    } catch (err) {
      onToast?.(`Save failed: ${asMessage(err)}`);
    }
  }, [activeFile, fileStates, onToast]);

  return {
    fileStates,
    fileStatesRef,
    lastSaveAtRef,
    dirtyPaths,
    setContent,
    applyExternalReload,
    saveActive,
  };
}
