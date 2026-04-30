import { useCallback, useRef, useEffect } from "react";

interface SidebarResizerProps {
  onResize: (width: number) => void;
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

const STORE_KEY = "fpath:sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 160;
const MAX_WIDTH = 500;

export default function SidebarResizer({
  onResize,
  initialWidth = DEFAULT_WIDTH,
  minWidth = MIN_WIDTH,
  maxWidth = MAX_WIDTH,
}: SidebarResizerProps) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      const tree = (e.target as HTMLElement)
        .closest(".main-panel")
        ?.querySelector<HTMLElement>(".filetree");
      startWidth.current = tree?.offsetWidth ?? initialWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [initialWidth]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startX.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + dx));
      const tree = document.querySelector<HTMLElement>(".filetree");
      if (tree) {
        tree.style.width = `${newWidth}px`;
        tree.style.minWidth = `${newWidth}px`;
        tree.style.flex = "none";
      }
    };
    const handleMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      const tree = document.querySelector<HTMLElement>(".filetree");
      if (tree) {
        const w = tree.offsetWidth;
        onResize(w);
        import("@tauri-apps/plugin-store")
          .then(async ({ Store }) => {
            const store = await Store.load("settings.json");
            await store.set(STORE_KEY, w);
            await store.save();
          })
          .catch(() => {});
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onResize, minWidth, maxWidth]);

  return <div className="sidebar-resizer" onMouseDown={handleMouseDown} />;
}
