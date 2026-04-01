# SkillForge — Quick Reference (Q&A Cheat Sheet)

One-page overview: what it is, stack, models, and how pieces connect. Use this to answer judges, interviews, or teammates fast.

---

## Elevator pitch (1 sentence)

**SkillForge** is an AI-adaptive onboarding / upskilling app: upload a **resume (PDF)** + **job description**, get a **skill-gap analysis**, a **visual learning roadmap** (React Flow), curated **YouTube** resources, **PDF export**, **quiz arena**, **notes/mentor**, and a **Skill Sphere** hub (persona, coach, job match, portfolio, charts on progress, etc.).

---

## Tech stack

| Layer | Technology |
|--------|------------|
| **Frontend** | React 18, Vite 6, JavaScript (JSX), Tailwind CSS |
| **Routing** | React Router v7 |
| **Auth** | Clerk (`@clerk/clerk-react`) — optional; demo mode bypasses if no publishable key |
| **Graphs / UI** | `@xyflow/react` (skill gap map & roadmap), **Recharts** (My Progress charts), Lucide icons |
| **PDF** | jsPDF + html2canvas (export roadmap/syllabus) |
| **Backend** | **Python 3.11+**, **FastAPI**, Uvicorn |
| **Validation / config** | Pydantic v2, pydantic-settings, python-dotenv |
| **DB (optional)** | **Supabase** — session/metrics when configured |
| **PDF ingest** | PyMuPDF (resume text extraction) |
| **Graph algorithms** | **NetworkX** (prerequisite / path logic) |
| **HTTP / scrape** | httpx, requests, BeautifulSoup |

**Run locally**

- API: `cd backend` → `uvicorn main:app --reload --port 8000`
- UI: `cd frontend` → `npm run dev` (default **port 5180**; Vite proxies `/api` → `8000`)

---

## AI / ML: what models are used?

| Purpose | Model / API (as implemented) |
|--------|-------------------------------|
| **Primary LLM** | **Google Gemini** via `google-genai` SDK |
| **Default chat / JSON tasks** | Configurable; default **`gemini-2.5-flash`** (`GEMINI_MODEL` in `backend/config.py`) |
| **Fallback (some extractors)** | `gemini-2.0-flash` on retry paths in `skill_extractor.py` |
| **Semantic skill matching** | **Gemini embeddings**: `text-embedding-004` (cosine similarity in `gap_engine.py`) — not local PyTorch embeddings in production path |
| **Skill Sphere** (persona, coach, trends, role targets, portfolio HTML, etc.) | Same Gemini client + JSON or raw HTML generation (`services/skill_sphere_ai.py`) |

**Env vars (backend)**

- `GEMINI_API_KEY` — required for LLM + embeddings + Skill Sphere  
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash`  
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — optional  
- `YOUTUBE_API_KEY` — optional (YouTube Data API where used)

**TensorFlow** may appear in the environment for legacy/compat warnings; **gap semantics rely on Gemini embeddings**, not local TF embeddings.

---

## Main API surface (FastAPI)

- **`/api/upload/resume`** — PDF → text → skills + `session_id`  
- **`/api/analyze`** — Full gap analysis + roadmap (nodes/edges for React Flow)  
- **`/api/progress/update`** — Module completion (unlocks next)  
- **`/api/quiz/*`** — Quiz arena  
- **`/api/scrape-url`** — URL → summary for mentor flow  
- **`/api/skill-sphere/*`** — Career persona, coach, job match, peer learning, learning path, interview report, trends, portfolio, **role-targets**, etc.  
- **`/docs`** — Swagger UI  
- **`/api/health`** — Health + flags (Supabase/Gemini configured)

---

## Frontend routes (SPA)

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/upload` | Resume + JD upload |
| `/processing` | Analysis animation |
| `/dashboard` | Main hub: gap map, roadmap, LMS, **My Progress** (charts + AI roles) |
| `/notes` | Notes |
| `/quiz` | Quiz Arena |
| `/skill-sphere` | Skill Sphere hub |

---

## Data flow (happy path)

1. User uploads resume PDF → backend extracts text (PyMuPDF) → **Gemini** extracts structured skills.  
2. User provides JD text → **Gemini** extracts required skills.  
3. **Gap engine** compares resume vs JD (exact + **embedding** similarity).  
4. **NetworkX** builds a skill graph → **path optimizer** produces phased roadmap + React Flow nodes/edges.  
5. Course lookup + reasoning traces ground modules; result stored in Supabase when configured.  
6. Frontend renders maps, videos, PDF export, progress charts, Skill Sphere calls.

---

## Notable features (product)

- Skill gap **topology** (React Flow) + gamified **candy roadmap**  
- **PDF syllabus** export (jsPDF)  
- **Quiz Arena** (multiplayer-style flow in app)  
- **Notebook / mentor** with URL scrape  
- **Skill Sphere**: persona, AI coach, job tracker + AI match, peer ideas, learning path, interview feedback, market trends, portfolio generator, **role suggestions**  
- **My Progress**: Recharts (alignment donut, skill coverage bars, roadmap completion bars) + **AI role targets** vs “after roadmap”

---

## Repo layout (this project)

```
SkillForge/
  backend/     # FastAPI — main.py, routers/, services/, models/, db/
  frontend/    # Vite React app — src/pages/, utils/api.js
```

---

## One-liner answers (quick)

- **“What’s the stack?”** — React + Vite + Tailwind + FastAPI + Python, Clerk auth, Supabase optional.  
- **“What LLM?”** — Google **Gemini** (default **2.5 Flash**); embeddings **text-embedding-004** for skill similarity.  
- **“How do gaps work?”** — JD skills vs resume skills (string + **semantic** match), then graph + roadmap.  
- **“Where’s the ‘AI’?”** — Resume/JD parsing, gap reasoning, Skill Sphere, scraper, charts’ **role** insight — all Gemini-backed.  
- **“Deploy?”** — Frontend (e.g. Vercel); API any host with Python + env; see README for live demo link placeholder.

---

*Last aligned with codebase: SkillForge in `ArtForge` workspace — adjust if you fork or change `GEMINI_MODEL`.*
