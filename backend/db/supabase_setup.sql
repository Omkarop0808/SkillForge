-- SkillForge — Supabase Table Setup
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    resume_text TEXT,
    jd_text TEXT,
    domain TEXT CHECK(domain IN ('tech', 'operational')),
    analysis_result JSONB
);

-- 2. Course catalog table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    skill_name TEXT NOT NULL,
    course_title TEXT NOT NULL,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    estimated_hours REAL,
    difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
    domain TEXT CHECK(domain IN ('tech', 'operational', 'both')),
    category TEXT
);

-- 3. Skill taxonomy table (for O*NET data)
CREATE TABLE IF NOT EXISTS skill_taxonomy (
    id SERIAL PRIMARY KEY,
    skill_name TEXT NOT NULL UNIQUE,
    category TEXT,
    domain TEXT,
    aliases JSONB
);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_taxonomy ENABLE ROW LEVEL SECURITY;

-- Allow anon access (for hackathon — no auth)
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on skill_taxonomy" ON skill_taxonomy FOR ALL USING (true) WITH CHECK (true);
