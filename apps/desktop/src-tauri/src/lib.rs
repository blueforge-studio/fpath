mod external;
mod fs_commands;
mod search;
mod types;

use external::{open_in_editor, reveal_in_file_manager};
use fs_commands::{file_exists, list_directory, read_file};
use search::search_text;

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
            reveal_in_file_manager,
            open_in_editor,
        ])
        .run(tauri::generate_context!())
        .expect("error while running fpath");
}
