#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { dispatch, TOOLS } from "./tools.js";

function parseWorkspaceArg(): string | undefined {
  try {
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        workspace: { type: "string", short: "w" },
      },
      allowPositionals: true,
      strict: false,
    });
    const arg = values.workspace as string | undefined;
    const fromEnv = process.env.FPATH_WORKSPACE;
    const ws = arg ?? fromEnv;
    return ws ? resolve(ws) : undefined;
  } catch {
    return process.env.FPATH_WORKSPACE
      ? resolve(process.env.FPATH_WORKSPACE)
      : undefined;
  }
}

async function main(): Promise<void> {
  const workspace = parseWorkspaceArg();

  const server = new Server(
    { name: "fpath", version: "0.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const args = (req.params.arguments ?? {}) as Record<string, unknown>;
    return dispatch(req.params.name, args, { workspace });
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Stderr log so users can confirm the server started; stdout is for MCP framing only.
  console.error(
    `[fpath-mcp] ready${workspace ? ` (workspace: ${workspace})` : " (no workspace configured)"}`
  );
}

main().catch((err) => {
  console.error("[fpath-mcp] fatal:", err);
  process.exit(1);
});
