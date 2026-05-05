import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { searchText } from "./search-text.js";
import { makeTempWorkspace } from "../test/temp-workspace.js";

let root: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  ({ root, cleanup } = await makeTempWorkspace({
    "src/a.ts": "import { foo } from 'bar';\nexport function greet() {\n  return 'hello';\n}\n",
    "src/b.ts": "// nothing of interest here\n",
    "docs/notes.md": "## Hello\n\nA paragraph that says hello again.\n",
    "src/style.css": "/* hello in css */",
  }));
});

afterEach(() => cleanup());

describe("search_text", () => {
  it("finds matches with file path, line number, and line text", async () => {
    const result = await searchText(
      { query: "greet", extensions: ["ts"] },
      { workspace: root }
    );
    expect(result).toHaveLength(1);
    expect(result[0].relativePath).toBe("src/a.ts");
    expect(result[0].line).toBe(2);
    expect(result[0].text).toContain("greet");
  });

  it("is case-insensitive", async () => {
    const result = await searchText(
      { query: "HELLO", extensions: ["md"] },
      { workspace: root }
    );
    expect(result.length).toBeGreaterThan(0);
  });

  it("respects the extensions filter", async () => {
    const result = await searchText(
      { query: "hello", extensions: ["ts"] },
      { workspace: root }
    );
    // src/a.ts has no "hello" in TS — only docs/notes.md and src/style.css do
    expect(result.every((r) => r.relativePath.endsWith(".ts"))).toBe(true);
  });

  it("returns multiple matches across files when applicable", async () => {
    const result = await searchText(
      { query: "hello", extensions: ["md", "ts", "css"] },
      { workspace: root }
    );
    const paths = new Set(result.map((r) => r.relativePath));
    expect(paths.has("docs/notes.md")).toBe(true);
    expect(paths.has("src/style.css")).toBe(true);
  });

  it("respects maxResults", async () => {
    const result = await searchText(
      { query: "hello", extensions: ["md"], maxResults: 1 },
      { workspace: root }
    );
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it("returns nothing for an empty query", async () => {
    const result = await searchText(
      { query: "   ", extensions: ["ts"] },
      { workspace: root }
    );
    expect(result).toEqual([]);
  });
});
