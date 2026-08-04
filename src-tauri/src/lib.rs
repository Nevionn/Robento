mod fs_core;

use fs_core::shortcut::{parse_shortcut, launch_shortcut};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    tauri::Builder::default()
        .plugin(
            tauri_plugin_opener::init()
        )
        .invoke_handler(
            tauri::generate_handler![
                parse_shortcut,
                launch_shortcut
            ]
        )
        .run(
            tauri::generate_context!()
        )
        .expect("error while running tauri application");
}