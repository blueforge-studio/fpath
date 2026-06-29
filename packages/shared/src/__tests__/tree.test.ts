import { describe, it, expect } from "vitest";
import { flattenTree, filterTree, sortTree, findNodeByPath, updateNodeChildren } from "../tree";
import type { FileEntry } from "../types";

const mockTree: FileEntry[] = [
  {
    name: "src", path: "/ws/src", relativePath: "src",
    kind: "directory", isSymlink: false,
    children: [
      {
        name: "index.ts", path: "/ws/src/index.ts", relativePath: "src/index.ts",
        kind: "file", extension: "ts", isSymlink: false,
      },
      {
        name: "utils.ts", path: "/ws/src/utils.ts", relativePath: "src/utils.ts",
        kind: "file", extension: "ts", isSymlink: false,
      },
    ],
  },
  {
    name: "README.md", path: "/ws/README.md", relativePath: "README.md",
    kind: "file", extension: "md", isSymlink: false,
  },
];

describe("flattenTree", () => {
  it("flattens nested nodes into a flat array", () => {
    const flat = flattenTree(mockTree);
    expect(flat.length).toBe(4);
  });
});

describe("filterTree", () => {
  it("finds files matching query", () => {
    const results = filterTree(mockTree, "index");
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("index.ts");
  });
});

describe("sortTree", () => {
  it("sorts directories before files", () => {
    const sorted = sortTree(mockTree);
    expect(sorted[0].kind).toBe("directory");
  });
});

describe("findNodeByPath", () => {
  it("finds a node by its path", () => {
    const node = findNodeByPath(mockTree, "/ws/src/index.ts");
    expect(node?.name).toBe("index.ts");
  });

  it("returns null for missing path", () => {
    const node = findNodeByPath(mockTree, "/nope");
    expect(node).toBeNull();
  });
});

describe("updateNodeChildren", () => {
  it("updates children of target node", () => {
    const newChildren: FileEntry[] = [{
      name: "new.ts", path: "/ws/src/new.ts", relativePath: "src/new.ts",
      kind: "file", extension: "ts", isSymlink: false,
    }];
    const updated = updateNodeChildren(mockTree, "/ws/src", newChildren);
    const src = updated.find((n) => n.path === "/ws/src");
    expect(src?.children?.length).toBe(1);
    expect(src?.children?.[0].name).toBe("new.ts");
  });
});
