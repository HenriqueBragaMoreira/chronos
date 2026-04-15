use chrono::{Datelike, Days, NaiveDate};

pub fn calculate_next_date(
    recurrence_type: &str,
    recurrence_value: i32,
    current_due_date: NaiveDate,
) -> Option<NaiveDate> {
    match recurrence_type {
        "weekly" => Some(next_weekly(recurrence_value, current_due_date)),
        "interval" => Some(next_interval(recurrence_value, current_due_date)),
        "monthly" => Some(next_monthly(recurrence_value, current_due_date)),
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

/// Next occurrence = current + N days.
fn next_interval(days: i32, from: NaiveDate) -> NaiveDate {
    from.checked_add_days(Days::new(days as u64))
        .expect("Date overflow in interval recurrence")
}

/// Next occurrence on the same day of the next month.
/// Falls back to the last day of the month if the day doesn't exist.
fn next_monthly(day_of_month: i32, from: NaiveDate) -> NaiveDate {
    let (year, month) = if from.month() == 12 {
        (from.year() + 1, 1)
    } else {
        (from.year(), from.month() + 1)
    };

    let last_day = last_day_of_month(year, month);
    let target_day = (day_of_month as u32).min(last_day);

    NaiveDate::from_ymd_opt(year, month, target_day)
        .expect("Invalid date in monthly recurrence")
}

fn last_day_of_month(year: i32, month: u32) -> u32 {
    if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)
    }
    .expect("Invalid date calculating last day")
    .pred_opt()
    .expect("Invalid date calculating last day")
    .day()
}
