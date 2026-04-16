use sqlx::PgPool;
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

/// Queries pending and overdue tasks for today, then sends a system notification
/// summarising them.  Called by the scheduler once per day at the configured time.
///
/// Respects `notification_sound_enabled` from settings: when disabled the
/// notification is sent silently by omitting the sound identifier.
pub async fn fire_daily_notification(pool: &PgPool, app: &AppHandle) {
    let today = chrono::Utc::now().date_naive();

    // Fetch sound preference alongside tasks in a single query
    let sound_enabled: bool = sqlx::query_scalar(
        "SELECT notification_sound_enabled FROM settings WHERE id = 1",
    )
    .fetch_optional(pool)
    .await
    .ok()
    .flatten()
    .unwrap_or(true);

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

    let mut builder = app
        .notification()
        .builder()
        .title("Chronos — Tarefas do dia")
        .body(&body);

    if sound_enabled {
        builder = builder.sound("default");
    }

    if let Err(e) = builder.show() {
        eprintln!("[scheduler] failed to send notification: {e}");
    }
}
