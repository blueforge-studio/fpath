import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { resolvePath } from "../paths.js";
import type { ToolContext } from "../tools.js";

export const listDirectoryTool: Tool = {
  name: "list_directory",
  description:
    "List the immediate contents of a directory in the workspace. Returns name, kind (file/directory), and absolute path for each entry. Directories are listed first, then alphabetical.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "Absolute path or workspace-relative path. Defaults to the workspace root.",
      },
    },
  },
};

export async function listDirectory(
  args: Record<string, unknown>,
  ctx: ToolContext
) {
  const path = resolvePath(args.path as string | undefined, ctx.workspace);
  const entries = await readdir(path, { withFileTypes: true });

  return entries
    .map((e) => ({
      name: e.name,
      kind: e.isDirectory()
        ? ("directory" as const)
        : e.isFile()
          ? ("file" as const)
          : ("other" as const),
      path: resolve(path, e.name),
    }))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
}
