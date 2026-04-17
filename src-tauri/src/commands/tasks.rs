use chrono::{NaiveDate, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{CreateTaskRequest, Task, TaskWithOccurrence, UpdateTaskRequest};
use crate::recurrence::calculate_next_date;
use crate::AppState;

pub async fn create_task_inner(pool: &PgPool, request: CreateTaskRequest) -> Result<Task, String> {
    if request.name.trim().is_empty() {
        return Err("Task name cannot be empty".to_string());
    }

    let priority = request.priority.unwrap_or_else(|| "medium".to_string());
    let recurrence_type = request.recurrence_type.unwrap_or_else(|| "none".to_string());

    let mut tx = pool.begin().await.map_err(|e| format!("Failed to begin transaction: {}", e))?;

    let task = sqlx::query_as::<_, Task>(
        r#"
        INSERT INTO tasks (name, description, category, priority, due_date, due_time, recurrence_type, recurrence_value)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#,
    )
    .bind(&request.name)
    .bind(&request.description)
    .bind(&request.category)
    .bind(&priority)
    .bind(request.due_date)
    .bind(request.due_time)
    .bind(&recurrence_type)
    .bind(request.recurrence_value)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| format!("Failed to create task: {}", e))?;

    sqlx::query(
        r#"
        INSERT INTO task_occurrences (task_id, due_date)
        VALUES ($1, $2)
        "#,
    )
    .bind(task.id)
    .bind(task.due_date)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to create initial occurrence: {}", e))?;

    tx.commit().await.map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(task)
}

#[tauri::command]
pub async fn create_task(
    state: tauri::State<'_, AppState>,
    request: CreateTaskRequest,
) -> Result<Task, String> {
    create_task_inner(&state.db, request).await
}

pub async fn get_tasks_inner(
    pool: &PgPool,
    filter: Option<String>,
    category: Option<String>,
    priority: Option<String>,
    sort_by: Option<String>,
) -> Result<Vec<TaskWithOccurrence>, String> {
    let today = Utc::now().date_naive();

    let rows = sqlx::query_as::<_, (
        uuid::Uuid, String, Option<String>, Option<String>, String,
        NaiveDate, Option<chrono::NaiveTime>, String, Option<i32>, bool,
        chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>,
        uuid::Uuid, NaiveDate, bool, Option<chrono::DateTime<chrono::Utc>>,
    )>(
        r#"
        SELECT t.id, t.name, t.description, t.category, t.priority,
               t.due_date, t.due_time, t.recurrence_type, t.recurrence_value,
               t.is_deleted, t.created_at, t.updated_at,
               o.id as occurrence_id, o.due_date as occurrence_due_date,
               o.completed, o.completed_at
        FROM tasks t
        INNER JOIN task_occurrences o ON o.task_id = t.id
        WHERE t.is_deleted = false
          AND o.id = (
            SELECT o2.id FROM task_occurrences o2
            WHERE o2.task_id = t.id AND o2.completed = false
            ORDER BY o2.due_date DESC
            LIMIT 1
          )
        ORDER BY o.due_date ASC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch tasks: {}", e))?;

    let mut tasks: Vec<TaskWithOccurrence> = rows
        .into_iter()
        .map(|row| {
            let status = if row.14 {
                "completed".to_string()
            } else if row.13 < today {
                "overdue".to_string()
            } else {
                "pending".to_string()
            };

            let overdue_days = if !row.14 && row.13 < today {
                Some((today - row.13).num_days())
            } else {
                None
            };

            TaskWithOccurrence {
                task: Task {
                    id: row.0,
                    name: row.1,
                    description: row.2,
                    category: row.3,
                    priority: row.4,
                    due_date: row.5,
                    due_time: row.6,
                    recurrence_type: row.7,
                    recurrence_value: row.8,
                    is_deleted: row.9,
                    created_at: row.10,
                    updated_at: row.11,
                },
                occurrence_id: row.12,
                occurrence_due_date: row.13,
                completed: row.14,
                completed_at: row.15,
                status,
                overdue_days,
            }
        })
        .collect();

    // Apply filters
    if let Some(ref f) = filter {
        match f.as_str() {
            "today" => tasks.retain(|t| t.occurrence_due_date == today || t.status == "overdue"),
            "overdue" => tasks.retain(|t| t.status == "overdue"),
            _ => {}
        }
    }

    if let Some(ref cat) = category {
        tasks.retain(|t| t.task.category.as_deref() == Some(cat.as_str()));
    }

    if let Some(ref pri) = priority {
        tasks.retain(|t| t.task.priority == *pri);
    }

    // Apply sorting
    if let Some(ref sort) = sort_by {
        match sort.as_str() {
            "priority" => tasks.sort_by(|a, b| {
                let priority_order = |p: &str| match p {
                    "high" => 0,
                    "medium" => 1,
                    "low" => 2,
                    _ => 3,
                };
                priority_order(&a.task.priority).cmp(&priority_order(&b.task.priority))
            }),
            "name" => tasks.sort_by(|a, b| a.task.name.cmp(&b.task.name)),
            _ => {} // default: already sorted by due_date from SQL
        }
    }

    Ok(tasks)
}

#[tauri::command]
pub async fn get_tasks(
    state: tauri::State<'_, AppState>,
    filter: Option<String>,
    category: Option<String>,
    priority: Option<String>,
    sort_by: Option<String>,
) -> Result<Vec<TaskWithOccurrence>, String> {
    get_tasks_inner(&state.db, filter, category, priority, sort_by).await
}

#[tauri::command]
pub async fn get_task(
    state: tauri::State<'_, AppState>,
    id: Uuid,
) -> Result<TaskWithOccurrence, String> {
    let today = Utc::now().date_naive();

    let row = sqlx::query_as::<_, (
        Uuid, String, Option<String>, Option<String>, String,
        NaiveDate, Option<chrono::NaiveTime>, String, Option<i32>, bool,
        chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>,
        Uuid, NaiveDate, bool, Option<chrono::DateTime<chrono::Utc>>,
    )>(
        r#"
        SELECT t.id, t.name, t.description, t.category, t.priority,
               t.due_date, t.due_time, t.recurrence_type, t.recurrence_value,
               t.is_deleted, t.created_at, t.updated_at,
               o.id as occurrence_id, o.due_date as occurrence_due_date,
               o.completed, o.completed_at
        FROM tasks t
        INNER JOIN task_occurrences o ON o.task_id = t.id
        WHERE t.id = $1 AND t.is_deleted = false
        ORDER BY o.due_date DESC
        LIMIT 1
        "#,
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| format!("Task not found: {}", e))?;

    let status = if row.14 {
        "completed".to_string()
    } else if row.13 < today {
        "overdue".to_string()
    } else {
        "pending".to_string()
    };

    let overdue_days = if !row.14 && row.13 < today {
        Some((today - row.13).num_days())
    } else {
        None
    };

    Ok(TaskWithOccurrence {
        task: Task {
            id: row.0,
            name: row.1,
            description: row.2,
            category: row.3,
            priority: row.4,
            due_date: row.5,
            due_time: row.6,
            recurrence_type: row.7,
            recurrence_value: row.8,
            is_deleted: row.9,
            created_at: row.10,
            updated_at: row.11,
        },
        occurrence_id: row.12,
        occurrence_due_date: row.13,
        completed: row.14,
        completed_at: row.15,
        status,
        overdue_days,
    })
}

#[tauri::command]
pub async fn update_task(
    state: tauri::State<'_, AppState>,
    request: UpdateTaskRequest,
) -> Result<Task, String> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks SET
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            category = COALESCE($4, category),
            priority = COALESCE($5, priority),
            due_date = COALESCE($6, due_date),
            due_time = COALESCE($7, due_time),
            recurrence_type = COALESCE($8, recurrence_type),
            recurrence_value = COALESCE($9, recurrence_value),
            updated_at = NOW()
        WHERE id = $1 AND is_deleted = false
        RETURNING *
        "#,
    )
    .bind(request.id)
    .bind(&request.name)
    .bind(&request.description)
    .bind(&request.category)
    .bind(&request.priority)
    .bind(request.due_date)
    .bind(request.due_time)
    .bind(&request.recurrence_type)
    .bind(request.recurrence_value)
    .fetch_one(&state.db)
    .await
    .map_err(|e| format!("Failed to update task: {}", e))?;

    Ok(task)
}

pub async fn delete_task_inner(pool: &PgPool, id: Uuid) -> Result<(), String> {
    let result = sqlx::query(
        r#"
        UPDATE tasks SET is_deleted = true, updated_at = NOW()
        WHERE id = $1 AND is_deleted = false
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to delete task: {}", e))?;

    if result.rows_affected() == 0 {
        return Err("Task not found".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_task(
    state: tauri::State<'_, AppState>,
    id: Uuid,
) -> Result<(), String> {
    delete_task_inner(&state.db, id).await
}

pub async fn complete_task_inner(pool: &PgPool, occurrence_id: Uuid) -> Result<(), String> {
    let occurrence = sqlx::query_as::<_, (Uuid, NaiveDate)>(
        r#"
        UPDATE task_occurrences SET completed = true, completed_at = NOW()
        WHERE id = $1 AND completed = false
        RETURNING task_id, due_date
        "#,
    )
    .bind(occurrence_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to complete task: {}", e))?;

    let (task_id, occurrence_due_date) = occurrence
        .ok_or_else(|| "Occurrence not found or already completed".to_string())?;

    let task = sqlx::query_as::<_, (String, Option<i32>)>(
        r#"
        SELECT recurrence_type, recurrence_value FROM tasks
        WHERE id = $1 AND is_deleted = false
        "#,
    )
    .bind(task_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to fetch task: {}", e))?;

    if let Some(next_date) = task.1.and_then(|val| calculate_next_date(&task.0, val, occurrence_due_date)) {
        sqlx::query(
            r#"
            INSERT INTO task_occurrences (task_id, due_date)
            VALUES ($1, $2)
            "#,
        )
        .bind(task_id)
        .bind(next_date)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to create next occurrence: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn complete_task(
    state: tauri::State<'_, AppState>,
    occurrence_id: Uuid,
) -> Result<(), String> {
    complete_task_inner(&state.db, occurrence_id).await
}

#[tauri::command]
pub async fn get_categories(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let categories = sqlx::query_scalar::<_, String>(
        r#"
        SELECT DISTINCT category FROM tasks
        WHERE is_deleted = false AND category IS NOT NULL
        ORDER BY category
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| format!("Failed to fetch categories: {}", e))?;

    Ok(categories)
}

#[tauri::command]
pub async fn refresh_tray_badge(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    crate::notifications::update_tray_badge(&state.db, &app).await;
    Ok(())
}

#[tauri::command]
pub async fn get_today_tasks(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<TaskWithOccurrence>, String> {
    let today = Utc::now().date_naive();

    let rows = sqlx::query_as::<_, (
        Uuid, String, Option<String>, Option<String>, String,
        NaiveDate, Option<chrono::NaiveTime>, String, Option<i32>, bool,
        chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>,
        Uuid, NaiveDate, bool, Option<chrono::DateTime<chrono::Utc>>,
    )>(
        r#"
        SELECT t.id, t.name, t.description, t.category, t.priority,
               t.due_date, t.due_time, t.recurrence_type, t.recurrence_value,
               t.is_deleted, t.created_at, t.updated_at,
               o.id as occurrence_id, o.due_date as occurrence_due_date,
               o.completed, o.completed_at
        FROM tasks t
        INNER JOIN task_occurrences o ON o.task_id = t.id
        WHERE t.is_deleted = false
          AND o.completed = false
          AND o.due_date <= $1
        ORDER BY o.due_date ASC
        "#,
    )
    .bind(today)
    .fetch_all(&state.db)
    .await
    .map_err(|e| format!("Failed to fetch today tasks: {}", e))?;

    let tasks = rows
        .into_iter()
        .map(|row| {
            let status = if row.13 < today {
                "overdue".to_string()
            } else {
                "pending".to_string()
            };
            let overdue_days = if row.13 < today {
                Some((today - row.13).num_days())
            } else {
                None
            };

            TaskWithOccurrence {
                task: Task {
                    id: row.0,
                    name: row.1,
                    description: row.2,
                    category: row.3,
                    priority: row.4,
                    due_date: row.5,
                    due_time: row.6,
                    recurrence_type: row.7,
                    recurrence_value: row.8,
                    is_deleted: row.9,
                    created_at: row.10,
                    updated_at: row.11,
                },
                occurrence_id: row.12,
                occurrence_due_date: row.13,
                completed: row.14,
                completed_at: row.15,
                status,
                overdue_days,
            }
        })
        .collect();

    Ok(tasks)
}
