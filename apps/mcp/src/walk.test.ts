import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { walk } from "./walk.js";
import { makeTempWorkspace } from "./test/temp-workspace.js";

let root: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  ({ root, cleanup } = await makeTempWorkspace({
    "a.ts": "// a",
    "b.md": "# b",
    "src/c.ts": "// c",
    "src/d.txt": "d",
    "node_modules/skipme.js": "// should be ignored",
    ".git/HEAD": "ref: refs/heads/main",
    ".claude/settings.json": "{}",
  }));
});

afterEach(() => cleanup());

describe("walk", () => {
  it("returns files and directories with relative paths", async () => {
    const entries = await walk(root);
    const rels = entries.map((e) => e.relativePath).sort();

    expect(rels).toContain("a.ts");
    expect(rels).toContain("b.md");
    expect(rels).toContain("src");
    expect(rels).toContain("src/c.ts");
    expect(rels).toContain("src/d.txt");
  });

  it("skips ignored directories by default (node_modules, .git, .claude)", async () => {
    const entries = await walk(root);
    const rels = entries.map((e) => e.relativePath);

    expect(rels.some((r) => r.startsWith("node_modules"))).toBe(false);
    expect(rels.some((r) => r.startsWith(".git"))).toBe(false);
    expect(rels.some((r) => r.startsWith(".claude"))).toBe(false);
  });

  it("filesOnly omits directory entries", async () => {
    const entries = await walk(root, { filesOnly: true });
    expect(entries.every((e) => !e.isDir)).toBe(true);
  });

  it("filters by extension", async () => {
    const entries = await walk(root, { filesOnly: true, extensions: ["ts"] });
    const names = entries.map((e) => e.relativePath).sort();
    expect(names).toEqual(["a.ts", "src/c.ts"]);
  });

  it("normalizes leading dots in extensions", async () => {
    const entries = await walk(root, { filesOnly: true, extensions: [".md"] });
    expect(entries.map((e) => e.relativePath)).toEqual(["b.md"]);
  });

  it("respects maxResults", async () => {
    const entries = await walk(root, { maxResults: 2 });
    expect(entries).toHaveLength(2);
  });

  it("populates size for files", async () => {
    const entries = await walk(root, { filesOnly: true });
    const a = entries.find((e) => e.relativePath === "a.ts");
    expect(a?.size).toBeGreaterThan(0);
  });
});
