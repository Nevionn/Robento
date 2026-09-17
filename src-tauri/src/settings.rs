use std::sync::Mutex;
use tauri::State;

pub struct AppSettings {
    pub hide_on_blur: Mutex<bool>,
    pub game_mode: Mutex<bool>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            hide_on_blur: Mutex::new(false),
            game_mode: Mutex::new(false),
        }
    }
}

pub fn is_hide_on_blur(
    settings: &State<'_, AppSettings>,
) -> bool {
    settings
        .hide_on_blur
        .lock()
        .map(|value| *value)
        .unwrap_or(false)
}

#[tauri::command]
pub fn set_hide_on_blur(
    settings: State<'_, AppSettings>,
    value: bool,
) -> Result<(), String> {
    let mut hide_on_blur = settings
        .hide_on_blur
        .lock()
        .map_err(|e| e.to_string())?;

    *hide_on_blur = value;

    Ok(())
}

#[tauri::command]
pub fn get_hide_on_blur(
    settings: State<'_, AppSettings>,
) -> bool {
    is_hide_on_blur(&settings)
}

#[tauri::command]
pub fn set_game_mode(
    settings: State<'_, AppSettings>,
    value: bool,
) -> Result<(), String> {
    let mut game_mode = settings
        .game_mode
        .lock()
        .map_err(|e| e.to_string())?;

    *game_mode = value;

    Ok(())
}