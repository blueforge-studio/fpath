import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * Test helper: create a tmp directory, populate it with a virtual file map,
 * and return its absolute path plus a cleanup function.
 *
 * Keys in `files` are paths relative to the tmp root. Values are file contents.
 * Intermediate directories are created automatically. To create an empty
 * directory, use a key ending in `/` and an empty string value.
 */
export async function makeTempWorkspace(
  files: Record<string, string>
): Promise<{ root: string; cleanup: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), "fpath-mcp-test-"));

  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    if (rel.endsWith("/")) {
      await mkdir(full, { recursive: true });
    } else {
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, content, "utf8");
    }
  }

  return {
    root,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
