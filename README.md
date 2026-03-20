# 🚀 SkillForge: AI-Adaptive Onboarding Engine

<div align="center">
  <img src="https://img.shields.io/badge/FastAPI-100%25-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TensorFlow-2.15-orange?logo=tensorflow" alt="TensorFlow" />
</div>

PPT LINK
https://www.canva.com/design/DAHEgOGoen0/l46G1Us_AT1CsczKEGCZ9A/edit?utm_content=DAHEgOGoen0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

DEMO VEDIO LINK 


## 📖 The Problem
Traditional employee onboarding wastes **up to 40% of an experienced hire's time** by forcing them through redundant compliance and training modules they already know, while simultaneously overwhelming freshers with gaps in their foundational knowledge. The "one-size-fits-all" learning approach is fundamentally broken for modern agile teams. 

## 💡 Our Solution
**SkillForge** is an AI-driven adaptive onboarding engine that personalizes training pathways from day one. 
By instantly cross-referencing a candidate's Resume against a target Job Description (JD), our ML pipeline surgically extracts exact skill gaps and instantly generates a dynamic, gamified learning roadmap tailored uniquely to their career delta.

---

## 🌟 Key Features
- **🧠 Interactive Skill Gap Map**: A dynamic `react-flow` topology mapping your Missing vs Required proficiency levels, styled with color-coded severity boxes (Critical, Partial, Near-Competent).
- **🗺️ Gamified "Candy Crush" Roadmap**: A highly interactive, S-curve learning pathway visualizing your journey from baseline to target role.
- **📄 Native 6-Page Document Generation Engine**: A robust exporter powered by `jsPDF` that builds a custom AI-curated syllabus with YouTube links, educator recommendations, and weekly study plans.
- **📺 Embedded Video Learning Hub**: Watch curated tutorials inside the app. Progress is tracked automatically, advancing you to the next module with celebratory confetti upon completion!
- **📓 NotebookLM-Style Mentor Drawer**: An integrated AI sliding pane where you can paste URLs or text for instant learning summaries & quizzes while watching videos.

---

## 🏗️ Architecture Design (High-Level)

```mermaid
graph TD
    subgraph Frontend [React Multi-View SPA]
        A[Authentication: Clerk] --> B[Upload UI]
        B --> C[Skill Gap Map / React Flow]
        C --> D[LMS Dashboard Hub]
        D --> E[PDF Export Engine]
    end

    subgraph Backend [FastAPI Server]
        B -.-> |Multiform Resume & JD| F(FastAPI Endpoints)
        F --> G{Gemini 2.5 Flash API}
        F --> H[TensorFlow Emdeddings]
        G -.-> |Vectorize & Map| I[Gap Analysis Engine]
    end

    subgraph Data & Storage
        I -.-> J[(Supabase DB: User Metrics)]
        I -.-> K[YouTube v3 API]
    end

    I --> |Returns Topological JSON| C
```

<img width="1606" height="576" alt="diagram-export-3-20-2026-10_35_38-PM" src="https://github.com/user-attachments/assets/b8bc71fd-485e-44cc-8c45-9bfd8608495c" />


## 🔄 User Workflow Pipeline

```mermaid
sequenceDiagram
    actor You
    participant UI as React Frontend
    participant Server as FastAPI Backend
    participant AI as Gemini 2.5 NLP
    participant YT as YouTube API

    You->>UI: Uploads Resume (PDF) & Job Title
    UI->>Server: POST /api/analyze-gap
    Server->>AI: Prompts text extraction & JD mapping
    AI-->>Server: JSON: Critical, Partial, Minor Gaps
    Server->>YT: Query canonical video resources per gap
    YT-->>Server: Video IDs & Metadata
    Server-->>UI: Returns comprehensive Roadmap tree
    UI->>You: Renders Interactive Skill Gap Map
    You->>UI: Clicks "Generate Plan"
    UI->>You: Warps to LMS Dashboard + YouTube Auto-Play
```

---
<img width="998" height="1113" alt="diagram-export-3-20-2026-10_12_45-PM" src="https://github.com/user-attachments/assets/27d22e26-6e86-466a-8a42-cb4bd2cb947c" />



## 🛠️ Setup Instructions

### Environment Variables
Copy the `.env.example` file to `frontend/.env` and `backend/.env`. 
```bash
cp .env.example frontend/.env
```

### Backend (Python 3.11+)
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```
