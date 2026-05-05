import { fileFixture } from "./test-fixtures";

export const TABS = [
  fileFixture("/ws/a.ts"),
  fileFixture("/ws/b.ts"),
  fileFixture("/ws/c.ts"),
  fileFixture("/ws/d.ts"),
  fileFixture("/ws/e.ts"),
];

/**
 * Fire a keydown on `window` and report whether the handler called
 * `preventDefault()` (jsdom doesn't track this on bare KeyboardEvent).
 */
export function dispatchKey(init: KeyboardEventInit & { key: string }) {
  const event = new KeyboardEvent("keydown", { bubbles: true, ...init });
  let prevented = false;
  Object.defineProperty(event, "preventDefault", {
    value: () => {
      prevented = true;
    },
  });
  window.dispatchEvent(event);
  return { event, prevented: () => prevented };
}
