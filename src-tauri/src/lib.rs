mod commands;
mod db;
mod models;
mod recurrence;
mod tray;

#[cfg(test)]
mod tests;

use sqlx::PgPool;
use tauri::Manager;

pub struct AppState {
    pub db: PgPool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::dotenv().ok();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");
            let pool = rt.block_on(db::create_pool()).expect("Failed to connect to database");

            app.manage(AppState { db: pool });

            tray::setup_tray(app)?;
            tray::setup_minimize_to_tray(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::tasks::create_task,
            commands::tasks::get_tasks,
            commands::tasks::get_task,
            commands::tasks::update_task,
            commands::tasks::delete_task,
            commands::tasks::complete_task,
            commands::tasks::get_categories,
            commands::tasks::get_today_tasks,
            commands::settings::get_settings,
            commands::settings::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
