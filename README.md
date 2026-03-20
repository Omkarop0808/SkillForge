# SkillForge — AI-Adaptive Onboarding Engine

An AI-driven adaptive learning engine that parses resumes and job descriptions, identifies skill gaps, and generates personalized learning roadmaps.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account (free tier)
- Google AI Studio API key (free)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env   # Fill in your API keys
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Docker (Optional)
```bash
docker-compose up --build
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI (Python 3.11+) |
| Frontend | React 18 + Vite + Tailwind CSS |
| LLM | Google Gemini 2.5 Flash (free tier) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Primary DB | Supabase (PostgreSQL) |
| Vector DB | ChromaDB |
| Skill Graph | NetworkX |
| PDF Parsing | PyMuPDF |

## Architecture

```
Resume PDF / JD Text
    → FastAPI (upload + validation)
    → PyMuPDF (text extraction)
    → Gemini 2.5 Flash (skill extraction + confidence scoring)
    → sentence-transformers (embedding generation)
    → ChromaDB (semantic matching vs O*NET taxonomy)
    → Gap Engine (resume skills vs JD skills)
    → NetworkX (prerequisite graph + adaptive pathing)
    → Course Catalog (grounded recommendations — zero hallucinations)
    → React Frontend (interactive roadmap with React Flow)
```

## Public Datasets

- **O*NET Database 30.1** — Skill taxonomy ([source](https://www.onetcenter.org/db_releases.html))
- **Resume Dataset** — 2,400+ resumes ([Kaggle](https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset/data))
- **Jobs & JD Dataset** — Job descriptions ([Kaggle](https://www.kaggle.com/datasets/kshitizregmi/jobs-and-job-description))

## License

MIT
