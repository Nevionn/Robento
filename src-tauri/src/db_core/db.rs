use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions},
    SqlitePool,
};

use tauri::{AppHandle, Manager};

pub async fn init_db(app: &AppHandle) -> SqlitePool {
    let db_path = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory")
        .join("robento.db");

    println!("📂 Database path: {:?}", db_path);

    std::fs::create_dir_all(db_path.parent().expect("Database directory not found"))
        .expect("Failed to create database directory");

    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await
        .expect("Failed to connect to database");

    println!("🟢 Database initialized");

    pool
}

#[tauri::command]
pub fn get_database_path(app: tauri::AppHandle) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("robento.db");

    Ok(path.to_string_lossy().into_owned())
}
