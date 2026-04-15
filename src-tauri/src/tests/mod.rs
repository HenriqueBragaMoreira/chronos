pub mod tasks;

use serial_test::serial;
use sqlx::{PgPool, postgres::PgPoolOptions};

/// Creates a PgPool connected to the test database and runs pending migrations.
///
/// Reads TEST_DATABASE_URL first, then falls back to DATABASE_URL.
/// Requires Docker (chronos-db) to be running: `docker compose up -d`.
pub async fn setup_test_pool() -> PgPool {
    dotenvy::dotenv().ok();

    let url = std::env::var("TEST_DATABASE_URL")
        .or_else(|_| std::env::var("DATABASE_URL"))
        .expect("TEST_DATABASE_URL or DATABASE_URL must be set for integration tests");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await
        .expect("Failed to connect to test database");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations on test DB");

    pool
}

/// Removes all task-related rows and resets the settings singleton to defaults.
///
/// Call this at the start of each integration test to ensure a clean slate.
pub async fn clean_db(pool: &PgPool) {
    sqlx::query("DELETE FROM task_occurrences")
        .execute(pool)
        .await
        .expect("Failed to clear task_occurrences");

    sqlx::query("DELETE FROM tasks")
        .execute(pool)
        .await
        .expect("Failed to clear tasks");

    sqlx::query(
        r#"
        UPDATE settings
        SET notification_time      = '08:00',
            notification_sound_enabled = true,
            theme                  = 'system',
            default_view           = 'dashboard',
            updated_at             = NOW()
        WHERE id = 1
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to reset settings to defaults");
}

// ---------------------------------------------------------------------------
// Smoke tests — verify the test infrastructure itself
// ---------------------------------------------------------------------------

#[serial]
#[tokio::test]
async fn db_connection_works() {
    let pool = setup_test_pool().await;
    let row: (i32,) = sqlx::query_as("SELECT 1 AS n")
        .fetch_one(&pool)
        .await
        .expect("SELECT 1 should succeed");
    assert_eq!(row.0, 1);
}

#[serial]
#[tokio::test]
async fn clean_db_clears_tasks_and_occurrences() {
    let pool = setup_test_pool().await;
    clean_db(&pool).await;

    let tasks: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tasks")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(tasks.0, 0);

    let occs: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM task_occurrences")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(occs.0, 0);
}

#[serial]
#[tokio::test]
async fn settings_singleton_exists_after_clean() {
    let pool = setup_test_pool().await;
    clean_db(&pool).await;

    let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM settings WHERE id = 1")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(row.0, 1);
}
