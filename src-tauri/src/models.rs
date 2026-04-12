use chrono::{NaiveDate, NaiveTime};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

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
