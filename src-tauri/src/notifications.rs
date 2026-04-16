use sqlx::PgPool;
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

/// Queries pending and overdue tasks for today, then sends a system notification
/// summarising them.  Called by the scheduler once per day at the configured time.
pub async fn fire_daily_notification(pool: &PgPool, app: &AppHandle) {
    let today = chrono::Utc::now().date_naive();

    let names: Vec<String> = match sqlx::query_scalar::<_, String>(
        r#"
        SELECT t.name
        FROM tasks t
        INNER JOIN task_occurrences o ON o.task_id = t.id
        WHERE t.is_deleted = false
          AND o.completed = false
          AND o.due_date <= $1
        ORDER BY o.due_date ASC
        LIMIT 10
        "#,
    )
    .bind(today)
    .fetch_all(pool)
    .await
    {
        Ok(rows) => rows,
        Err(e) => {
            eprintln!("[scheduler] failed to query tasks for notification: {e}");
            return;
        }
    };

    if names.is_empty() {
        return;
    }

    let body = if names.len() == 1 {
        names[0].clone()
    } else {
        format!("{} e mais {} tarefa(s)", names[0], names.len() - 1)
    };

    if let Err(e) = app
        .notification()
        .builder()
        .title("Chronos — Tarefas do dia")
        .body(&body)
        .show()
    {
        eprintln!("[scheduler] failed to send notification: {e}");
    }
}
