use serde::Serialize;
use sqlx::{Row, SqlitePool};

const RESET_DB: bool = false;
const PRINT_SCHEMA: bool = false;

pub async fn init_shortcuts_table(pool: &SqlitePool) {
    println!("Создание таблицы Shortcuts...");

    if RESET_DB {
        println!("RESET_DB включен — удаляем таблицу Shortcuts");

        sqlx::query("DROP TABLE IF EXISTS Shortcuts")
            .execute(pool)
            .await
            .expect("Ошибка удаления таблицы Shortcuts");
    }

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS Shortcuts (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            name TEXT NOT NULL,
            target TEXT NOT NULL,
            source TEXT NOT NULL,
            icon TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,

            FOREIGN KEY (group_id)
                REFERENCES Groups(id)
                ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Ошибка создания таблицы Shortcuts");

    println!("Таблица Shortcuts готова");

    if PRINT_SCHEMA {
        println!("СХЕМА Shortcuts:");

        sqlx::query("PRAGMA table_info(Shortcuts)")
            .fetch_all(pool)
            .await
            .expect("Ошибка чтения схемы Shortcuts")
            .iter()
            .for_each(|row| {
                println!("{:?}", row.get::<String, _>("name"));
            });
    }
}

#[derive(Debug, Serialize)]
pub struct ShortcutDto {
    pub id: String,
    pub group_id: String,
    pub name: String,
    pub target: String,
    pub source: String,
    pub icon: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
}