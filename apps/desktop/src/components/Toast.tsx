import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export default function Toast({ message, onDismiss, durationMs = 2500 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite" onClick={onDismiss}>
      {message}
    </div>
  );
}
