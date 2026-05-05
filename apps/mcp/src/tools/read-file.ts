import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { readFile as fsReadFile, stat } from "node:fs/promises";
import { resolvePath } from "../paths.js";
import type { ToolContext } from "../tools.js";

const DEFAULT_MAX_BYTES = 1_000_000;

export const readFileTool: Tool = {
  name: "read_file",
  description:
    "Read a UTF-8 text file from the workspace. Returns the content (size-capped) plus byte size and a `truncated` flag if the file exceeded the cap.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Absolute or workspace-relative path to a text file.",
      },
      maxBytes: {
        type: "number",
        default: DEFAULT_MAX_BYTES,
        description:
          "Maximum number of characters to return. Larger files are truncated.",
      },
    },
    required: ["path"],
  },
};

export async function readFile(
  args: Record<string, unknown>,
  ctx: ToolContext
) {
  const path = resolvePath(args.path as string | undefined, ctx.workspace);
  const max = (args.maxBytes as number | undefined) ?? DEFAULT_MAX_BYTES;

  const s = await stat(path);
  if (!s.isFile()) {
    throw new Error(`Not a file: ${path}`);
  }

  const content = await fsReadFile(path, "utf8");
  if (content.length > max) {
    return {
      path,
      bytes: s.size,
      truncated: true,
      content:
        content.slice(0, max) +
        `\n\n— truncated at ${max.toLocaleString()} chars —`,
    };
  }
  return { path, bytes: s.size, truncated: false, content };
}
