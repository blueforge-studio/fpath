import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listDirectory } from "./list-directory.js";
import { makeTempWorkspace } from "../test/temp-workspace.js";

let root: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  ({ root, cleanup } = await makeTempWorkspace({
    "README.md": "# hi",
    "package.json": "{}",
    "src/index.ts": "// x",
    "lib/util.ts": "// y",
    ".hidden": "secret",
  }));
});

afterEach(() => cleanup());

describe("list_directory", () => {
  it("uses workspace as default path", async () => {
    const result = await listDirectory({}, { workspace: root });
    const names = result.map((e) => e.name);
    expect(names).toContain("README.md");
    expect(names).toContain("src");
  });

  it("returns directories before files, then alphabetical within each", async () => {
    const result = await listDirectory({}, { workspace: root });
    const dirs = result.filter((e) => e.kind === "directory").map((e) => e.name);
    const files = result.filter((e) => e.kind === "file").map((e) => e.name);

    // case-insensitive alphabetical within group
    const ci = (a: string, b: string) =>
      a.toLowerCase().localeCompare(b.toLowerCase());
    expect([...dirs].sort(ci)).toEqual(dirs);
    expect([...files].sort(ci)).toEqual(files);

    // dirs come first
    const firstFileIdx = result.findIndex((e) => e.kind === "file");
    const lastDirIdx = result.map((e) => e.kind).lastIndexOf("directory");
    expect(lastDirIdx).toBeLessThan(firstFileIdx);
  });

  it("accepts a relative path resolved against the workspace", async () => {
    const result = await listDirectory({ path: "src" }, { workspace: root });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("index.ts");
    expect(result[0].kind).toBe("file");
  });

  it("accepts an absolute path", async () => {
    const result = await listDirectory(
      { path: `${root}/lib` },
      { workspace: undefined }
    );
    expect(result.map((e) => e.name)).toEqual(["util.ts"]);
  });

  it("returns absolute paths in entries", async () => {
    const result = await listDirectory({ path: "src" }, { workspace: root });
    expect(result[0].path.startsWith("/")).toBe(true);
    expect(result[0].path.endsWith("src/index.ts")).toBe(true);
  });
});
