import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { FileEntry } from "@fpath/shared";
import { useTabKeybindings } from "./useTabKeybindings";
import { dispatchKey, TABS } from "./test-keys";

let onTabSelect: ReturnType<typeof vi.fn>;
let onRequestClose: ReturnType<typeof vi.fn>;
let onSave: ReturnType<typeof vi.fn>;

beforeEach(() => {
  onTabSelect = vi.fn();
  onRequestClose = vi.fn();
  onSave = vi.fn();
});

afterEach(() => vi.clearAllMocks());

function setup(activeFile: FileEntry, openFiles = TABS) {
  return renderHook(() =>
    useTabKeybindings({
      openFiles,
      activeFile,
      onTabSelect,
      onRequestClose,
      onSave,
    })
  );
}

describe("useTabKeybindings — tab navigation", () => {
  it("Cmd+1..8 jumps to tab N (1-indexed)", () => {
    setup(TABS[0]);
    dispatchKey({ key: "3", metaKey: true });
    expect(onTabSelect).toHaveBeenCalledWith(TABS[2]);
  });

  it("Cmd+9 jumps to the last tab regardless of count", () => {
    setup(TABS[0]);
    dispatchKey({ key: "9", metaKey: true });
    expect(onTabSelect).toHaveBeenCalledWith(TABS[TABS.length - 1]);
  });

  it("Cmd+N for an out-of-range N is ignored gracefully", () => {
    const small = TABS.slice(0, 2);
    setup(small[0], small);

    dispatchKey({ key: "5", metaKey: true });
    dispatchKey({ key: "9", metaKey: true });

    // Cmd+5 ignored (only 2 tabs); Cmd+9 still maps to last
    expect(onTabSelect).toHaveBeenCalledTimes(1);
    expect(onTabSelect).toHaveBeenLastCalledWith(small[small.length - 1]);
  });

  it("Cmd+Shift+] cycles to the next tab", () => {
    setup(TABS[1]);
    dispatchKey({
      key: "]",
      code: "BracketRight",
      metaKey: true,
      shiftKey: true,
    });
    expect(onTabSelect).toHaveBeenCalledWith(TABS[2]);
  });

  it("Cmd+Shift+[ cycles to the previous tab", () => {
    setup(TABS[1]);
    dispatchKey({
      key: "[",
      code: "BracketLeft",
      metaKey: true,
      shiftKey: true,
    });
    expect(onTabSelect).toHaveBeenCalledWith(TABS[0]);
  });

  it("cycle wraps from first to last via prev", () => {
    setup(TABS[0]);
    dispatchKey({
      key: "[",
      code: "BracketLeft",
      metaKey: true,
      shiftKey: true,
    });
    expect(onTabSelect).toHaveBeenCalledWith(TABS[TABS.length - 1]);
  });

  it("cycle wraps from last to first via next", () => {
    setup(TABS[TABS.length - 1]);
    dispatchKey({
      key: "]",
      code: "BracketRight",
      metaKey: true,
      shiftKey: true,
    });
    expect(onTabSelect).toHaveBeenCalledWith(TABS[0]);
  });
});
