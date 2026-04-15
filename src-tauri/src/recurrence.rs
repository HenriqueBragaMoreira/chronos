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

#[cfg(test)]
mod tests {
    use super::*;

    // Weekly tests
    #[test]
    fn weekly_next_tuesday_from_tuesday() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 14).unwrap(); // Tuesday
        let next = next_weekly(2, from);
        assert_eq!(next, NaiveDate::from_ymd_opt(2026, 4, 21).unwrap());
    }

    #[test]
    fn weekly_next_friday_from_monday() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 13).unwrap(); // Monday
        let next = next_weekly(5, from);
        assert_eq!(next, NaiveDate::from_ymd_opt(2026, 4, 17).unwrap());
    }

    #[test]
    fn weekly_next_monday_from_friday() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 17).unwrap(); // Friday
        let next = next_weekly(1, from);
        assert_eq!(next, NaiveDate::from_ymd_opt(2026, 4, 20).unwrap());
    }

    #[test]
    fn weekly_sunday_from_saturday() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 18).unwrap(); // Saturday
        let next = next_weekly(0, from);
        assert_eq!(next, NaiveDate::from_ymd_opt(2026, 4, 19).unwrap());
    }

    // Interval tests
    #[test]
    fn interval_7_days() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 10).unwrap();
        assert_eq!(next_interval(7, from), NaiveDate::from_ymd_opt(2026, 4, 17).unwrap());
    }

    #[test]
    fn interval_15_days() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 10).unwrap();
        assert_eq!(next_interval(15, from), NaiveDate::from_ymd_opt(2026, 4, 25).unwrap());
    }

    #[test]
    fn interval_1_day() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 30).unwrap();
        assert_eq!(next_interval(1, from), NaiveDate::from_ymd_opt(2026, 5, 1).unwrap());
    }

    #[test]
    fn interval_30_days_across_month() {
        let from = NaiveDate::from_ymd_opt(2026, 3, 15).unwrap();
        assert_eq!(next_interval(30, from), NaiveDate::from_ymd_opt(2026, 4, 14).unwrap());
    }

    // Monthly tests
    #[test]
    fn monthly_normal() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 15).unwrap();
        assert_eq!(next_monthly(15, from), NaiveDate::from_ymd_opt(2026, 5, 15).unwrap());
    }

    #[test]
    fn monthly_day_31_in_february() {
        let from = NaiveDate::from_ymd_opt(2026, 1, 31).unwrap();
        assert_eq!(next_monthly(31, from), NaiveDate::from_ymd_opt(2026, 2, 28).unwrap());
    }

    #[test]
    fn monthly_day_31_in_february_leap_year() {
        let from = NaiveDate::from_ymd_opt(2028, 1, 31).unwrap();
        assert_eq!(next_monthly(31, from), NaiveDate::from_ymd_opt(2028, 2, 29).unwrap());
    }

    #[test]
    fn monthly_day_31_in_april() {
        let from = NaiveDate::from_ymd_opt(2026, 3, 31).unwrap();
        assert_eq!(next_monthly(31, from), NaiveDate::from_ymd_opt(2026, 4, 30).unwrap());
    }

    #[test]
    fn monthly_december_to_january() {
        let from = NaiveDate::from_ymd_opt(2026, 12, 15).unwrap();
        assert_eq!(next_monthly(15, from), NaiveDate::from_ymd_opt(2027, 1, 15).unwrap());
    }

    // calculate_next_date dispatch tests
    #[test]
    fn dispatch_none_returns_none() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 15).unwrap();
        assert!(calculate_next_date("none", 0, from).is_none());
    }

    #[test]
    fn dispatch_invalid_returns_none() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 15).unwrap();
        assert!(calculate_next_date("invalid", 5, from).is_none());
    }

    #[test]
    fn dispatch_weekly() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 14).unwrap();
        assert_eq!(calculate_next_date("weekly", 2, from), Some(NaiveDate::from_ymd_opt(2026, 4, 21).unwrap()));
    }

    #[test]
    fn dispatch_interval() {
        let from = NaiveDate::from_ymd_opt(2026, 4, 10).unwrap();
        assert_eq!(calculate_next_date("interval", 30, from), Some(NaiveDate::from_ymd_opt(2026, 5, 10).unwrap()));
    }

    #[test]
    fn dispatch_monthly() {
        let from = NaiveDate::from_ymd_opt(2026, 1, 31).unwrap();
        assert_eq!(calculate_next_date("monthly", 31, from), Some(NaiveDate::from_ymd_opt(2026, 2, 28).unwrap()));
    }
}
