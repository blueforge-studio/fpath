import type {
  CallToolResult,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { listDirectoryTool, listDirectory } from "./tools/list-directory.js";
import { findFilesTool, findFiles } from "./tools/find-files.js";
import { searchTextTool, searchText } from "./tools/search-text.js";
import { readFileTool, readFile } from "./tools/read-file.js";

export interface ToolContext {
  workspace: string | undefined;
}

export const TOOLS: Tool[] = [
  listDirectoryTool,
  findFilesTool,
  searchTextTool,
  readFileTool,
];

export async function dispatch(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<CallToolResult> {
  try {
    const result = await runTool(name, args, ctx);
    return {
      content: [
        {
          type: "text",
          text:
            typeof result === "string"
              ? result
              : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    const message =
      typeof err === "string"
        ? err
        : err instanceof Error
          ? err.message
          : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
}

async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  switch (name) {
    case "list_directory":
      return listDirectory(args, ctx);
    case "find_files":
      return findFiles(args, ctx);
    case "search_text":
      return searchText(args, ctx);
    case "read_file":
      return readFile(args, ctx);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
