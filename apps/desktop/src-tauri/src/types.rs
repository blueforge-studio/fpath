use serde::{Deserialize, Serialize};

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

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TextMatch {
    pub path: String,
    pub relative_path: String,
    pub line_number: u32,
    pub line_text: String,
}
