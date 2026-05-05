import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
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

function setup(activeFile = TABS[0]) {
  return renderHook(() =>
    useTabKeybindings({
      openFiles: TABS,
      activeFile,
      onTabSelect,
      onRequestClose,
      onSave,
    })
  );
}

describe("useTabKeybindings — save & close", () => {
  it("Cmd+S calls onSave", () => {
    setup();
    const { prevented } = dispatchKey({ key: "s", metaKey: true });

    expect(onSave).toHaveBeenCalledOnce();
    expect(prevented()).toBe(true);
  });

  it("Cmd+Shift+S does NOT save (let other handlers take Cmd+Shift+S)", () => {
    setup();
    dispatchKey({ key: "s", metaKey: true, shiftKey: true });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("Ctrl+S behaves like Cmd+S (Linux/Windows parity)", () => {
    setup();
    dispatchKey({ key: "s", ctrlKey: true });
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("Cmd+W closes the active tab", () => {
    setup(TABS[2]);
    dispatchKey({ key: "w", metaKey: true });
    expect(onRequestClose).toHaveBeenCalledWith(TABS[2]);
  });

  it("Cmd+W with no active file is a no-op", () => {
    renderHook(() =>
      useTabKeybindings({
        openFiles: TABS,
        activeFile: null,
        onTabSelect,
        onRequestClose,
        onSave,
      })
    );
    dispatchKey({ key: "w", metaKey: true });
    expect(onRequestClose).not.toHaveBeenCalled();
  });

  it("ignores keys when no meta/ctrl modifier is held", () => {
    setup();
    dispatchKey({ key: "s" });
    dispatchKey({ key: "w" });
    dispatchKey({ key: "1" });

    expect(onSave).not.toHaveBeenCalled();
    expect(onRequestClose).not.toHaveBeenCalled();
    expect(onTabSelect).not.toHaveBeenCalled();
  });
});
