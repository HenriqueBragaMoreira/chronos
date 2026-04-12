CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE NOT NULL,
    due_time TIME,
    recurrence_type VARCHAR(10) NOT NULL DEFAULT 'none' CHECK (recurrence_type IN ('none', 'weekly', 'interval', 'monthly')),
    recurrence_value INTEGER,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task occurrences: each instance of a recurring task
CREATE TABLE task_occurrences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User settings
CREATE TABLE settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    notification_time TIME NOT NULL DEFAULT '08:00',
    notification_sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    theme VARCHAR(10) NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    default_view VARCHAR(20) NOT NULL DEFAULT 'dashboard' CHECK (default_view IN ('dashboard', 'calendar_monthly', 'calendar_weekly', 'list')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_is_deleted ON tasks(is_deleted);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_task_occurrences_task_id ON task_occurrences(task_id);
CREATE INDEX idx_task_occurrences_due_date ON task_occurrences(due_date);
CREATE INDEX idx_task_occurrences_completed ON task_occurrences(completed);

-- Insert default settings row
INSERT INTO settings (id) VALUES (1);
