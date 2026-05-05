import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fpath — File Browser Companion",
  description:
    "Navigate, preview, edit, and copy file paths fast. A keyboard-first desktop file browser with a Monaco editor, a Bubble Tea TUI, and an MCP server for AI agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
