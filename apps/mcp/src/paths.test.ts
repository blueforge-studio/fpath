import { describe, expect, it } from "vitest";
import { resolvePath, resolveWorkspace } from "./paths.js";

describe("resolveWorkspace", () => {
  it("returns the absolute arg when given", () => {
    expect(resolveWorkspace("/abs/path", undefined)).toBe("/abs/path");
  });

  it("falls back to the configured workspace", () => {
    expect(resolveWorkspace(undefined, "/fallback")).toBe("/fallback");
  });

  it("resolves a relative arg against cwd", () => {
    const result = resolveWorkspace("rel", undefined);
    expect(result.startsWith("/")).toBe(true);
    expect(result.endsWith("/rel")).toBe(true);
  });

  it("throws when neither arg nor fallback is provided", () => {
    expect(() => resolveWorkspace(undefined, undefined)).toThrow(/No workspace/);
  });
});

describe("resolvePath", () => {
  it("returns workspace for `.` or empty", () => {
    expect(resolvePath(".", "/ws")).toBe("/ws");
    expect(resolvePath("", "/ws")).toBe("/ws");
    expect(resolvePath(undefined, "/ws")).toBe("/ws");
  });

  it("returns absolute paths unchanged", () => {
    expect(resolvePath("/a/b/c", "/ws")).toBe("/a/b/c");
  });

  it("resolves a relative path against the workspace", () => {
    expect(resolvePath("src/index.ts", "/ws")).toBe("/ws/src/index.ts");
  });

  it("throws on a relative path with no workspace", () => {
    expect(() => resolvePath("src/index.ts", undefined)).toThrow(
      /no workspace/i
    );
  });
});
