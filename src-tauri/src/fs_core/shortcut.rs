use serde::Serialize;

use std::path::Path;
use std::process::Command;

use lnk::{
    encoding::WINDOWS_1252,
    ShellLink,
};

use tauri_plugin_dialog::DialogExt;
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
 * Создаёт структуру Shortcut по пути к целевому файлу.
 *
 * Выполняет:
 * - получение имени файла без расширения;
 * - получение иконки целевого файла;
 * - преобразование иконки в Base64 Data URL;
 * - формирование структуры Shortcut.
 */

fn shortcut_from_target(target: String, source: String) -> Shortcut {
    let name = Path::new(&target)
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let icon = get_icon_base64_by_path(&target)
        .ok()
        .map(|base64| {
            format!("data:image/png;base64,{}", base64)
        });

    Shortcut {
        id: target.clone(),
        name,
        target,
        source,
        icon,
    }
}

/**
 * Разбирает Windows-ярлык (.lnk) и преобразует его
 * в структуру Shortcut для фронтенда.
 *
 * Выполняет:
 * - открытие и чтение .lnk-файла;
 * - получение пути к целевому файлу;
 * - создание данных ярлыка и получение его иконки.
 */

#[tauri::command]
pub fn parse_shortcut(path: String) -> Result<Shortcut, String> {
    let shortcut = ShellLink::open(
        &path,
        WINDOWS_1252,
    )
    .map_err(|e| e.to_string())?;

    let target = shortcut
        .link_target()
        .unwrap_or_default();

    Ok(shortcut_from_target(target, path))
}

/**
 * Открывает системное окно выбора исполняемого файла (.exe)
 * и преобразует выбранный файл в структуру Shortcut.
 *
 * При отмене выбора возвращает None.
 */

#[tauri::command]
pub fn pick_executable(app: tauri::AppHandle) -> Result<Option<Shortcut>, String> {
    let file_path = app
        .dialog()
        .file()
        .add_filter("Executable", &["exe"])
        .blocking_pick_file();

    let Some(file_path) = file_path else {
        return Ok(None);
    };

    let path = file_path
        .into_path()
        .map_err(|e| e.to_string())?;

    let target = path
        .to_string_lossy()
        .to_string();

    let shortcut = shortcut_from_target(
        target.clone(),
        target,
    );

    Ok(Some(shortcut))
}

/**
 * Запускает исполняемый файл по указанному пути.
 *
 * Создаёт новый процесс и возвращает результат его запуска.
 */

#[tauri::command]
pub fn launch_shortcut(target: String) -> Result<(), String> {
    Command::new(&target)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}