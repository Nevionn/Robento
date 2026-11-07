use std::{
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    time::Duration,
};

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};

use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use crate::settings::AppSettings;

fn show_window_temporarily_on_top(window: tauri::WebviewWindow, generation: Arc<AtomicU64>) {
    let current_generation = generation.fetch_add(1, Ordering::Relaxed) + 1;

    let _ = window.set_always_on_top(true);
    let _ = window.show();
    let _ = window.set_focus();

    let timer_window = window.clone();

    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(300));

        if generation.load(Ordering::Relaxed) == current_generation {
            let _ = timer_window.set_always_on_top(false);
        }
    });
}

pub fn setup_tray(app: &mut tauri::App) -> tauri::Result<()> {
    let window = app.get_webview_window("main").unwrap();

    let topmost_generation = Arc::new(AtomicU64::new(0));

    let window_hide = window.clone();

    window.on_window_event(move |event| match event {
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
    });

    let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;
    let tray_generation = Arc::clone(&topmost_generation);

    let _tray = TrayIconBuilder::new()
        .tooltip("Robento")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    show_window_temporarily_on_top(window, Arc::clone(&tray_generation));

                    let _ = app.emit("window-opened", ());
                }
            }

            "quit" => {
                app.exit(0);
            }

            _ => {}
        })
        .build(app)?;

    let shortcut_generation = Arc::clone(&topmost_generation);

    app.global_shortcut()
        .on_shortcut("Alt + Space", move |app, _shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }

            if let Some(window) = app.get_webview_window("main") {
                if let Ok(visible) = window.is_visible() {
                    let settings = app.state::<AppSettings>();

                    let game_mode = settings
                        .game_mode
                        .lock()
                        .map(|value| *value)
                        .unwrap_or(false);

                    if game_mode && !visible {
                        return;
                    }

                    if visible {
                        let _ = window.hide();
                    } else {
                        show_window_temporarily_on_top(window, Arc::clone(&shortcut_generation));

                        let _ = app.emit("window-opened", ());
                    }
                }
            }
        })
        .map_err(|e| tauri::Error::Anyhow(e.into()))?;

    Ok(())
}
