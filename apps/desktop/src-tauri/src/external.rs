use std::path::Path;

#[tauri::command]
pub fn reveal_in_file_manager(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("Not found: {}", path));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("open failed: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", path))
            .spawn()
            .map_err(|e| format!("explorer failed: {}", e))?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let target = if p.is_dir() {
            p.to_path_buf()
        } else {
            p.parent().unwrap_or(p).to_path_buf()
        };
        std::process::Command::new("xdg-open")
            .arg(&target)
            .spawn()
            .map_err(|e| format!("xdg-open failed: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn open_in_editor(path: String, editor_cmd: Option<String>) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("Not found: {}", path));
    }

    let cmd_str = editor_cmd
        .filter(|s| !s.trim().is_empty())
        .or_else(|| std::env::var("VISUAL").ok().filter(|s| !s.is_empty()))
        .or_else(|| std::env::var("EDITOR").ok().filter(|s| !s.is_empty()))
        .unwrap_or_else(|| "code".to_string());

    let parts: Vec<&str> = cmd_str.split_whitespace().collect();
    let (program, args) = match parts.split_first() {
        Some(pair) => pair,
        None => return Err("Editor command is empty".to_string()),
    };

    std::process::Command::new(program)
        .args(args)
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to spawn '{}': {}", cmd_str, e))?;

    Ok(())
}
