const EXTENSION_ICONS: Record<string, string> = {
  ts: "🔷", tsx: "⚛️",
  js: "🟨", jsx: "⚛️",
  json: "📋",
  md: "📝", mdx: "📝",
  css: "🎨", scss: "🎨", less: "🎨",
  html: "🌐", htm: "🌐",
  rs: "🦀",
  go: "🔵",
  py: "🐍",
  rb: "💎",
  java: "☕", kt: "🟣",
  swift: "🟠",
  c: "⚙️", cpp: "⚙️", h: "⚙️", hpp: "⚙️",
  sh: "💻", bash: "💻", zsh: "💻",
  yaml: "📄", yml: "📄",
  toml: "⚙️",
  sql: "🗄️",
  graphql: "◈", gql: "◈",
  svg: "🖼️", png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", ico: "🖼️",
  lock: "🔒",
  env: "🔐",
  gitignore: "🙈",
  dockerfile: "🐳",
  makefile: "🔧",
  pdf: "📕",
  zip: "📦", gz: "📦", tar: "📦", rar: "📦",
  mp3: "🎵", wav: "🎵", ogg: "🎵",
  mp4: "🎬", mov: "🎬", avi: "🎬",
  ttf: "🔤", woff: "🔤", woff2: "🔤", otf: "🔤", eot: "🔤",
};

const DIR_NAME_ICONS: Record<string, string> = {
  ".git": "🔀",
  node_modules: "📦",
  src: "📂",
  lib: "📂",
  dist: "📦",
  build: "📦",
  target: "📦",
  public: "🌐",
  assets: "🖼️",
  components: "🧩",
  hooks: "🪝",
  utils: "🔧",
  tests: "🧪",
  __tests__: "🧪",
  docs: "📝",
  ".vscode": "⚙️",
};

export function getFileIcon(name: string, kind: "file" | "directory", extension?: string): string {
  if (kind === "directory") {
    const lc = name.toLowerCase();
    for (const [key, icon] of Object.entries(DIR_NAME_ICONS)) {
      if (lc === key) return icon;
    }
    return "📁";
  }
  if (!extension) return "📄";
  return EXTENSION_ICONS[extension.toLowerCase()] ?? "📄";
}
