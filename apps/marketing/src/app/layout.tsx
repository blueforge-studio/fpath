import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fpath — File Browser Companion",
  description:
    "Navigate, preview, and copy file paths fast. A desktop file browser built for developers who work in the terminal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
