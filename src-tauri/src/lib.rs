mod commands;
mod db;
mod models;
mod notifications;
mod recurrence;
mod scheduler;
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

            let pool_for_scheduler = app.state::<AppState>().db.clone();
            scheduler::start_scheduler(pool_for_scheduler, app.handle().clone());

            // Populate tray badge immediately on startup
            let pool_for_badge = app.state::<AppState>().db.clone();
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                notifications::update_tray_badge(&pool_for_badge, &app_handle).await;
            });

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
            commands::tasks::get_tasks_by_date_range,
            commands::tasks::refresh_tray_badge,
            commands::dashboard::get_completion_rate,
            commands::dashboard::get_streak,
            commands::settings::get_settings,
            commands::settings::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
