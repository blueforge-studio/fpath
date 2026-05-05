import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import {
  handles,
  installWatchMock,
  loadedState,
  setupWatchers,
} from "./test-watchers";

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  watch: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  ask: vi.fn(),
}));

import { watch } from "@tauri-apps/plugin-fs";

const mockedWatch = vi.mocked(watch);

beforeEach(() => {
  installWatchMock(mockedWatch);
});

afterEach(() => vi.clearAllMocks());

describe("useFileWatchers — lifecycle", () => {
  it("starts a watcher for each open path", async () => {
    setupWatchers({
      paths: ["/ws/a.ts", "/ws/b.ts"],
      states: {
        "/ws/a.ts": loadedState("v1"),
        "/ws/b.ts": loadedState("v1"),
      },
    });

    await waitFor(() => {
      expect(handles.has("/ws/a.ts")).toBe(true);
      expect(handles.has("/ws/b.ts")).toBe(true);
    });
  });

  it("removes watchers for paths that drop out of openFiles", async () => {
    const { rerender } = setupWatchers({
      paths: ["/ws/a.ts", "/ws/b.ts"],
      states: {
        "/ws/a.ts": loadedState("v1"),
        "/ws/b.ts": loadedState("v1"),
      },
    });
    await waitFor(() => expect(handles.has("/ws/b.ts")).toBe(true));
    const bUnwatch = handles.get("/ws/b.ts")!.unwatch;

    rerender({ watchedPaths: ["/ws/a.ts"] });

    await waitFor(() => expect(bUnwatch).toHaveBeenCalled());
  });

  it("cleans up all watchers on unmount", async () => {
    const { unmount } = setupWatchers({
      paths: ["/ws/a.ts", "/ws/b.ts"],
      states: {
        "/ws/a.ts": loadedState("v1"),
        "/ws/b.ts": loadedState("v1"),
      },
    });
    await waitFor(() => expect(handles.size).toBe(2));

    const aUnwatch = handles.get("/ws/a.ts")!.unwatch;
    const bUnwatch = handles.get("/ws/b.ts")!.unwatch;

    unmount();

    expect(aUnwatch).toHaveBeenCalled();
    expect(bUnwatch).toHaveBeenCalled();
  });
});
