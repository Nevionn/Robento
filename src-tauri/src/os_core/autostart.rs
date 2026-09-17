#[cfg(target_os = "windows")]
use std::env;

#[cfg(target_os = "windows")]
use winreg::{
    enums::HKEY_CURRENT_USER,
    RegKey,
};

#[cfg(target_os = "windows")]
const RUN_KEY: &str =
    "Software\\Microsoft\\Windows\\CurrentVersion\\Run";

#[cfg(target_os = "windows")]
const APP_NAME: &str = "Robento";

#[cfg(target_os = "windows")]
pub fn set_autostart(enabled: bool) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let (run_key, _) = hkcu
        .create_subkey(RUN_KEY)
        .map_err(|e| e.to_string())?;

    if enabled {
        let exe_path = env::current_exe()
            .map_err(|e| e.to_string())?;

        let exe_path = format!(
            "\"{}\"",
            exe_path.display()
        );

        run_key
            .set_value(APP_NAME, &exe_path)
            .map_err(|e| e.to_string())?;
    } else {
        match run_key.delete_value(APP_NAME) {
            Ok(_) => {}
            Err(error)
                if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => {
                return Err(error.to_string());
            }
        }
    }

    Ok(())
}

#[cfg(target_os = "windows")]
#[tauri::command]
pub fn set_launch_on_startup(
    value: bool,
) -> Result<(), String> {
    set_autostart(value)
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub fn set_launch_on_startup(
    _value: bool,
) -> Result<(), String> {
    Err(
        "Автозапуск через реестр доступен только в Windows"
            .to_string(),
    )
}