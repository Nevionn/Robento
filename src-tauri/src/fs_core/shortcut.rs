use serde::Serialize;
use std::path::Path;
use std::process::Command;

use lnk::{
    encoding::WINDOWS_1252,
    ShellLink,
};

use windows_icons::get_icon_base64_by_path;


#[derive(Serialize)]
pub struct Shortcut {
    pub id: String,
    pub name: String,
    pub target: String,
    pub source: String,
    pub icon: Option<String>,
}

/**
 * Разбирает Windows-ярлык (.lnk) и преобразует его
 * в структуру Shortcut для фронтенда.
 *
 * Выполняет:
 * - открытие и чтение .lnk-файла;
 * - получение пути к целевому файлу;
 * - извлечение имени ярлыка из имени целевого файла;
 * - получение иконки целевого файла в формате Base64 Data URL.
 */


#[tauri::command]
pub fn parse_shortcut(path: String) -> Result<Shortcut, String> {

    let shortcut =
        ShellLink::open(
            &path,
            WINDOWS_1252
        )
        .map_err(|e| e.to_string())?;


    let target =
        shortcut
            .link_target()
            .unwrap_or_default();


    let name =
        Path::new(&target)
            .file_stem()
            .unwrap()
            .to_string_lossy()
            .to_string();


    let icon =
        get_icon_base64_by_path(&target)
            .ok()
            .map(|base64| {
                format!(
                    "data:image/png;base64,{}",
                    base64
                )
            });



    Ok(Shortcut {
        id: target.clone(),
        name,
        target,
        source: path,
        icon,
    })
}


#[tauri::command]
pub fn launch_shortcut(target: String) -> Result<(), String> {
    Command::new(&target)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}