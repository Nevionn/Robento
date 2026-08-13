use serde::Serialize;
use sqlx::{Row, SqlitePool};
use tauri::State;
use uuid::{Timestamp, Uuid};

const RESET_DB: bool = false;
const PRINT_SCHEMA: bool = false;

pub async fn init_groups_table(pool: &SqlitePool) {
    println!("Создание таблицы Groups...");

    if RESET_DB {
        println!("RESET_DB включен — удаляем таблицу Groups");

        sqlx::query("DROP TABLE IF EXISTS Groups")
            .execute(pool)
            .await
            .expect("Ошибка удаления таблицы Groups");
    }

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS Groups (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .expect("Ошибка создания таблицы Groups");

    println!("Таблица Groups готова");

    if PRINT_SCHEMA {
        println!("СХЕМА Groups:");

        sqlx::query("PRAGMA table_info(Groups)")
            .fetch_all(pool)
            .await
            .expect("Ошибка чтения схемы Groups")
            .iter()
            .for_each(|row| {
                println!("{:?}", row.get::<String, _>("name"));
            });
    }
}

#[derive(Debug, Serialize)]
pub struct GroupDto {
    pub id: String,
    pub title: String,
    pub sort_order: i64,
    pub created_at: String,
}

#[tauri::command]
pub async fn create_group(
    pool: State<'_, SqlitePool>,
    title: String,
    sort_order: i64,
) -> Result<GroupDto, String> {
    let timestamp = Timestamp::now(uuid::NoContext);

    let id = Uuid::new_v6(
        timestamp,
        &[0, 0, 0, 0, 0, 0],
    )
    .to_string();

    let created_at: String = sqlx::query_scalar(
        "SELECT datetime('now')"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        r#"
        INSERT INTO Groups (
            id,
            title,
            sort_order,
            created_at
        )
        VALUES (?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&title)
    .bind(sort_order)
    .bind(&created_at)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(GroupDto {
        id,
        title,
        sort_order,
        created_at,
    })
}