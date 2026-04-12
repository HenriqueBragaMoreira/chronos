use std::fmt;
use std::str::FromStr;

use chrono::{NaiveDate, NaiveTime};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RecurrenceType {
    None,
    Weekly,
    Interval,
    Monthly,
}

impl fmt::Display for RecurrenceType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RecurrenceType::None => write!(f, "none"),
            RecurrenceType::Weekly => write!(f, "weekly"),
            RecurrenceType::Interval => write!(f, "interval"),
            RecurrenceType::Monthly => write!(f, "monthly"),
        }
    }
}

impl FromStr for RecurrenceType {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "none" => Ok(RecurrenceType::None),
            "weekly" => Ok(RecurrenceType::Weekly),
            "interval" => Ok(RecurrenceType::Interval),
            "monthly" => Ok(RecurrenceType::Monthly),
            _ => Err(format!("Invalid recurrence type: {}", s)),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Priority {
    Low,
    Medium,
    High,
}

impl fmt::Display for Priority {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Priority::Low => write!(f, "low"),
            Priority::Medium => write!(f, "medium"),
            Priority::High => write!(f, "high"),
        }
    }
}

impl FromStr for Priority {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "low" => Ok(Priority::Low),
            "medium" => Ok(Priority::Medium),
            "high" => Ok(Priority::High),
            _ => Err(format!("Invalid priority: {}", s)),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

impl fmt::Display for Theme {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Theme::Light => write!(f, "light"),
            Theme::Dark => write!(f, "dark"),
            Theme::System => write!(f, "system"),
        }
    }
}

impl FromStr for Theme {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "light" => Ok(Theme::Light),
            "dark" => Ok(Theme::Dark),
            "system" => Ok(Theme::System),
            _ => Err(format!("Invalid theme: {}", s)),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DefaultView {
    Dashboard,
    CalendarMonthly,
    CalendarWeekly,
    List,
}

impl fmt::Display for DefaultView {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DefaultView::Dashboard => write!(f, "dashboard"),
            DefaultView::CalendarMonthly => write!(f, "calendar_monthly"),
            DefaultView::CalendarWeekly => write!(f, "calendar_weekly"),
            DefaultView::List => write!(f, "list"),
        }
    }
}

impl FromStr for DefaultView {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "dashboard" => Ok(DefaultView::Dashboard),
            "calendar_monthly" => Ok(DefaultView::CalendarMonthly),
            "calendar_weekly" => Ok(DefaultView::CalendarWeekly),
            "list" => Ok(DefaultView::List),
            _ => Err(format!("Invalid default view: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Task {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub priority: String,
    pub due_date: NaiveDate,
    pub due_time: Option<NaiveTime>,
    pub recurrence_type: String,
    pub recurrence_value: Option<i32>,
    pub is_deleted: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TaskOccurrence {
    pub id: Uuid,
    pub task_id: Uuid,
    pub due_date: NaiveDate,
    pub completed: bool,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskWithOccurrence {
    #[serde(flatten)]
    pub task: Task,
    pub occurrence_id: Uuid,
    pub occurrence_due_date: NaiveDate,
    pub completed: bool,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub status: String,
    pub overdue_days: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateTaskRequest {
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub priority: Option<String>,
    pub due_date: NaiveDate,
    pub due_time: Option<NaiveTime>,
    pub recurrence_type: Option<String>,
    pub recurrence_value: Option<i32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTaskRequest {
    pub id: Uuid,
    pub name: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<NaiveDate>,
    pub due_time: Option<NaiveTime>,
    pub recurrence_type: Option<String>,
    pub recurrence_value: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Settings {
    pub id: i32,
    pub notification_time: NaiveTime,
    pub notification_sound_enabled: bool,
    pub theme: String,
    pub default_view: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateSettingsRequest {
    pub notification_time: Option<NaiveTime>,
    pub notification_sound_enabled: Option<bool>,
    pub theme: Option<String>,
    pub default_view: Option<String>,
}
