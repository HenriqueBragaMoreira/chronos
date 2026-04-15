use chrono::NaiveDate;
use serial_test::serial;

use crate::commands::tasks::create_task_inner;
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
