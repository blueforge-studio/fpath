import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { FileEntry } from "@fpath/shared";
import { useFileEditorStates } from "./useFileEditorStates";
import { fileFixture as file } from "./test-fixtures";

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  watch: vi.fn(),
}));

import { readTextFile } from "@tauri-apps/plugin-fs";

const mockedRead = vi.mocked(readTextFile);

beforeEach(() => {
  mockedRead.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useFileEditorStates — loading", () => {
  it("loads content for the active file via readTextFile", async () => {
    mockedRead.mockResolvedValueOnce("hello world");
    const f = file("/ws/a.ts");

    const { result } = renderHook(() =>
      useFileEditorStates({ openFiles: [f], activeFile: f })
    );

    await waitFor(() =>
      expect(result.current.fileStates[f.path]?.loaded).toBe(true)
    );

    expect(mockedRead).toHaveBeenCalledWith(f.path);
    expect(result.current.fileStates[f.path].content).toBe("hello world");
    expect(result.current.fileStates[f.path].original).toBe("hello world");
    expect(result.current.dirtyPaths.size).toBe(0);
  });

  it("captures load errors in state without retrying", async () => {
    mockedRead.mockRejectedValue(new Error("boom"));
    const f = file("/ws/a.ts");

    const { result } = renderHook(() =>
      useFileEditorStates({ openFiles: [f], activeFile: f })
    );

    await waitFor(() => {
      expect(result.current.fileStates[f.path]?.error).toBe("boom");
    });

    const calls = mockedRead.mock.calls.length;
    await new Promise((r) => setTimeout(r, 30));
    expect(mockedRead.mock.calls.length).toBe(calls);
  });

  it("drops state for files no longer in openFiles", async () => {
    mockedRead.mockResolvedValue("v1");
    const f1 = file("/ws/a.ts");
    const f2 = file("/ws/b.ts");

    const { result, rerender } = renderHook(
      ({ openFiles, activeFile }: { openFiles: FileEntry[]; activeFile: FileEntry | null }) =>
        useFileEditorStates({ openFiles, activeFile }),
      { initialProps: { openFiles: [f1, f2], activeFile: f1 } }
    );

    await waitFor(() =>
      expect(result.current.fileStates[f1.path]?.loaded).toBe(true)
    );

    rerender({ openFiles: [f2], activeFile: f2 });

    await waitFor(() => {
      expect(result.current.fileStates[f1.path]).toBeUndefined();
    });
  });
});
