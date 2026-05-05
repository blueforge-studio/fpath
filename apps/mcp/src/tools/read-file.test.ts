import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFile } from "./read-file.js";
import { makeTempWorkspace } from "../test/temp-workspace.js";

let root: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  ({ root, cleanup } = await makeTempWorkspace({
    "small.txt": "hello world",
    "large.txt": "x".repeat(10_000),
    "src/code.ts": "const x = 1;\n",
    "subdir/": "",
  }));
});

afterEach(() => cleanup());

describe("read_file", () => {
  it("reads a small file fully", async () => {
    const result = await readFile({ path: "small.txt" }, { workspace: root });
    expect(result.truncated).toBe(false);
    expect(result.content).toBe("hello world");
    expect(result.bytes).toBe(11);
  });

  it("resolves relative paths against the workspace", async () => {
    const result = await readFile(
      { path: "src/code.ts" },
      { workspace: root }
    );
    expect(result.content).toBe("const x = 1;\n");
  });

  it("accepts absolute paths", async () => {
    const result = await readFile(
      { path: `${root}/small.txt` },
      { workspace: undefined }
    );
    expect(result.content).toBe("hello world");
  });

  it("truncates content above maxBytes and sets the flag", async () => {
    const result = await readFile(
      { path: "large.txt", maxBytes: 1000 },
      { workspace: root }
    );
    expect(result.truncated).toBe(true);
    // truncated content includes the marker
    expect(result.content).toContain("truncated at");
    // original content portion is exactly maxBytes
    expect(result.content.slice(0, 1000)).toBe("x".repeat(1000));
    // bytes reflects the actual on-disk size, not the truncated buffer
    expect(result.bytes).toBe(10_000);
  });

  it("rejects directories with a clear error", async () => {
    await expect(
      readFile({ path: "subdir" }, { workspace: root })
    ).rejects.toThrow(/Not a file/);
  });

  it("propagates ENOENT for missing files", async () => {
    await expect(
      readFile({ path: "nope.txt" }, { workspace: root })
    ).rejects.toThrow();
  });
});
