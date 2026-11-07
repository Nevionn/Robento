use serde::Serialize;

use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use std::process::Command;

use windows_sys::Win32::UI::Shell::ShellExecuteW;
use windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

use lnk::{encoding::WINDOWS_1252, ShellLink};

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

fn shortcut_from_target(
    target: String,
    source: String,
    reserve_path2icon: Option<String>,
) -> Shortcut {
    let name = Path::new(&target)
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let icon = match get_icon_base64_by_path(&target) {
        Ok(base64) => Some(base64),
        Err(_) => reserve_path2icon
            .as_deref()
            .and_then(|path| get_icon_base64_by_path(path).ok()),
    }
    .map(|base64| format!("data:image/png;base64,{base64}"));

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
    let shortcut = ShellLink::open(&path, WINDOWS_1252).map_err(|e| e.to_string())?;

    let target = shortcut.link_target().unwrap_or_default();

    Ok(shortcut_from_target(target, path, None))
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

    let path = file_path.into_path().map_err(|e| e.to_string())?;

    let target = path.to_string_lossy().to_string();

    let shortcut = shortcut_from_target(target.clone(), target, None);

    Ok(Some(shortcut))
}

/**
 * Запускает исполняемый файл по указанному пути без UAC.
 * Программы, требующие администратора, автоматически запускаются через runas.
 *
 * Создаёт новый процесс и возвращает результат его запуска.
 */

#[tauri::command]
pub fn launch_shortcut(target: String) -> Result<(), String> {
    let executable = Path::new(&target);

    let working_dir = executable
        .parent()
        .ok_or_else(|| "Не удалось определить рабочую директорию".to_string())?;

    let working_dir_wide: Vec<u16> = working_dir
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    match Command::new(&target).current_dir(working_dir).spawn() {
        Ok(_) => Ok(()),

        Err(error) if error.raw_os_error() == Some(740) => {
            let target_wide: Vec<u16> = executable
                .as_os_str()
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();

            let verb: Vec<u16> = "runas".encode_utf16().chain(std::iter::once(0)).collect();

            let result = unsafe {
                ShellExecuteW(
                    std::ptr::null_mut(),
                    verb.as_ptr(),
                    target_wide.as_ptr(),
                    std::ptr::null(),
                    working_dir_wide.as_ptr(),
                    SW_SHOWNORMAL,
                )
            };

            if result as isize <= 32 {
                return Err(format!(
                    "Не удалось запустить программу через UAC (код ошибки: {})",
                    result as isize
                ));
            }

            Ok(())
        }

        Err(error) => Err(error.to_string()),
    }
}
