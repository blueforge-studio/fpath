use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub kind: String,
    pub extension: Option<String>,
    pub is_symlink: bool,
    pub children: Option<Vec<FileEntry>>,
}

#[tauri::command]
fn list_directory(dir_path: &str, workspace_root: &str) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(dir_path);
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", dir_path));
    }

    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut result: Vec<FileEntry> = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let file_path = entry.path();
        let abs_path = file_path.to_string_lossy().to_string();
        let relative_path = abs_path
            .strip_prefix(&format!("{}/", workspace_root))
            .unwrap_or(&abs_path)
            .to_string();

        let name = file_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let is_dir = metadata.is_dir();
        let extension = file_path
            .extension()
            .map(|e| e.to_string_lossy().to_string());

        result.push(FileEntry {
            name,
            path: abs_path,
            relative_path,
            kind: if is_dir {
                "directory".into()
            } else {
                "file".into()
            },
            extension,
            is_symlink: metadata.is_symlink(),
            children: if is_dir { Some(Vec::new()) } else { None },
        });
    }

    // Sort: directories first, then alphabetical
    result.sort_by(|a, b| {
        if a.kind != b.kind {
            if a.kind == "directory" {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(result)
}

#[tauri::command]
fn read_file(file_path: &str) -> Result<String, String> {
    fs::read_to_string(file_path).map_err(|e| format!("Failed to read {}: {}", file_path, e))
}

#[tauri::command]
fn file_exists(file_path: &str) -> bool {
    Path::new(file_path).exists()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TextMatch {
    pub path: String,
    pub relative_path: String,
    pub line_number: u32,
    pub line_text: String,
}

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
fn search_text(
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::Manager;

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let app_handle = app.handle().clone();
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |_app, shortcut, event| {
                            if event.state() != ShortcutState::Pressed {
                                return;
                            }
                            let toggle = Shortcut::new(
                                Some(Modifiers::SUPER | Modifiers::ALT),
                                Code::Space,
                            );
                            if shortcut == &toggle {
                                if let Some(popup) = app_handle.get_webview_window("popup") {
                                    let visible = popup.is_visible().unwrap_or(false);
                                    if visible {
                                        let _ = popup.hide();
                                    } else {
                                        let _ = popup.show();
                                        let _ = popup.set_focus();
                                    }
                                }
                            }
                        })
                        .build(),
                )?;

                let toggle = Shortcut::new(
                    Some(Modifiers::SUPER | Modifiers::ALT),
                    Code::Space,
                );
                app.global_shortcut().register(toggle)?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_directory,
            read_file,
            file_exists,
            search_text,
        ])
        .run(tauri::generate_context!())
        .expect("error while running fpath");
}
