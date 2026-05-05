import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { walk } from "../walk.js";
import { resolveWorkspace } from "../paths.js";
import type { ToolContext } from "../tools.js";

export const findFilesTool: Tool = {
  name: "find_files",
  description:
    "Find files in the workspace by case-insensitive substring match against the file name or relative path. Common build/VCS dirs (node_modules, .git, dist, target, ...) are skipped.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Substring to match in the file name or relative path.",
      },
      workspace: {
        type: "string",
        description:
          "Override the active workspace. Absolute path. Defaults to the server's configured workspace.",
      },
      maxResults: { type: "number", default: 50 },
    },
    required: ["query"],
  },
};

export async function findFiles(
  args: Record<string, unknown>,
  ctx: ToolContext
) {
  const workspace = resolveWorkspace(
    args.workspace as string | undefined,
    ctx.workspace
  );
  const query = String(args.query ?? "").toLowerCase();
  const max = (args.maxResults as number | undefined) ?? 50;
  if (!query.trim()) return [];

  const all = await walk(workspace, { filesOnly: true, maxResults: 5000 });
  const matches: Array<{ path: string; relativePath: string; size: number }> = [];

  for (const e of all) {
    const lowerRel = e.relativePath.toLowerCase();
    const slash = e.relativePath.lastIndexOf("/");
    const name = slash >= 0 ? e.relativePath.slice(slash + 1) : e.relativePath;
    if (name.toLowerCase().includes(query) || lowerRel.includes(query)) {
      matches.push({
        path: e.path,
        relativePath: e.relativePath,
        size: e.size,
      });
      if (matches.length >= max) break;
    }
  }

  return matches;
}
