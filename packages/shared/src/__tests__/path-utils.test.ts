import { describe, it, expect } from "vitest";
import { getRelativePath, getAbsolutePath, formatPathsForClipboard } from "../path-utils";

describe("getRelativePath", () => {
  it("strips workspace root from absolute path", () => {
    expect(getRelativePath("/ws/src/file.ts", "/ws")).toBe("src/file.ts");
  });

  it("handles trailing slash on workspace root", () => {
    expect(getRelativePath("/ws/src/file.ts", "/ws/")).toBe("src/file.ts");
  });

  it("returns path unchanged if not under workspace root", () => {
    expect(getRelativePath("/other/file.ts", "/ws")).toBe("/other/file.ts");
  });
});

describe("getAbsolutePath", () => {
  it("joins relative path with workspace root", () => {
    expect(getAbsolutePath("src/file.ts", "/ws")).toBe("/ws/src/file.ts");
  });

  it("returns absolute path unchanged", () => {
    expect(getAbsolutePath("/other/file.ts", "/ws")).toBe("/other/file.ts");
  });
});

describe("formatPathsForClipboard", () => {
  it("formats absolute paths", () => {
    const paths = ["/ws/a.ts", "/ws/b.ts"];
    expect(formatPathsForClipboard(paths, "absolute", "/ws")).toBe("/ws/a.ts\n/ws/b.ts");
  });

  it("formats relative paths", () => {
    const paths = ["/ws/a.ts", "/ws/b.ts"];
    expect(formatPathsForClipboard(paths, "relative", "/ws")).toBe("a.ts\nb.ts");
  });
});
