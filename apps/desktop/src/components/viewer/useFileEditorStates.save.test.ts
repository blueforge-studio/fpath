import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFileEditorStates } from "./useFileEditorStates";
import { fileFixture as file } from "./test-fixtures";

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  watch: vi.fn(),
}));

import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

const mockedRead = vi.mocked(readTextFile);
const mockedWrite = vi.mocked(writeTextFile);

beforeEach(() => {
  mockedRead.mockReset();
  mockedWrite.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useFileEditorStates — editing & saving", () => {
  it("marks the file dirty when content diverges from original", async () => {
    mockedRead.mockResolvedValueOnce("v1");
    const f = file("/ws/a.ts");

    const { result } = renderHook(() =>
      useFileEditorStates({ openFiles: [f], activeFile: f })
    );
    await waitFor(() =>
      expect(result.current.fileStates[f.path]?.loaded).toBe(true)
    );

    act(() => result.current.setContent(f.path, "v2"));
    expect(result.current.dirtyPaths.has(f.path)).toBe(true);
  });

  it("saveActive writes via writeTextFile and clears dirty", async () => {
    mockedRead.mockResolvedValueOnce("v1");
    mockedWrite.mockResolvedValueOnce(undefined);
    const f = file("/ws/a.ts", "a.ts");
    const onToast = vi.fn();

    const { result } = renderHook(() =>
      useFileEditorStates({ openFiles: [f], activeFile: f, onToast })
    );
    await waitFor(() =>
      expect(result.current.fileStates[f.path]?.loaded).toBe(true)
    );

    act(() => result.current.setContent(f.path, "v2"));
    await act(async () => {
      await result.current.saveActive();
    });

    expect(mockedWrite).toHaveBeenCalledWith(f.path, "v2");
    expect(result.current.dirtyPaths.has(f.path)).toBe(false);
    expect(result.current.fileStates[f.path].original).toBe("v2");
    expect(onToast).toHaveBeenCalledWith("Saved a.ts");
  });

  it("saveActive is a no-op when content is unchanged", async () => {
    mockedRead.mockResolvedValueOnce("v1");
    const f = file("/ws/a.ts");

    const { result } = renderHook(() =>
      useFileEditorStates({ openFiles: [f], activeFile: f })
    );
    await waitFor(() =>
      expect(result.current.fileStates[f.path]?.loaded).toBe(true)
    );

    await act(async () => {
      await result.current.saveActive();
    });

    expect(mockedWrite).not.toHaveBeenCalled();
  });

  it("saveActive shows a toast and skips write for truncated files", async () => {
    const big = "x".repeat(2_000_001);
    mockedRead.mockResolvedValueOnce(big);
    const f = file("/ws/big.txt");
    const onToast = vi.fn();

    const { result } = renderHook(() =>
      useFileEditorStates({ openFiles: [f], activeFile: f, onToast })
    );
    await waitFor(() =>
      expect(result.current.fileStates[f.path]?.loaded).toBe(true)
    );

    expect(result.current.fileStates[f.path].truncated).toBe(true);

    act(() => result.current.setContent(f.path, "anything"));
    await act(async () => {
      await result.current.saveActive();
    });

    expect(mockedWrite).not.toHaveBeenCalled();
    expect(onToast).toHaveBeenCalledWith("File too large — read-only");
  });

  it("saveActive surfaces write errors via toast and keeps the dirty flag", async () => {
    mockedRead.mockResolvedValueOnce("v1");
    mockedWrite.mockRejectedValueOnce(new Error("EACCES"));
    const f = file("/ws/a.ts");
    const onToast = vi.fn();

    const { result } = renderHook(() =>
      useFileEditorStates({ openFiles: [f], activeFile: f, onToast })
    );
    await waitFor(() =>
      expect(result.current.fileStates[f.path]?.loaded).toBe(true)
    );

    act(() => result.current.setContent(f.path, "v2"));
    await act(async () => {
      await result.current.saveActive();
    });

    expect(onToast).toHaveBeenCalledWith("Save failed: EACCES");
    expect(result.current.dirtyPaths.has(f.path)).toBe(true);
  });

  it("applyExternalReload replaces both content and original (clean state)", async () => {
    mockedRead.mockResolvedValueOnce("v1");
    const f = file("/ws/a.ts");

    const { result } = renderHook(() =>
      useFileEditorStates({ openFiles: [f], activeFile: f })
    );
    await waitFor(() =>
      expect(result.current.fileStates[f.path]?.loaded).toBe(true)
    );

    act(() =>
      result.current.applyExternalReload(f.path, "fresh content", false)
    );

    expect(result.current.fileStates[f.path].content).toBe("fresh content");
    expect(result.current.fileStates[f.path].original).toBe("fresh content");
    expect(result.current.dirtyPaths.has(f.path)).toBe(false);
  });
});
