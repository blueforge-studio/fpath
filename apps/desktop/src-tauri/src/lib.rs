mod external;
mod fs_commands;
mod search;
mod types;

use external::{open_in_editor, reveal_in_file_manager};
use fs_commands::{file_exists, list_directory, read_file};
use ignore::WalkBuilder;
use search::search_text;
use std::fs;
use std::path::Path;

const DEFAULT_IGNORE_PATTERNS: &[&str] = &[
    "node_modules", ".git", "dist", ".turbo", ".next", "target",
    "__pycache__", ".DS_Store", "Thumbs.db",
];

#[tauri::command]
fn list_all_files(workspace_root: &str) -> Result<Vec<FileEntry>, String> {
    let mut result: Vec<FileEntry> = Vec::new();
    let mut builder = WalkBuilder::new(workspace_root);
    builder.standard_filters(true);
    builder.hidden(false);

    let searchignore_path = Path::new(workspace_root).join(".searchignore");
    if searchignore_path.exists() {
        builder.add_custom_ignore_filename(".searchignore");
    }

    for entry in builder.build().flatten() {
        if entry.file_type().map_or(false, |ft| ft.is_dir()) {
            continue;
        }
        let abs_path = entry.path().to_string_lossy().to_string();
        let relative_path = abs_path
            .strip_prefix(&format!("{}/", workspace_root))
            .unwrap_or(&abs_path)
            .to_string();
        let name = entry.path()
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let extension = entry.path()
            .extension()
            .map(|e| e.to_string_lossy().to_string());

        let should_skip = DEFAULT_IGNORE_PATTERNS.iter().any(|pattern| {
            let p = pattern.trim_end_matches('/');
            relative_path == p
                || relative_path.starts_with(&format!("{}/", p))
                || relative_path.contains(&format!("/{}/", p))
        });
        if should_skip { continue; }

        result.push(FileEntry {
            name,
            path: abs_path,
            relative_path,
            kind: "file".into(),
            extension,
            is_symlink: entry.file_type().map_or(false, |ft| ft.is_symlink()),
            children: None,
        });
    }

    result.sort_by(|a, b| {
        a.relative_path.to_lowercase().cmp(&b.relative_path.to_lowercase())
    });

    Ok(result)
}

#[tauri::command]
fn read_search_ignore(workspace_root: &str) -> Result<String, String> {
    let path = Path::new(workspace_root).join(".searchignore");
    if path.exists() {
        fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read {}: {}", path.display(), e))
    } else {
        Ok(String::new())
    }
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
            list_all_files,
            read_search_ignore,
            reveal_in_file_manager,
            open_in_editor,
        ])
        .run(tauri::generate_context!())
        .expect("error while running fpath");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_entry_serialization() {
        let entry = FileEntry {
            name: "test.ts".into(),
            path: "/ws/test.ts".into(),
            relative_path: "test.ts".into(),
            kind: "file".into(),
            extension: Some("ts".into()),
            is_symlink: false,
            children: None,
        };
        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("test.ts"));
        assert!(json.contains("file"));
    }

    #[test]
    fn test_directory_entry_has_children_vec() {
        let entry = FileEntry {
            name: "src".into(),
            path: "/ws/src".into(),
            relative_path: "src".into(),
            kind: "directory".into(),
            extension: None,
            is_symlink: false,
            children: Some(Vec::new()),
        };
        assert_eq!(entry.kind, "directory");
        assert!(entry.children.is_some());
    }
}
