mod fs_core;
mod db_core;
mod os_core;
mod tray;
mod settings;

use db_core::db::init_db;

use db_core::groups::{
    init_groups_table,
    create_group,
    get_groups,
    update_group_title,
    update_groups_order,
    delete_group,
    has_groups,
};

use db_core::shortcuts::{
    init_shortcuts_table,
    create_shortcut,
    get_shortcuts,
    update_shortcuts_order,
    delete_shortcut,
};

use os_core::autostart::{
    set_launch_on_startup
};

use settings::{
    AppSettings,
    get_hide_on_blur,
    set_hide_on_blur,
    set_game_mode,
};

use fs_core::shortcut::{
    launch_shortcut,
    parse_shortcut,
    pick_executable,
};

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()

        .manage(AppSettings::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new().build()
        )
        .plugin(tauri_plugin_dialog::init())

        .setup(|app| {
            let handle = app.handle().clone();

            tauri::async_runtime::block_on(async move {
                let pool = init_db(&handle).await;

                init_groups_table(&pool).await;
                init_shortcuts_table(&pool).await;

                handle.manage(pool);
            });

            tray::setup_tray(app)?;

            Ok(())
        })

        .invoke_handler(tauri::generate_handler![
            parse_shortcut,
            launch_shortcut,
            pick_executable,

            create_shortcut,
            get_shortcuts,
            update_shortcuts_order,
            delete_shortcut,

            create_group,
            get_groups,
            update_group_title,
            update_groups_order,
            delete_group,
            has_groups,

            get_hide_on_blur,
            set_hide_on_blur,
            set_game_mode,

            set_launch_on_startup
        ])

        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}