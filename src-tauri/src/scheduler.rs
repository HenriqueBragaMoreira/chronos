use chrono::{Datelike, Local, Timelike};
use sqlx::PgPool;
use std::sync::{
    atomic::{AtomicU32, Ordering},
    Arc,
};
use tauri::AppHandle;
use tokio::time::{interval, Duration};

/// Spawns a background task that fires the daily notification at the configured time.
///
/// Uses an atomic day-of-year counter to prevent duplicate notifications within the
/// same calendar day.
pub fn start_scheduler(pool: PgPool, app: AppHandle) {
    tokio::spawn(async move {
        // Tracks the last day-of-year on which a notification was fired.
        // 0 = "not yet notified today".
        let last_notified_day: Arc<AtomicU32> = Arc::new(AtomicU32::new(0));

        let mut ticker = interval(Duration::from_secs(60));
        ticker.tick().await; // discard the immediate first tick

        loop {
            ticker.tick().await;

            let now = Local::now();
            let current_day = now.ordinal(); // 1-366

            // Skip if already notified today
            if last_notified_day.load(Ordering::Relaxed) == current_day {
                continue;
            }

            // Fetch the configured notification time from the database
            let notification_time: Option<chrono::NaiveTime> = sqlx::query_scalar(
                "SELECT notification_time FROM settings WHERE id = 1",
            )
            .fetch_optional(&pool)
            .await
            .ok()
            .flatten();

            let Some(target_time) = notification_time else {
                continue;
            };

            // Fire when we are within the same minute as the target time
            let current_time = now.time();
            if current_time.hour() == target_time.hour()
                && current_time.minute() == target_time.minute()
            {
                last_notified_day.store(current_day, Ordering::Relaxed);
                super::notifications::fire_daily_notification(&pool, &app).await;
            }
        }
    });
}
