# SkillForge — Setup & Run Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Create Supabase Tables
Go to your **Supabase Dashboard** → **SQL Editor** → **New Query** → paste and run:

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    resume_text TEXT,
    jd_text TEXT,
    domain TEXT CHECK(domain IN ('tech', 'operational')),
    analysis_result JSONB
);

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

CREATE TABLE IF NOT EXISTS skill_taxonomy (
    id SERIAL PRIMARY KEY,
    skill_name TEXT NOT NULL UNIQUE,
    category TEXT,
    domain TEXT,
    aliases JSONB
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on skill_taxonomy" ON skill_taxonomy FOR ALL USING (true) WITH CHECK (true);
```

---

### Step 2: Backend Setup
```bash
cd SkillForge/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Seed course catalog into Supabase
python data/seed_courses.py

# Start backend server
uvicorn main:app --reload --port 8000
```

---

### Step 3: Frontend Setup (new terminal)
```bash
cd SkillForge/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## ✅ Verify It's Working

1. **Backend**: Open http://localhost:8000/docs — you should see Swagger API docs
2. **Frontend**: Open http://localhost:5173 — you should see the SkillForge landing page
3. **Test Flow**: 
   - Click "Start My Learning Path"
   - Upload any resume PDF
   - Select a sample JD from dropdown (or paste your own)
   - Click "Analyze My Gap"
   - View your personalized roadmap!
