use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
    WindowEvent,
};

pub fn setup_tray(app: &mut tauri::App) -> tauri::Result<()> {
    let window = app.get_webview_window("main").unwrap();
    let window_hide = window.clone();

    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = window_hide.hide();
        }
    });

    let show_item = MenuItem::with_id(
        app,
        "show",
        "Show",
        true,
        None::<&str>,
    )?;

    let quit_item = MenuItem::with_id(
        app,
        "quit",
        "Quit",
        true,
        None::<&str>,
    )?;

    let menu = Menu::with_items(
        app,
        &[&show_item, &quit_item],
    )?;

    // Трей
    let _tray = TrayIconBuilder::new()
        .tooltip("Robento")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }

                "quit" => {
                    app.exit(0);
                }

                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}