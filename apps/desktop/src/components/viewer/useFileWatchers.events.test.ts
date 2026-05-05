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

import { readTextFile, watch } from "@tauri-apps/plugin-fs";
import { ask } from "@tauri-apps/plugin-dialog";

const mockedRead = vi.mocked(readTextFile);
const mockedWatch = vi.mocked(watch);
const mockedAsk = vi.mocked(ask);

beforeEach(() => {
  mockedRead.mockReset();
  mockedAsk.mockReset();
  installWatchMock(mockedWatch);
});

afterEach(() => vi.clearAllMocks());

describe("useFileWatchers — change events", () => {
  it("auto-reloads a clean file when it changes on disk", async () => {
    mockedRead.mockResolvedValue("disk-version");
    const { applyExternalReload, onToast } = setupWatchers({
      paths: ["/ws/a.ts"],
      states: { "/ws/a.ts": loadedState("v1") },
    });

    await waitFor(() => expect(handles.has("/ws/a.ts")).toBe(true));
    handles.get("/ws/a.ts")!.fire();

    await waitFor(() => {
      expect(applyExternalReload).toHaveBeenCalledWith(
        "/ws/a.ts",
        "disk-version",
        false
      );
    });
    expect(onToast).toHaveBeenCalledWith(
      expect.stringContaining("Reloaded a.ts")
    );
    expect(mockedAsk).not.toHaveBeenCalled();
  });

  it("does nothing if the disk content matches what we already have", async () => {
    mockedRead.mockResolvedValue("v1");
    const { applyExternalReload, onToast } = setupWatchers({
      paths: ["/ws/a.ts"],
      states: { "/ws/a.ts": loadedState("v1") },
    });

    await waitFor(() => expect(handles.has("/ws/a.ts")).toBe(true));
    handles.get("/ws/a.ts")!.fire();

    await new Promise((r) => setTimeout(r, 30));
    expect(applyExternalReload).not.toHaveBeenCalled();
    expect(onToast).not.toHaveBeenCalled();
  });

  it("prompts before reloading a dirty file; reloads on confirm", async () => {
    mockedRead.mockResolvedValue("disk-version");
    mockedAsk.mockResolvedValue(true);

    const { applyExternalReload } = setupWatchers({
      paths: ["/ws/a.ts"],
      states: { "/ws/a.ts": loadedState("user-edit", "saved-v1") },
    });

    await waitFor(() => expect(handles.has("/ws/a.ts")).toBe(true));
    handles.get("/ws/a.ts")!.fire();

    await waitFor(() => expect(mockedAsk).toHaveBeenCalled());
    await waitFor(() =>
      expect(applyExternalReload).toHaveBeenCalledWith(
        "/ws/a.ts",
        "disk-version",
        false
      )
    );
  });

  it("prompts before reloading a dirty file; keeps user changes on cancel", async () => {
    mockedRead.mockResolvedValue("disk-version");
    mockedAsk.mockResolvedValue(false);

    const { applyExternalReload } = setupWatchers({
      paths: ["/ws/a.ts"],
      states: { "/ws/a.ts": loadedState("user-edit", "saved-v1") },
    });

    await waitFor(() => expect(handles.has("/ws/a.ts")).toBe(true));
    handles.get("/ws/a.ts")!.fire();

    await waitFor(() => expect(mockedAsk).toHaveBeenCalled());
    expect(applyExternalReload).not.toHaveBeenCalled();
  });

  it("suppresses self-events fired within 1.5s of a save", async () => {
    mockedRead.mockResolvedValue("anything");
    const lastSave = new Map<string, number>([
      ["/ws/a.ts", Date.now() - 200],
    ]);

    const { applyExternalReload, onToast } = setupWatchers({
      paths: ["/ws/a.ts"],
      states: { "/ws/a.ts": loadedState("v1") },
      lastSave,
    });

    await waitFor(() => expect(handles.has("/ws/a.ts")).toBe(true));
    handles.get("/ws/a.ts")!.fire();

    await new Promise((r) => setTimeout(r, 30));
    expect(applyExternalReload).not.toHaveBeenCalled();
    expect(mockedRead).not.toHaveBeenCalled();
    expect(onToast).not.toHaveBeenCalled();
  });

  it("toasts when the file is no longer readable on disk", async () => {
    mockedRead.mockRejectedValue(new Error("ENOENT"));
    const { applyExternalReload, onToast } = setupWatchers({
      paths: ["/ws/a.ts"],
      states: { "/ws/a.ts": loadedState("v1") },
    });

    await waitFor(() => expect(handles.has("/ws/a.ts")).toBe(true));
    handles.get("/ws/a.ts")!.fire();

    await waitFor(() =>
      expect(onToast).toHaveBeenCalledWith(
        expect.stringContaining("no longer readable")
      )
    );
    expect(applyExternalReload).not.toHaveBeenCalled();
  });
});
