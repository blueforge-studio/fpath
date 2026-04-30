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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            list_directory,
            read_file,
            file_exists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running fpath");
}
