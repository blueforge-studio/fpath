import { isAbsolute, resolve } from "node:path";

export function resolveWorkspace(
  arg: string | undefined,
  fallback: string | undefined
): string {
  const ws = arg ?? fallback;
  if (!ws) {
    throw new Error(
      "No workspace configured. Pass `workspace` argument, or start the server with --workspace / FPATH_WORKSPACE."
    );
  }
  return isAbsolute(ws) ? ws : resolve(ws);
}

export function resolvePath(
  arg: string | undefined,
  workspace: string | undefined
): string {
  if (!arg || arg === "" || arg === ".") {
    return resolveWorkspace(undefined, workspace);
  }
  if (isAbsolute(arg)) return arg;
  if (!workspace) {
    throw new Error(
      `Relative path "${arg}" given but no workspace is configured.`
    );
  }
  return resolve(workspace, arg);
}
