use serde::Serialize;
use sqlx::{Row, SqlitePool};
use uuid::{Timestamp, Uuid};

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

#[tauri::command]
pub async fn create_shortcut(
    pool: tauri::State<'_, SqlitePool>,
    group_id: String,
    name: String,
    target: String,
    source: String,
    icon: Option<String>,
) -> Result<ShortcutDto, String> {
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

    let sort_order: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(MAX(sort_order), -1) + 1
        FROM Shortcuts
        WHERE group_id = ?
        "#,
    )
    .bind(&group_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        r#"
        INSERT INTO Shortcuts (
            id,
            group_id,
            name,
            target,
            source,
            icon,
            sort_order,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&group_id)
    .bind(&name)
    .bind(&target)
    .bind(&source)
    .bind(&icon)
    .bind(sort_order)
    .bind(&created_at)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(ShortcutDto {
        id,
        group_id,
        name,
        target,
        source,
        icon,
        sort_order,
        created_at,
    })
}

#[tauri::command]
pub async fn get_shortcuts(
    pool: tauri::State<'_, SqlitePool>,
) -> Result<Vec<ShortcutDto>, String> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            group_id,
            name,
            target,
            source,
            icon,
            sort_order,
            created_at
        FROM Shortcuts
        ORDER BY group_id ASC, sort_order ASC
        "#,
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows
        .into_iter()
        .map(|row| ShortcutDto {
            id: row.get("id"),
            group_id: row.get("group_id"),
            name: row.get("name"),
            target: row.get("target"),
            source: row.get("source"),
            icon: row.get("icon"),
            sort_order: row.get("sort_order"),
            created_at: row.get("created_at"),
        })
        .collect())
}

#[tauri::command]
pub async fn update_shortcuts_order(
    pool: tauri::State<'_, SqlitePool>,
    shortcuts: Vec<(String, String, i64)>,
) -> Result<(), String> {
    let mut transaction = pool
        .begin()
        .await
        .map_err(|e| e.to_string())?;

    for (id, group_id, sort_order) in shortcuts {
        sqlx::query(
            r#"
            UPDATE Shortcuts
            SET
                group_id = ?,
                sort_order = ?
            WHERE id = ?
            "#,
        )
        .bind(group_id)
        .bind(sort_order)
        .bind(id)
        .execute(&mut *transaction)
        .await
        .map_err(|e| e.to_string())?;
    }

    transaction
        .commit()
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_shortcut(
    pool: tauri::State<'_, SqlitePool>,
    id: String,
) -> Result<(), String> {
    sqlx::query(
        r#"
        DELETE FROM Shortcuts
        WHERE id = ?
        "#,
    )
    .bind(&id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}