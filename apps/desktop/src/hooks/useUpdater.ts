import { useCallback, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; version: string; notes?: string }
  | { kind: "uptodate" }
  | { kind: "downloading"; downloaded: number; total?: number }
  | { kind: "ready" }
  | { kind: "error"; message: string };

function asMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return String(err);
}

export function useUpdater() {
  const [state, setState] = useState<UpdateState>({ kind: "idle" });

  const checkForUpdates = useCallback(async () => {
    setState({ kind: "checking" });
    try {
      const update = await check();
      if (!update) {
        setState({ kind: "uptodate" });
        return;
      }
      setState({
        kind: "available",
        version: update.version,
        notes: update.body,
      });
    } catch (err) {
      setState({ kind: "error", message: asMessage(err) });
    }
  }, []);

  const installUpdate = useCallback(async () => {
    try {
      const update = await check();
      if (!update) {
        setState({ kind: "uptodate" });
        return;
      }
      let downloaded = 0;
      let total: number | undefined;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength;
          setState({ kind: "downloading", downloaded: 0, total });
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setState({ kind: "downloading", downloaded, total });
        } else if (event.event === "Finished") {
          setState({ kind: "ready" });
        }
      });
      await relaunch();
    } catch (err) {
      setState({ kind: "error", message: asMessage(err) });
    }
  }, []);

  return { state, checkForUpdates, installUpdate };
}
