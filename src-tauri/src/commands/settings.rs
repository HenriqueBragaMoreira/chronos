use crate::models::{Settings, UpdateSettingsRequest};
use crate::AppState;

#[tauri::command]
pub async fn get_settings(
    state: tauri::State<'_, AppState>,
) -> Result<Settings, String> {
    let settings = sqlx::query_as::<_, Settings>(
        r#"SELECT * FROM settings WHERE id = 1"#,
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| format!("Failed to fetch settings: {}", e))?;

    Ok(settings)
}

#[tauri::command]
pub async fn update_settings(
    state: tauri::State<'_, AppState>,
    request: UpdateSettingsRequest,
) -> Result<Settings, String> {
    let settings = sqlx::query_as::<_, Settings>(
        r#"
        UPDATE settings SET
            notification_time = COALESCE($1, notification_time),
            notification_sound_enabled = COALESCE($2, notification_sound_enabled),
            theme = COALESCE($3, theme),
            default_view = COALESCE($4, default_view),
            updated_at = NOW()
        WHERE id = 1
        RETURNING *
        "#,
    )
    .bind(request.notification_time)
    .bind(request.notification_sound_enabled)
    .bind(&request.theme)
    .bind(&request.default_view)
    .fetch_one(&state.db)
    .await
    .map_err(|e| format!("Failed to update settings: {}", e))?;

    Ok(settings)
}
