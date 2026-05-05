import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findFiles } from "./find-files.js";
import { makeTempWorkspace } from "../test/temp-workspace.js";

let root: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  ({ root, cleanup } = await makeTempWorkspace({
    "src/components/FileViewer.tsx": "// fv",
    "src/components/FileTree.tsx": "// ft",
    "src/hooks/useStored.ts": "// stored",
    "README.md": "# README",
    "node_modules/skip/index.js": "// nope",
  }));
});

afterEach(() => cleanup());

describe("find_files", () => {
  it("matches by file name", async () => {
    const result = await findFiles({ query: "FileViewer" }, { workspace: root });
    expect(result.map((r) => r.relativePath)).toEqual([
      "src/components/FileViewer.tsx",
    ]);
  });

  it("is case-insensitive", async () => {
    const result = await findFiles({ query: "filetree" }, { workspace: root });
    expect(result.map((r) => r.relativePath)).toContain(
      "src/components/FileTree.tsx"
    );
  });

  it("matches against the relative path, not just the file name", async () => {
    const result = await findFiles({ query: "hooks/" }, { workspace: root });
    expect(result.map((r) => r.relativePath)).toEqual([
      "src/hooks/useStored.ts",
    ]);
  });

  it("returns at most maxResults entries", async () => {
    const result = await findFiles(
      { query: "tsx", maxResults: 1 },
      { workspace: root }
    );
    expect(result).toHaveLength(1);
  });

  it("returns nothing for an empty query", async () => {
    const result = await findFiles({ query: "" }, { workspace: root });
    expect(result).toEqual([]);
  });

  it("skips ignored directories", async () => {
    const result = await findFiles({ query: "skip" }, { workspace: root });
    expect(result).toEqual([]);
  });

  it("uses the workspace argument when given (overrides ctx)", async () => {
    const result = await findFiles(
      { query: "README", workspace: root },
      { workspace: undefined }
    );
    expect(result.map((r) => r.relativePath)).toEqual(["README.md"]);
  });

  it("throws when no workspace is configured at all", async () => {
    await expect(
      findFiles({ query: "x" }, { workspace: undefined })
    ).rejects.toThrow(/No workspace/);
  });
});
