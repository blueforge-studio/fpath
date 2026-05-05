import { vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFileWatchers } from "./useFileWatchers";
import type { FileState } from "./useFileEditorStates";

export interface WatchHandle {
  fire: () => void;
  unwatch: ReturnType<typeof vi.fn>;
}

export const handles = new Map<string, WatchHandle>();

/**
 * Wire up the `watch` mock so each call records a `WatchHandle` whose `fire()`
 * synchronously invokes the registered callback.
 *
 * Call this from `beforeEach` *after* the mock module has been registered with
 * `vi.mock("@tauri-apps/plugin-fs", ...)` at file scope.
 */
export function installWatchMock(
  mockedWatch: ReturnType<typeof vi.mocked<typeof import("@tauri-apps/plugin-fs").watch>>
) {
  handles.clear();
  mockedWatch.mockReset();
  mockedWatch.mockImplementation((paths, cb) => {
    const first = Array.isArray(paths) ? paths[0] : paths;
    const path = typeof first === "string" ? first : first.toString();
    const unwatch = vi.fn();
    handles.set(path, {
      fire: () => (cb as () => void)(),
      unwatch,
    });
    return Promise.resolve(unwatch);
  });
}

export function loadedState(content: string, original = content): FileState {
  return {
    content,
    original,
    loaded: true,
    error: null,
    truncated: false,
  };
}

export interface SetupOpts {
  paths: string[];
  states: Record<string, FileState>;
  lastSave?: Map<string, number>;
}

export function setupWatchers({ paths, states, lastSave }: SetupOpts) {
  const fileStatesRef = { current: states };
  const lastSaveAtRef = { current: lastSave ?? new Map<string, number>() };
  const applyExternalReload = vi.fn();
  const onToast = vi.fn();

  const { rerender, unmount } = renderHook(
    ({ watchedPaths }: { watchedPaths: string[] }) =>
      useFileWatchers({
        watchedPaths,
        fileStatesRef,
        lastSaveAtRef,
        applyExternalReload,
        onToast,
      }),
    { initialProps: { watchedPaths: paths } }
  );

  return {
    rerender,
    unmount,
    applyExternalReload,
    onToast,
    fileStatesRef,
    lastSaveAtRef,
  };
}
