use chrono::{Datelike, Days, NaiveDate};

pub fn calculate_next_date(
    recurrence_type: &str,
    recurrence_value: i32,
    current_due_date: NaiveDate,
) -> Option<NaiveDate> {
    match recurrence_type {
        "weekly" => Some(next_weekly(recurrence_value, current_due_date)),
        _ => None,
    }
}

/// Next occurrence on the configured weekday (0=Sun, 1=Mon, ..., 6=Sat).
fn next_weekly(weekday: i32, from: NaiveDate) -> NaiveDate {
    let current_weekday = from.weekday().num_days_from_sunday() as i32;
    let days_ahead = (weekday - current_weekday + 7) % 7;
    let days_ahead = if days_ahead == 0 { 7 } else { days_ahead };
    from.checked_add_days(Days::new(days_ahead as u64))
        .expect("Date overflow in weekly recurrence")
}
