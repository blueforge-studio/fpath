export const MAX_BYTES = 2_000_000;

export const LANG_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  css: "css",
  scss: "scss",
  html: "html",
  rs: "rust",
  go: "go",
  py: "python",
  rb: "ruby",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  cs: "csharp",
  yaml: "yaml",
  yml: "yaml",
  toml: "ini",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  dockerfile: "dockerfile",
  xml: "xml",
  svg: "xml",
};

export function languageForExtension(ext: string | undefined | null): string {
  if (!ext) return "plaintext";
  return LANG_MAP[ext.toLowerCase()] ?? "plaintext";
}

export function maybeTruncate(text: string): { final: string; truncated: boolean } {
  if (text.length <= MAX_BYTES) {
    return { final: text, truncated: false };
  }
  return {
    final:
      text.slice(0, MAX_BYTES) +
      `\n\n— truncated at ${MAX_BYTES.toLocaleString()} chars —`,
    truncated: true,
  };
}

export function asMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return String(err);
}
