import { describe, it, expect } from "vitest";
import {
  flattenTree,
  filterTree,
  sortTree,
  findNodeByPath,
  getParentPaths,
  applyTreeFilters,
  type TreeFilters,
} from "./tree";
import type { FileEntry } from "./types";

function file(name: string, path: string): FileEntry {
  const dot = name.lastIndexOf(".");
  return {
    name,
    path,
    relativePath: path.replace(/^\//, ""),
    kind: "file",
    extension: dot > 0 ? name.slice(dot + 1) : undefined,
    isSymlink: false,
  };
}

function dir(name: string, path: string, children: FileEntry[] = []): FileEntry {
  return {
    name,
    path,
    relativePath: path.replace(/^\//, ""),
    kind: "directory",
    isSymlink: false,
    children,
  };
}

describe("flattenTree", () => {
  it("returns empty for empty input", () => {
    expect(flattenTree([])).toEqual([]);
  });

  it("walks nested children depth-first", () => {
    const tree = [
      dir("a", "/a", [file("a1.ts", "/a/a1.ts"), file("a2.ts", "/a/a2.ts")]),
      file("b.ts", "/b.ts"),
    ];
    const flat = flattenTree(tree);
    expect(flat.map((n) => n.path)).toEqual([
      "/a",
      "/a/a1.ts",
      "/a/a2.ts",
      "/b.ts",
    ]);
  });

  it("handles directories with undefined children", () => {
    const tree = [dir("unloaded", "/x"), file("y.ts", "/y.ts")];
    delete tree[0].children;
    expect(flattenTree(tree)).toHaveLength(2);
  });
});

describe("filterTree", () => {
  const tree = [
    dir("src", "/src", [
      file("Index.ts", "/src/Index.ts"),
      file("App.tsx", "/src/App.tsx"),
      dir("util", "/src/util", [file(".env", "/src/util/.env")]),
    ]),
    file("README.md", "/README.md"),
  ];

  it("matches by substring case-insensitively", () => {
    const results = filterTree(tree, "INDEX");
    expect(results.map((f) => f.path)).toEqual(["/src/Index.ts"]);
  });

  it("returns only files (not directories)", () => {
    const results = filterTree(tree, "src");
    expect(results.every((f) => f.kind === "file")).toBe(true);
  });

  it("finds dotfiles in nested directories", () => {
    const results = filterTree(tree, ".env");
    expect(results.map((f) => f.path)).toEqual(["/src/util/.env"]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterTree(tree, "zzzz")).toEqual([]);
  });
});

describe("sortTree", () => {
  it("sorts directories before files", () => {
    const sorted = sortTree([
      file("a.ts", "/a.ts"),
      dir("z", "/z"),
      file("b.ts", "/b.ts"),
      dir("a", "/a"),
    ]);
    expect(sorted.map((n) => n.name)).toEqual(["a", "z", "a.ts", "b.ts"]);
  });

  it("does not mutate input", () => {
    const input = [file("b.ts", "/b.ts"), file("a.ts", "/a.ts")];
    const inputCopy = [...input];
    sortTree(input);
    expect(input).toEqual(inputCopy);
  });
});

describe("findNodeByPath", () => {
  const tree = [dir("src", "/src", [file("App.tsx", "/src/App.tsx")])];

  it("finds nested entries", () => {
    expect(findNodeByPath(tree, "/src/App.tsx")?.name).toBe("App.tsx");
  });

  it("returns null for missing paths", () => {
    expect(findNodeByPath(tree, "/nope")).toBeNull();
  });
});

describe("getParentPaths", () => {
  it("returns ancestor paths", () => {
    expect(getParentPaths("/a/b/c.ts")).toEqual(["", "/a", "/a/b"]);
  });
});

describe("applyTreeFilters", () => {
  const repoMap = new Map<string, boolean>([
    ["/repo-a", true],
    ["/dotrepo", true],
    ["/not-repo", false],
  ]);

  const tree = [
    dir(".git", "/.git"),
    dir(".dotdir", "/.dotdir", [file("inside.ts", "/.dotdir/inside.ts")]),
    dir("repo-a", "/repo-a", [
      file("README.md", "/repo-a/README.md"),
      dir(".hidden", "/repo-a/.hidden"),
    ]),
    dir("not-repo", "/not-repo"),
    file("loose-file.md", "/loose-file.md"),
  ];

  const baseline: TreeFilters = {
    hideDotfiles: false,
    rootDirsOnly: false,
    repoOnly: false,
    repoMap,
  };

  it("returns input shape when no filters active", () => {
    const out = applyTreeFilters(tree, baseline);
    expect(out.map((n) => n.name)).toEqual([
      ".git",
      ".dotdir",
      "repo-a",
      "not-repo",
      "loose-file.md",
    ]);
  });

  it("hideDotfiles filters dot-prefixed entries at all depths", () => {
    const out = applyTreeFilters(tree, { ...baseline, hideDotfiles: true });
    expect(out.map((n) => n.name)).toEqual(["repo-a", "not-repo", "loose-file.md"]);
    const repoA = out.find((n) => n.name === "repo-a")!;
    expect(repoA.children!.map((c) => c.name)).toEqual(["README.md"]);
  });

  it("rootDirsOnly hides files at depth 0 but keeps nested files", () => {
    const out = applyTreeFilters(tree, { ...baseline, rootDirsOnly: true });
    expect(out.find((n) => n.name === "loose-file.md")).toBeUndefined();
    const repoA = out.find((n) => n.name === "repo-a")!;
    expect(repoA.children!.find((c) => c.name === "README.md")).toBeDefined();
  });

  it("repoOnly keeps only top-level dirs whose path is true in repoMap", () => {
    const out = applyTreeFilters(tree, { ...baseline, repoOnly: true });
    expect(out.map((n) => n.name)).toEqual(["repo-a"]);
  });

  it("repoOnly excludes dirs that have not been probed yet", () => {
    const partial = new Map<string, boolean>([["/repo-a", true]]);
    const out = applyTreeFilters(tree, {
      ...baseline,
      repoOnly: true,
      repoMap: partial,
    });
    expect(out.map((n) => n.name)).toEqual(["repo-a"]);
  });

  it("hideDotfiles + repoOnly combined", () => {
    const out = applyTreeFilters(tree, {
      ...baseline,
      hideDotfiles: true,
      repoOnly: true,
    });
    expect(out.map((n) => n.name)).toEqual(["repo-a"]);
    const repoA = out[0];
    expect(repoA.children!.map((c) => c.name)).toEqual(["README.md"]);
  });
});
