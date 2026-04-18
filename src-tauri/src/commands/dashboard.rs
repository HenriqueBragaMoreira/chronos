use chrono::{Datelike, Utc};
use serde::Serialize;

use crate::AppState;

#[derive(Serialize)]
pub struct CompletionRate {
    pub on_time: i64,
    pub late: i64,
    pub missed: i64,
    pub rate: f64,
}

#[tauri::command]
pub async fn get_completion_rate(
    state: tauri::State<'_, AppState>,
    period: String,
) -> Result<CompletionRate, String> {
    let today = Utc::now().date_naive();

    let period_start = match period.as_str() {
        "week" => today - chrono::Duration::days(6),
        "month" => today.with_day(1).unwrap_or(today),
        "year" => today
            .with_month(1)
            .and_then(|d| d.with_day(1))
            .unwrap_or(today),
        _ => return Err(format!("Invalid period: {}", period)),
    };

    let row = sqlx::query_as::<_, (i64, i64, i64)>(
        r#"
        SELECT
            COUNT(*) FILTER (
                WHERE o.completed = true
                  AND o.completed_at::date <= o.due_date
            ) AS on_time,
            COUNT(*) FILTER (
                WHERE o.completed = true
                  AND o.completed_at::date > o.due_date
            ) AS late,
            COUNT(*) FILTER (
                WHERE o.completed = false
                  AND o.due_date <= $3
            ) AS missed
        FROM task_occurrences o
        INNER JOIN tasks t ON t.id = o.task_id
        WHERE t.is_deleted = false
          AND o.due_date >= $1
          AND o.due_date <= $2
        "#,
    )
    .bind(period_start)
    .bind(today)
    .bind(today)
    .fetch_one(&state.db)
    .await
    .map_err(|e| format!("Failed to fetch completion rate: {}", e))?;

    let (on_time, late, missed) = row;
    let total = on_time + late + missed;
    let rate = if total == 0 {
        0.0
    } else {
        (on_time as f64 / total as f64) * 100.0
    };

    Ok(CompletionRate { on_time, late, missed, rate })
}
