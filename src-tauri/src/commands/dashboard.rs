use chrono::{Datelike, NaiveDate, Utc};
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

#[derive(Serialize)]
pub struct Streak {
    pub current: i64,
    pub record: i64,
}

#[tauri::command]
pub async fn get_streak(state: tauri::State<'_, AppState>) -> Result<Streak, String> {
    let today = Utc::now().date_naive();

    // All distinct dates with at least one uncompleted occurrence in the past
    let missed_dates = sqlx::query_scalar::<_, NaiveDate>(
        r#"
        SELECT DISTINCT o.due_date
        FROM task_occurrences o
        INNER JOIN tasks t ON t.id = o.task_id
        WHERE t.is_deleted = false
          AND o.completed = false
          AND o.due_date < $1
        ORDER BY o.due_date ASC
        "#,
    )
    .bind(today)
    .fetch_all(&state.db)
    .await
    .map_err(|e| format!("Failed to fetch missed dates: {}", e))?;

    // Earliest occurrence date across all tasks (to anchor the streak start)
    let first_date = sqlx::query_scalar::<_, Option<NaiveDate>>(
        r#"
        SELECT MIN(o.due_date)
        FROM task_occurrences o
        INNER JOIN tasks t ON t.id = o.task_id
        WHERE t.is_deleted = false
        "#,
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| format!("Failed to fetch first date: {}", e))?;

    // Current streak = clean days from (last_miss + 1) up to yesterday
    let current: i64 = match missed_dates.last() {
        Some(&last_miss) => ((today - last_miss).num_days() - 1).max(0),
        None => match first_date {
            Some(fd) => (today - fd).num_days(),
            None => 0,
        },
    };

    // Record = longest clean gap across all history
    let record: i64 = if missed_dates.is_empty() {
        current
    } else {
        let mut best: i64 = current;

        // Gap from first task date up to (but not including) first miss
        if let Some(fd) = first_date {
            best = best.max((missed_dates[0] - fd).num_days());
        }

        // Gaps between consecutive miss dates
        for window in missed_dates.windows(2) {
            let gap = (window[1] - window[0]).num_days() - 1;
            best = best.max(gap);
        }

        best
    };

    Ok(Streak { current, record })
}

#[derive(Serialize)]
pub struct CategoryCount {
    pub category: String,
    pub pending: i64,
    pub completed: i64,
}

#[tauri::command]
pub async fn get_category_distribution(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<CategoryCount>, String> {
    let rows = sqlx::query_as::<_, (String, i64, i64)>(
        r#"
        SELECT
            COALESCE(t.category, 'Sem categoria') AS category,
            COUNT(*) FILTER (WHERE o.completed = false) AS pending,
            COUNT(*) FILTER (WHERE o.completed = true)  AS completed
        FROM tasks t
        INNER JOIN task_occurrences o ON o.task_id = t.id
        WHERE t.is_deleted = false
          AND o.id = (
              SELECT o2.id FROM task_occurrences o2
              WHERE o2.task_id = t.id
              ORDER BY o2.due_date DESC
              LIMIT 1
          )
        GROUP BY COALESCE(t.category, 'Sem categoria')
        ORDER BY (COUNT(*) FILTER (WHERE o.completed = false) +
                  COUNT(*) FILTER (WHERE o.completed = true)) DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| format!("Failed to fetch category distribution: {}", e))?;

    Ok(rows
        .into_iter()
        .map(|(category, pending, completed)| CategoryCount { category, pending, completed })
        .collect())
}

#[derive(Serialize)]
pub struct HistoryEntry {
    pub period: String,
    pub completed: i64,
    pub pending: i64,
}

#[tauri::command]
pub async fn get_history(
    state: tauri::State<'_, AppState>,
    granularity: String,
) -> Result<Vec<HistoryEntry>, String> {
    let today = Utc::now().date_naive();

    let rows: Vec<(String, i64, i64)> = match granularity.as_str() {
        "week" => {
            // Last 8 weeks, grouped by ISO week (YYYY-WW)
            let start = today - chrono::Duration::weeks(7);
            sqlx::query_as::<_, (String, i64, i64)>(
                r#"
                SELECT
                    TO_CHAR(DATE_TRUNC('week', o.due_date), 'IYYY-IW') AS period,
                    COUNT(*) FILTER (WHERE o.completed = true)  AS completed,
                    COUNT(*) FILTER (WHERE o.completed = false) AS pending
                FROM task_occurrences o
                INNER JOIN tasks t ON t.id = o.task_id
                WHERE t.is_deleted = false
                  AND o.due_date >= $1
                  AND o.due_date <= $2
                GROUP BY DATE_TRUNC('week', o.due_date)
                ORDER BY DATE_TRUNC('week', o.due_date) ASC
                "#,
            )
            .bind(start)
            .bind(today)
            .fetch_all(&state.db)
            .await
            .map_err(|e| format!("Failed to fetch history: {}", e))?
        }
        "month" => {
            // Last 12 months, grouped by month (YYYY-MM)
            let start = today
                .with_day(1)
                .unwrap_or(today)
                .checked_sub_months(chrono::Months::new(11))
                .unwrap_or(today);
            sqlx::query_as::<_, (String, i64, i64)>(
                r#"
                SELECT
                    TO_CHAR(DATE_TRUNC('month', o.due_date), 'YYYY-MM') AS period,
                    COUNT(*) FILTER (WHERE o.completed = true)  AS completed,
                    COUNT(*) FILTER (WHERE o.completed = false) AS pending
                FROM task_occurrences o
                INNER JOIN tasks t ON t.id = o.task_id
                WHERE t.is_deleted = false
                  AND o.due_date >= $1
                  AND o.due_date <= $2
                GROUP BY DATE_TRUNC('month', o.due_date)
                ORDER BY DATE_TRUNC('month', o.due_date) ASC
                "#,
            )
            .bind(start)
            .bind(today)
            .fetch_all(&state.db)
            .await
            .map_err(|e| format!("Failed to fetch history: {}", e))?
        }
        _ => return Err(format!("Invalid granularity: {}", granularity)),
    };

    Ok(rows
        .into_iter()
        .map(|(period, completed, pending)| HistoryEntry { period, completed, pending })
        .collect())
}

#[derive(Serialize)]
pub struct MostForgotten {
    pub id: String,
    pub name: String,
    pub category: Option<String>,
    pub total: i64,
    pub missed: i64,
    pub frequency: f64,
}

#[tauri::command]
pub async fn get_most_forgotten(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<MostForgotten>, String> {
    let today = Utc::now().date_naive();

    let rows = sqlx::query_as::<_, (uuid::Uuid, String, Option<String>, i64, i64, f64)>(
        r#"
        SELECT
            t.id,
            t.name,
            t.category,
            COUNT(*)                                    AS total,
            COUNT(*) FILTER (
                WHERE (o.completed = false AND o.due_date < $1)
                   OR (o.completed = true  AND o.completed_at::date > o.due_date)
            )                                           AS missed,
            COALESCE(
                COUNT(*) FILTER (
                    WHERE (o.completed = false AND o.due_date < $1)
                       OR (o.completed = true  AND o.completed_at::date > o.due_date)
                )::float8 * 100.0 / NULLIF(COUNT(*), 0),
                0.0
            )                                           AS frequency
        FROM tasks t
        INNER JOIN task_occurrences o ON o.task_id = t.id
        WHERE t.is_deleted = false
          AND t.recurrence_type != 'none'
        GROUP BY t.id, t.name, t.category
        HAVING COUNT(*) > 0
        ORDER BY frequency DESC, missed DESC
        LIMIT 5
        "#,
    )
    .bind(today)
    .fetch_all(&state.db)
    .await
    .map_err(|e| format!("Failed to fetch most forgotten: {}", e))?;

    Ok(rows
        .into_iter()
        .map(|(id, name, category, total, missed, frequency)| MostForgotten {
            id: id.to_string(),
            name,
            category,
            total,
            missed,
            frequency,
        })
        .collect())
}
