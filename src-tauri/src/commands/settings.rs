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
