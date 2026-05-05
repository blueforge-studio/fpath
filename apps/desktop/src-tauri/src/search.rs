use crate::types::TextMatch;
use std::fs;
use std::path::Path;

const SEARCH_IGNORED_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "target",
    "dist",
    ".turbo",
    ".next",
    "__pycache__",
    "build",
    "out",
    ".vercel",
    ".cache",
    ".DS_Store",
];

fn search_text_walk(
    dir: &Path,
    workspace: &Path,
    needle_lower: &str,
    extensions: &[String],
    max_results: usize,
    out: &mut Vec<TextMatch>,
) {
    if out.len() >= max_results {
        return;
    }
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        if out.len() >= max_results {
            return;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if SEARCH_IGNORED_DIRS.contains(&name.as_str()) {
            continue;
        }
        let path = entry.path();
        let ft = match entry.file_type() {
            Ok(t) => t,
            Err(_) => continue,
        };
        if ft.is_symlink() {
            continue;
        }
        if ft.is_dir() {
            search_text_walk(&path, workspace, needle_lower, extensions, max_results, out);
            continue;
        }
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if !extensions.iter().any(|e| e == &ext) {
            continue;
        }
        let content = match fs::read_to_string(&path) {
            Ok(c) => c,
            Err(_) => continue,
        };
        for (idx, line) in content.lines().enumerate() {
            if line.to_lowercase().contains(needle_lower) {
                let abs = path.to_string_lossy().to_string();
                let rel = path
                    .strip_prefix(workspace)
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|_| abs.clone());
                let trimmed: String = line.chars().take(300).collect();
                out.push(TextMatch {
                    path: abs,
                    relative_path: rel,
                    line_number: (idx + 1) as u32,
                    line_text: trimmed,
                });
                if out.len() >= max_results {
                    return;
                }
            }
        }
    }
}

#[tauri::command]
pub fn search_text(
    workspace_path: String,
    query: String,
    extensions: Vec<String>,
    max_results: Option<usize>,
) -> Result<Vec<TextMatch>, String> {
    if query.is_empty() || extensions.is_empty() {
        return Ok(Vec::new());
    }
    let workspace = Path::new(&workspace_path);
    if !workspace.is_dir() {
        return Err(format!("Not a directory: {}", workspace_path));
    }
    let cap = max_results.unwrap_or(500);
    let needle = query.to_lowercase();
    let exts_lower: Vec<String> = extensions.iter().map(|e| e.to_lowercase()).collect();
    let mut results = Vec::new();
    search_text_walk(workspace, workspace, &needle, &exts_lower, cap, &mut results);
    Ok(results)
}
