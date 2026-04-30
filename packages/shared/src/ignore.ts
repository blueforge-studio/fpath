const DEFAULT_IGNORE = [
  "node_modules",
  ".git",
  "dist",
  ".turbo",
  ".next",
  "target",
  "__pycache__",
  ".DS_Store",
  "Thumbs.db",
  "*.log",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ignoreInstance: any = null;
let customPatterns: string[] = [];

function parseIgnoreFile(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function matchPatterns(filePath: string, patterns: string[]): boolean {
  return patterns.some(
    (pattern) =>
      filePath === pattern || filePath.startsWith(pattern + "/")
  );
}

export function loadSearchIgnore(content: string): void {
  customPatterns = parseIgnoreFile(content);
  ignoreInstance = null;
}

async function getIgnoreInstance() {
  if (ignoreInstance) return ignoreInstance;
  try {
    const ig = await import("ignore");
    const patterns = [...DEFAULT_IGNORE, ...customPatterns];
    ignoreInstance = ig.default().add(patterns);
  } catch {
    ignoreInstance = null;
  }
  return ignoreInstance;
}

export async function shouldIgnore(filePath: string): Promise<boolean> {
  const ig = await getIgnoreInstance();
  if (ig) return ig.ignores(filePath);
  return matchPatterns(filePath, [...DEFAULT_IGNORE, ...customPatterns]);
}

export function shouldIgnoreSync(filePath: string): boolean {
  return matchPatterns(filePath, [...DEFAULT_IGNORE, ...customPatterns]);
}
