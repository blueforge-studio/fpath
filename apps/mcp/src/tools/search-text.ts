import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { readFile } from "node:fs/promises";
import { walk } from "../walk.js";
import { resolveWorkspace } from "../paths.js";
import type { ToolContext } from "../tools.js";

const DEFAULT_EXTENSIONS = ["ts", "tsx", "js", "jsx", "md", "json", "rs", "go"];
const MAX_LINE_LEN = 300;

export const searchTextTool: Tool = {
  name: "search_text",
  description:
    "Grep-style line-by-line text search across files in the workspace, restricted to the given extensions. Returns file path, line number, and the matching line (case-insensitive).",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Substring to search for (case-insensitive).",
      },
      extensions: {
        type: "array",
        items: { type: "string" },
        description: `File extensions to scan. Defaults to ${DEFAULT_EXTENSIONS.join(", ")}.`,
        default: DEFAULT_EXTENSIONS,
      },
      workspace: {
        type: "string",
        description: "Override the active workspace.",
      },
      maxResults: { type: "number", default: 200 },
    },
    required: ["query"],
  },
};

export async function searchText(
  args: Record<string, unknown>,
  ctx: ToolContext
) {
  const workspace = resolveWorkspace(
    args.workspace as string | undefined,
    ctx.workspace
  );
  const query = String(args.query ?? "");
  const needle = query.toLowerCase();
  if (!needle.trim()) return [];

  const exts = ((args.extensions as string[] | undefined) ?? DEFAULT_EXTENSIONS).map(
    (e) => e.toLowerCase()
  );
  const max = (args.maxResults as number | undefined) ?? 200;

  const files = await walk(workspace, {
    filesOnly: true,
    extensions: exts,
    maxResults: 10_000,
  });

  const results: Array<{
    path: string;
    relativePath: string;
    line: number;
    text: string;
  }> = [];

  for (const f of files) {
    if (results.length >= max) break;
    let content: string;
    try {
      content = await readFile(f.path, "utf8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(needle)) {
        results.push({
          path: f.path,
          relativePath: f.relativePath,
          line: i + 1,
          text: lines[i].slice(0, MAX_LINE_LEN),
        });
        if (results.length >= max) break;
      }
    }
  }

  return results;
}
