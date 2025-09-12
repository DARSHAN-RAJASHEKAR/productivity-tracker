-- Supabase Database Schema for Productivity Tracker

-- Create tasks table
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    original_text TEXT,
    time TEXT,
    type TEXT NOT NULL CHECK (type IN ('today', 'fullweek', 'fullmonth', 'weekdays')),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_daily_tracking BOOLEAN DEFAULT FALSE,
    daily_completions JSONB DEFAULT '{}'::jsonb
);

-- Create habits table  
CREATE TABLE habits (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    original_text TEXT,
    time TEXT,
    streak INTEGER DEFAULT 0,
    last_completed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE reminders (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create completions table for streak tracking
CREATE TABLE completions (
    id BIGSERIAL PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_expires_at ON tasks(expires_at);
CREATE INDEX idx_habits_created_at ON habits(created_at);
CREATE INDEX idx_reminders_time ON reminders(time);
CREATE INDEX idx_reminders_completed ON reminders(completed);
CREATE INDEX idx_completions_date ON completions(date);

-- Enable Row Level Security (RLS) - Optional for public use
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE habits ENABLE ROW LEVEL SECURITY; 
-- ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (uncomment if you want RLS)
-- CREATE POLICY "Allow all operations for tasks" ON tasks FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for habits" ON habits FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for reminders" ON reminders FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for completions" ON completions FOR ALL USING (true);