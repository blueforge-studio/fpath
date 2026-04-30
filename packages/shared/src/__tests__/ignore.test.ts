import { describe, it, expect, beforeEach } from "vitest";
import { shouldIgnoreSync, loadSearchIgnore } from "../ignore";

describe("shouldIgnoreSync", () => {
  describe("default ignore patterns", () => {
    it("ignores node_modules paths", () => {
      expect(shouldIgnoreSync("node_modules")).toBe(true);
      expect(shouldIgnoreSync("node_modules/some-pkg/index.js")).toBe(true);
      expect(shouldIgnoreSync("packages/app/node_modules/react/index.js")).toBe(true);
    });

    it("ignores .git paths", () => {
      expect(shouldIgnoreSync(".git")).toBe(true);
      expect(shouldIgnoreSync(".git/objects/abc")).toBe(true);
    });

    it("ignores dist paths", () => {
      expect(shouldIgnoreSync("dist")).toBe(true);
      expect(shouldIgnoreSync("dist/main.js")).toBe(true);
    });

    it("ignores .turbo and .next paths", () => {
      expect(shouldIgnoreSync(".turbo")).toBe(true);
      expect(shouldIgnoreSync(".turbo/cookies/something")).toBe(true);
      expect(shouldIgnoreSync(".next")).toBe(true);
      expect(shouldIgnoreSync(".next/server/pages/index.js")).toBe(true);
    });

    it("ignores target paths (Rust build)", () => {
      expect(shouldIgnoreSync("target")).toBe(true);
      expect(shouldIgnoreSync("target/debug/build/something")).toBe(true);
    });

    it("ignores __pycache__ paths", () => {
      expect(shouldIgnoreSync("__pycache__")).toBe(true);
      expect(shouldIgnoreSync("__pycache__/module.pyc")).toBe(true);
    });

    it("ignores .DS_Store and Thumbs.db", () => {
      expect(shouldIgnoreSync(".DS_Store")).toBe(true);
      expect(shouldIgnoreSync("Thumbs.db")).toBe(true);
    });

    it("does not ignore normal source files", () => {
      expect(shouldIgnoreSync("src/index.ts")).toBe(false);
      expect(shouldIgnoreSync("packages/shared/package.json")).toBe(false);
      expect(shouldIgnoreSync("apps/desktop/src/App.tsx")).toBe(false);
      expect(shouldIgnoreSync("README.md")).toBe(false);
    });

    it("does not ignore paths that contain but don't match default patterns", () => {
      expect(shouldIgnoreSync("src/components/DistrictMap.tsx")).toBe(false);
      expect(shouldIgnoreSync("my-node-modules-notes.md")).toBe(false);
    });
  });

  describe("custom patterns via loadSearchIgnore", () => {
    beforeEach(() => {
      loadSearchIgnore("");
    });

    it("respects custom ignore patterns from .searchignore content", () => {
      loadSearchIgnore("coverage\n*.generated.ts\ntemp/");
      expect(shouldIgnoreSync("coverage")).toBe(true);
      expect(shouldIgnoreSync("coverage/lcov.info")).toBe(true);
      expect(shouldIgnoreSync("src/test.generated.ts")).toBe(true);
      expect(shouldIgnoreSync("temp")).toBe(true);
      expect(shouldIgnoreSync("temp/cache.json")).toBe(true);
    });

    it("ignores comments and blank lines in .searchignore", () => {
      loadSearchIgnore("# This is a comment\n\nbuild-output\n\n# Another comment\n*.bak");
      // Should ignore defined patterns
      expect(shouldIgnoreSync("build-output")).toBe(true);
      expect(shouldIgnoreSync("build-output/main.js")).toBe(true);
      expect(shouldIgnoreSync("file.bak")).toBe(true);
      // Should not pick up comments as patterns
      expect(shouldIgnoreSync("# This is a comment")).toBe(false);
    });

    it("resets custom patterns when loading empty content", () => {
      loadSearchIgnore("coverage\ndist");
      expect(shouldIgnoreSync("coverage")).toBe(true);
      loadSearchIgnore("");
      // dist is a default pattern, so it's still ignored
      expect(shouldIgnoreSync("dist/main.js")).toBe(true);
    });
  });
});
