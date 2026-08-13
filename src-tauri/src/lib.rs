mod fs_core;
mod db_core;

use db_core::db::init_db;
use db_core::groups::{init_groups_table, create_group};
use db_core::shortcuts::init_shortcuts_table;
use fs_core::shortcut::{launch_shortcut, parse_shortcut};

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            tauri::async_runtime::block_on(async move {
                let pool = init_db(&handle).await;
                init_groups_table(&pool).await;
                init_shortcuts_table(&pool).await;

                handle.manage(pool);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            parse_shortcut,
            launch_shortcut,
            create_group
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}