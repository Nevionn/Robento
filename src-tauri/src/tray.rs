use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
    WindowEvent,
};

use tauri_plugin_global_shortcut::{
    GlobalShortcutExt,
    ShortcutState,
};

use crate::settings::AppSettings;

pub fn setup_tray(app: &mut tauri::App) -> tauri::Result<()> {

    let window = app
        .get_webview_window("main")
        .unwrap();

    let window_hide = window.clone();

    window.on_window_event(move |event| {
        match event {

            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();

                let _ = window_hide.hide();
            }

            WindowEvent::Focused(false) => {
                let app_handle = window_hide.app_handle();
                let settings = app_handle.state::<AppSettings>();

                let hide_on_blur = settings
                    .hide_on_blur
                    .lock()
                    .map(|value| *value)
                    .unwrap_or(false);

                if hide_on_blur {
                    let _ = window_hide.hide();
                }
            }

            _ => {}
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
        &[
            &show_item,
            &quit_item,
        ],
    )?;


    let _tray = TrayIconBuilder::new()
        .tooltip("Robento")
        .icon(
            app.default_window_icon()
                .unwrap()
                .clone(),
        )
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id().as_ref() {

                "show" => {
                    if let Some(window) =
                        app.get_webview_window("main")
                    {
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


    app.global_shortcut()
        .on_shortcut(
            "Alt+B",
            move |app, _shortcut, event| {

                if event.state != ShortcutState::Pressed {
                    return;
                }

                if let Some(window) =
                    app.get_webview_window("main")
                {
                    if let Ok(visible) =
                        window.is_visible()
                    {
                        if visible {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
            },
        )
        .map_err(|e| tauri::Error::Anyhow(e.into()))?;

    Ok(())
}