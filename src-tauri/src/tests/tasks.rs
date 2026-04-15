use chrono::NaiveDate;
use serial_test::serial;
use uuid::Uuid;

use crate::commands::tasks::{complete_task_inner, create_task_inner};
use crate::models::CreateTaskRequest;

// ---------------------------------------------------------------------------
// create_task integration tests
// ---------------------------------------------------------------------------

#[serial]
#[tokio::test]
async fn create_simple_task_inserts_task_and_occurrence() {
    let pool = super::setup_test_pool().await;
    super::clean_db(&pool).await;

    let request = CreateTaskRequest {
        name: "Buy groceries".to_string(),
        description: Some("Milk, eggs, bread".to_string()),
        category: Some("Casa".to_string()),
        priority: Some("high".to_string()),
        due_date: NaiveDate::from_ymd_opt(2026, 5, 1).unwrap(),
        due_time: None,
        recurrence_type: None,
        recurrence_value: None,
    };

    let task = create_task_inner(&pool, request).await.expect("should create task");

    assert_eq!(task.name, "Buy groceries");
    assert_eq!(task.priority, "high");
    assert_eq!(task.recurrence_type, "none");
    assert_eq!(task.due_date, NaiveDate::from_ymd_opt(2026, 5, 1).unwrap());
    assert!(!task.is_deleted);

    let occ_count: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM task_occurrences WHERE task_id = $1")
            .bind(task.id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(occ_count.0, 1, "exactly one initial occurrence should be created");

    let occ_due: (NaiveDate,) =
        sqlx::query_as("SELECT due_date FROM task_occurrences WHERE task_id = $1")
            .bind(task.id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(occ_due.0, task.due_date, "occurrence due_date must match task due_date");
}

#[serial]
#[tokio::test]
async fn create_recurring_task_generates_first_occurrence() {
    let pool = super::setup_test_pool().await;
    super::clean_db(&pool).await;

    let request = CreateTaskRequest {
        name: "Weekly review".to_string(),
        description: None,
        category: None,
        priority: None,
        due_date: NaiveDate::from_ymd_opt(2026, 5, 4).unwrap(), // Monday
        due_time: None,
        recurrence_type: Some("weekly".to_string()),
        recurrence_value: Some(1), // Monday = 1
    };

    let task = create_task_inner(&pool, request).await.expect("should create recurring task");

    assert_eq!(task.recurrence_type, "weekly");
    assert_eq!(task.recurrence_value, Some(1));

    let occ_count: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM task_occurrences WHERE task_id = $1")
            .bind(task.id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(occ_count.0, 1, "create_task creates exactly one initial occurrence");

    let occ: (NaiveDate, bool) =
        sqlx::query_as("SELECT due_date, completed FROM task_occurrences WHERE task_id = $1")
            .bind(task.id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(occ.0, task.due_date, "first occurrence due_date matches task due_date");
    assert!(!occ.1, "initial occurrence starts as not completed");
}

#[serial]
#[tokio::test]
async fn create_task_rejects_empty_name() {
    let pool = super::setup_test_pool().await;
    super::clean_db(&pool).await;

    let request = CreateTaskRequest {
        name: "   ".to_string(), // whitespace only
        description: None,
        category: None,
        priority: None,
        due_date: NaiveDate::from_ymd_opt(2026, 5, 1).unwrap(),
        due_time: None,
        recurrence_type: None,
        recurrence_value: None,
    };

    let result = create_task_inner(&pool, request).await;
    assert!(result.is_err(), "empty name should be rejected");
    assert!(
        result.unwrap_err().contains("cannot be empty"),
        "error message should mention 'cannot be empty'"
    );
}

#[serial]
#[tokio::test]
async fn create_task_defaults_to_medium_priority() {
    let pool = super::setup_test_pool().await;
    super::clean_db(&pool).await;

    let request = CreateTaskRequest {
        name: "Task without priority".to_string(),
        description: None,
        category: None,
        priority: None,
        due_date: NaiveDate::from_ymd_opt(2026, 5, 1).unwrap(),
        due_time: None,
        recurrence_type: None,
        recurrence_value: None,
    };

    let task = create_task_inner(&pool, request).await.unwrap();
    assert_eq!(task.priority, "medium");
}

// ---------------------------------------------------------------------------
// complete_task integration tests
// ---------------------------------------------------------------------------

/// Helper: create a simple (non-recurring) task and return its first occurrence id.
async fn create_simple_task_and_get_occurrence(
    pool: &sqlx::PgPool,
    due_date: NaiveDate,
) -> (Uuid, Uuid) {
    let task = create_task_inner(
        pool,
        CreateTaskRequest {
            name: "Test task".to_string(),
            description: None,
            category: None,
            priority: None,
            due_date,
            due_time: None,
            recurrence_type: None,
            recurrence_value: None,
        },
    )
    .await
    .unwrap();

    let occ_id: (Uuid,) =
        sqlx::query_as("SELECT id FROM task_occurrences WHERE task_id = $1")
            .bind(task.id)
            .fetch_one(pool)
            .await
            .unwrap();

    (task.id, occ_id.0)
}

#[serial]
#[tokio::test]
async fn complete_simple_task_sets_completed_and_completed_at() {
    let pool = super::setup_test_pool().await;
    super::clean_db(&pool).await;

    let due_date = NaiveDate::from_ymd_opt(2026, 5, 1).unwrap();
    let (_, occ_id) = create_simple_task_and_get_occurrence(&pool, due_date).await;

    complete_task_inner(&pool, occ_id).await.expect("should complete task");

    let row: (bool, Option<chrono::DateTime<chrono::Utc>>) =
        sqlx::query_as("SELECT completed, completed_at FROM task_occurrences WHERE id = $1")
            .bind(occ_id)
            .fetch_one(&pool)
            .await
            .unwrap();

    assert!(row.0, "completed should be true");
    assert!(row.1.is_some(), "completed_at should be set");
}

#[serial]
#[tokio::test]
async fn complete_simple_task_does_not_create_new_occurrence() {
    let pool = super::setup_test_pool().await;
    super::clean_db(&pool).await;

    let due_date = NaiveDate::from_ymd_opt(2026, 5, 1).unwrap();
    let (task_id, occ_id) = create_simple_task_and_get_occurrence(&pool, due_date).await;

    complete_task_inner(&pool, occ_id).await.unwrap();

    let count: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM task_occurrences WHERE task_id = $1")
            .bind(task_id)
            .fetch_one(&pool)
            .await
            .unwrap();

    assert_eq!(count.0, 1, "non-recurring task should still have only one occurrence");
}

#[serial]
#[tokio::test]
async fn complete_recurring_task_generates_next_occurrence() {
    let pool = super::setup_test_pool().await;
    super::clean_db(&pool).await;

    // Weekly task on Monday (value = 1), first due 2026-05-04
    let task = create_task_inner(
        &pool,
        CreateTaskRequest {
            name: "Weekly review".to_string(),
            description: None,
            category: None,
            priority: None,
            due_date: NaiveDate::from_ymd_opt(2026, 5, 4).unwrap(),
            due_time: None,
            recurrence_type: Some("weekly".to_string()),
            recurrence_value: Some(1),
        },
    )
    .await
    .unwrap();

    let occ_id: (Uuid,) =
        sqlx::query_as("SELECT id FROM task_occurrences WHERE task_id = $1")
            .bind(task.id)
            .fetch_one(&pool)
            .await
            .unwrap();

    complete_task_inner(&pool, occ_id.0).await.unwrap();

    let occurrences: Vec<(NaiveDate, bool)> =
        sqlx::query_as("SELECT due_date, completed FROM task_occurrences WHERE task_id = $1 ORDER BY due_date")
            .bind(task.id)
            .fetch_all(&pool)
            .await
            .unwrap();

    assert_eq!(occurrences.len(), 2, "completing a recurring task should create a next occurrence");
    assert!(occurrences[0].1, "first occurrence should be completed");
    assert!(!occurrences[1].1, "next occurrence should be pending");
}

#[serial]
#[tokio::test]
async fn next_occurrence_date_is_based_on_original_due_date_not_completion_date() {
    let pool = super::setup_test_pool().await;
    super::clean_db(&pool).await;

    // Interval task: every 7 days, due 2026-05-01
    let task = create_task_inner(
        &pool,
        CreateTaskRequest {
            name: "Every 7 days".to_string(),
            description: None,
            category: None,
            priority: None,
            due_date: NaiveDate::from_ymd_opt(2026, 5, 1).unwrap(),
            due_time: None,
            recurrence_type: Some("interval".to_string()),
            recurrence_value: Some(7),
        },
    )
    .await
    .unwrap();

    let occ: (Uuid, NaiveDate) =
        sqlx::query_as("SELECT id, due_date FROM task_occurrences WHERE task_id = $1")
            .bind(task.id)
            .fetch_one(&pool)
            .await
            .unwrap();

    // Complete it (regardless of today's date)
    complete_task_inner(&pool, occ.0).await.unwrap();

    let next: (NaiveDate,) =
        sqlx::query_as("SELECT due_date FROM task_occurrences WHERE task_id = $1 AND completed = false")
            .bind(task.id)
            .fetch_one(&pool)
            .await
            .unwrap();

    // Next date must be 2026-05-01 + 7 = 2026-05-08, NOT today + 7
    let expected = NaiveDate::from_ymd_opt(2026, 5, 8).unwrap();
    assert_eq!(next.0, expected, "next occurrence must be based on original due_date");
}
