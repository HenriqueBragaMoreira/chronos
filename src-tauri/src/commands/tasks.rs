use crate::models::{CreateTaskRequest, Task};
use crate::AppState;
use uuid::Uuid;

#[tauri::command]
pub async fn create_task(
    state: tauri::State<'_, AppState>,
    request: CreateTaskRequest,
) -> Result<Task, String> {
    let priority = request.priority.unwrap_or_else(|| "medium".to_string());
    let recurrence_type = request.recurrence_type.unwrap_or_else(|| "none".to_string());

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
    .fetch_one(&state.db)
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
    .execute(&state.db)
    .await
    .map_err(|e| format!("Failed to create initial occurrence: {}", e))?;

    Ok(task)
}
