import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  MessageCircle,
  Briefcase,
  Users,
  BookOpen,
  Video,
  FileBarChart,
  TrendingUp,
  Globe,
  Download,
  ExternalLink,
} from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import {
  skillSphereCareerPersona,
  skillSphereCareerCoach,
  skillSphereJobMatch,
  skillSpherePeerLearning,
  skillSpherePersonalizedLearning,
  skillSphereInterviewReport,
  skillSphereJobTrends,
  skillSpherePortfolio,
} from '../utils/api'

const JOB_STORE_KEY = 'skillforge_job_tracker_v1'

const TABS = [
  { id: 'persona', label: 'Career Persona', icon: '🎭' },
  { id: 'coach', label: 'AI Career Coach', icon: '🤖' },
  { id: 'jobs', label: 'Job Tracker', icon: '💼' },
  { id: 'peers', label: 'Peer Learning', icon: '👥' },
  { id: 'learning', label: 'Personalized Learning', icon: '📚' },
  { id: 'interview', label: 'Mock Interview', icon: '💻' },
  { id: 'trends', label: 'Job Market Trends', icon: '📊' },
  { id: 'portfolio', label: 'Portfolio Builder', icon: '🌐' },
]

function loadSessionContext() {
  try {
    const session = JSON.parse(sessionStorage.getItem('skillforge_session') || 'null')
    const result = JSON.parse(sessionStorage.getItem('skillforge_result') || 'null')
    const resume_skills = (session?.resumeSkills || []).map((s) => s.name).filter(Boolean)
    const critical = result?.gap_summary?.critical_missing || []
    const roadmapSkills =
      result?.roadmap?.phases?.flatMap((p) => (p.modules || []).map((m) => m.skill)) || []
    const gap_skills = [...new Set([...critical, ...roadmapSkills])].filter(Boolean)
    return {
      resume_text: session?.resumeRawText || '',
      jd_text: session?.jdText || '',
      resume_skills,
      gap_skills,
      domain: session?.domain || 'tech',
      hasAnalysis: !!(session && result),
    }
  } catch {
    return {
      resume_text: '',
      jd_text: '',
      resume_skills: [],
      gap_skills: [],
      domain: 'tech',
      hasAnalysis: false,
    }
  }
}

function loadJobs() {
  try {
    const raw = localStorage.getItem(JOB_STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveJobs(jobs) {
  localStorage.setItem(JOB_STORE_KEY, JSON.stringify(jobs))
}

export default function SkillSpherePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('persona')
  const [manualResume, setManualResume] = useState('')
  const [manualJd, setManualJd] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const base = useMemo(() => loadSessionContext(), [])
  const ctx = useMemo(
    () => ({
      resume_text: (base.resume_text || manualResume).slice(0, 12000),
      jd_text: (base.jd_text || manualJd).slice(0, 8000),
      resume_skills: base.resume_skills,
      gap_skills: base.gap_skills,
      domain: base.domain,
    }),
    [base, manualResume, manualJd]
  )

  const [persona, setPersona] = useState(null)
  const [coachMessages, setCoachMessages] = useState([{ role: 'assistant', content: 'Ask me anything about your career path, interviews, or skill gaps.' }])
  const [coachInput, setCoachInput] = useState('')
  const [jobs, setJobs] = useState(loadJobs)
  const [jobForm, setJobForm] = useState({ title: '', company: '', url: '', jd: '', status: 'saved' })
  const [peerRole, setPeerRole] = useState('Software Engineer')
  const [peerData, setPeerData] = useState(null)
  const [learnPath, setLearnPath] = useState(null)
  const [problem, setProblem] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [report, setReport] = useState(null)
  const [trends, setTrends] = useState(null)
  const [roleHint, setRoleHint] = useState('Software Engineer')
  const [locHint, setLocHint] = useState('')
  const [portfolioHtml, setPortfolioHtml] = useState('')
  const [nameHint, setNameHint] = useState('Professional')

  useEffect(() => {
    saveJobs(jobs)
  }, [jobs])

  const run = useCallback(async (fn) => {
    setErr('')
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }, [])

  const addJob = () => {
    if (!jobForm.title.trim() || !jobForm.jd.trim() || jobForm.jd.trim().length < 30) {
      setErr('Job title and a JD snippet (30+ chars) are required.')
      return
    }
    setErr('')
    const id = crypto.randomUUID?.() || String(Date.now())
    setJobs((j) => [...j, { ...jobForm, id, match: null }])
    setJobForm({ title: '', company: '', url: '', jd: '', status: 'saved' })
  }

  const scoreJob = async (job) => {
    await run(async () => {
      const data = await skillSphereJobMatch({
        ...ctx,
        job_title: job.title,
        company: job.company || '—',
        job_description: job.jd,
      })
      setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, match: data } : j)))
    })
  }

  return (
    <div className="min-h-screen bg-[#06020c] text-slate-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="magic-blob top-[-10%] right-[-5%]" style={{ animationDelay: '-1s' }} />
        <div className="magic-blob bottom-[-10%] left-[-5%]" style={{ animationDelay: '-3s' }} />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-[#06020c]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(base.hasAnalysis ? '/dashboard' : '/')}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {base.hasAnalysis ? 'Back to dashboard' : 'Home'}
            </button>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
              <span className="font-display font-bold text-white">Skill Sphere</span>
              <span className="text-xs text-slate-500 hidden sm:inline">powered by SkillForge + Gemini</span>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Welcome to Skill Sphere — plan your next move, practice with confidence, and keep everything aligned with your
          SkillForge profile.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Context</p>
          {base.hasAnalysis ? (
            <p className="text-sm text-emerald-400/90">
              Using your last upload analysis (resume text + JD + gap skills). You can still paste more below to override
              empty fields.
            </p>
          ) : (
            <p className="text-sm text-amber-400/90">
              No analysis session found. Paste resume text (and optionally a target JD) for best results — or run an
              analysis from Upload first.
            </p>
          )}
          <textarea
            className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-sm min-h-[100px] placeholder:text-slate-600"
            placeholder="Resume text (optional override / fill-in)"
            value={manualResume}
            onChange={(e) => setManualResume(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-sm min-h-[80px] placeholder:text-slate-600"
            placeholder="Target job description (optional override)"
            value={manualJd}
            onChange={(e) => setManualJd(e.target.value)}
          />
        </div>

        {err && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err}</div>
        )}

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-full text-sm border transition-all ${
                tab === t.id
                  ? 'bg-fuchsia-600/30 border-fuchsia-500/50 text-white'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0514]/80 p-6 min-h-[320px]">
          {tab === 'persona' && (
            <section className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <span>🎭</span> Career Persona
              </h2>
              <p className="text-sm text-slate-400">
                Strengths, growth areas, and value proposition from your resume + target role context.
              </p>
              <button
                type="button"
                disabled={busy || (!ctx.resume_text.trim() && ctx.resume_skills.length === 0)}
                onClick={() =>
                  run(async () => {
                    const res = await skillSphereCareerPersona(ctx)
                    setPersona(res.persona)
                  })
                }
                className="btn-primary px-5 py-2 rounded-full text-sm disabled:opacity-40"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                Generate persona
              </button>
              {persona && (
                <div className="mt-4 space-y-3 text-sm border border-white/10 rounded-xl p-4 bg-black/30">
                  <p className="text-fuchsia-300 font-medium">{persona.headline}</p>
                  <p className="text-slate-300 whitespace-pre-wrap">{persona.narrative}</p>
                  <p className="text-slate-400 font-medium">UVP</p>
                  <p className="text-slate-300">{persona.unique_value_proposition}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-emerald-400/90 text-xs uppercase tracking-wider mb-1">Strengths</p>
                      <ul className="list-disc list-inside text-slate-300 space-y-1">
                        {(persona.strengths || []).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-amber-400/90 text-xs uppercase tracking-wider mb-1">Growth areas</p>
                      <ul className="list-disc list-inside text-slate-300 space-y-1">
                        {(persona.weaknesses_or_growth_areas || []).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs">Suggested roles: {(persona.suggested_roles || []).join(' · ')}</p>
                </div>
              )}
            </section>
          )}

          {tab === 'coach' && (
            <section className="space-y-4 flex flex-col h-[min(70vh,560px)]">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-sky-400" /> AI Career Coach
              </h2>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 border border-white/10 rounded-xl p-3 bg-black/30">
                {coachMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2 text-sm max-w-[95%] ${
                      m.role === 'user' ? 'bg-fuchsia-600/25 ml-auto text-right' : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="text-xs text-slate-500 block mb-1">{m.role}</span>
                    <div className="whitespace-pre-wrap text-left">{m.content}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Ask for role recommendations, negotiation tips, gap analysis..."
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), document.getElementById('coach-send')?.click())}
                />
                <button
                  id="coach-send"
                  type="button"
                  disabled={busy || !coachInput.trim()}
                  onClick={() =>
                    run(async () => {
                      const next = [...coachMessages, { role: 'user', content: coachInput.trim() }]
                      setCoachInput('')
                      const data = await skillSphereCareerCoach({
                        ...ctx,
                        messages: next.filter((m) => m.role !== 'assistant' || m.content).map((m) => ({
                          role: m.role === 'ai' ? 'assistant' : m.role,
                          content: m.content,
                        })),
                      })
                      const reply = data.reply || 'Here are some ideas.'
                      const actions = (data.suggested_actions || []).map((a) => `• ${a}`).join('\n')
                      setCoachMessages([
                        ...next,
                        {
                          role: 'assistant',
                          content: actions ? `${reply}\n\n**Next steps**\n${actions}` : reply,
                        },
                      ])
                    })
                  }
                  className="btn-primary px-4 py-2 rounded-xl text-sm shrink-0 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                </button>
              </div>
            </section>
          )}

          {tab === 'jobs' && (
            <section className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" /> LinkedIn Job Tracker
              </h2>
              <p className="text-sm text-slate-400">
                Save roles locally (paste from LinkedIn or any board). Use <strong className="text-slate-300">AI match</strong>{' '}
                for an instant fit score. A browser extension can POST the same payload to{' '}
                <code className="text-fuchsia-300/90">POST /api/skill-sphere/job-match</code>.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Job title"
                  value={jobForm.title}
                  onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Company"
                  value={jobForm.company}
                  onChange={(e) => setJobForm((f) => ({ ...f, company: e.target.value }))}
                />
                <input
                  className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm sm:col-span-2"
                  placeholder="Job URL (optional)"
                  value={jobForm.url}
                  onChange={(e) => setJobForm((f) => ({ ...f, url: e.target.value }))}
                />
                <select
                  className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                  value={jobForm.status}
                  onChange={(e) => setJobForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <textarea
                className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-sm min-h-[120px]"
                placeholder="Paste job description (30+ characters)…"
                value={jobForm.jd}
                onChange={(e) => setJobForm((f) => ({ ...f, jd: e.target.value }))}
              />
              <button type="button" onClick={addJob} className="btn-primary px-5 py-2 rounded-full text-sm">
                Add to tracker
              </button>
              <ul className="space-y-3 mt-4">
                {jobs.length === 0 && <li className="text-slate-500 text-sm">No jobs yet.</li>}
                {jobs.map((job) => (
                  <li key={job.id} className="border border-white/10 rounded-xl p-4 bg-black/30 text-sm space-y-2">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{job.title}</p>
                        <p className="text-slate-500">{job.company}</p>
                      </div>
                      <span className="text-xs uppercase tracking-wider text-fuchsia-400/90">{job.status}</span>
                    </div>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noreferrer" className="text-sky-400 inline-flex items-center gap-1 text-xs">
                        Open posting <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => scoreJob(job)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-fuchsia-600/30 border border-fuchsia-500/40 hover:bg-fuchsia-600/40"
                      >
                        AI match score
                      </button>
                      <button
                        type="button"
                        onClick={() => setJobs((list) => list.filter((j) => j.id !== job.id))}
                        className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                    {job.match && (
                      <div className="text-slate-300 border-t border-white/10 pt-2 mt-2 space-y-1">
                        <p className="text-fuchsia-300 font-semibold">Match: {job.match.match_score}%</p>
                        <p>{job.match.summary}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === 'peers' && (
            <section className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Peer Learning
              </h2>
              <p className="text-sm text-slate-400">Study themes, accountability rhythm, and discussion prompts for your target role.</p>
              <input
                className="w-full max-w-md rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                value={peerRole}
                onChange={(e) => setPeerRole(e.target.value)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const data = await skillSpherePeerLearning({ ...ctx, target_role: peerRole })
                    setPeerData(data)
                  })
                }
                className="btn-primary px-5 py-2 rounded-full text-sm"
              >
                Generate peer-learning plan
              </button>
              {peerData && (
                <div className="text-sm space-y-3 border border-white/10 rounded-xl p-4 bg-black/30">
                  <p className="text-slate-400">{peerData.accountability_rhythm}</p>
                  <div>
                    <p className="text-emerald-400/90 text-xs uppercase mb-1">Study group themes</p>
                    <ul className="list-disc list-inside text-slate-300">{(peerData.study_group_themes || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-sky-400/90 text-xs uppercase mb-1">Discussion prompts</p>
                    <ul className="list-disc list-inside text-slate-300">{(peerData.discussion_prompts || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-fuchsia-400/90 text-xs uppercase mb-1">Mock peer archetypes</p>
                    <ul className="space-y-2">
                      {(peerData.mock_peer_profiles || []).map((p, i) => (
                        <li key={i} className="border border-white/5 rounded-lg p-2">
                          <span className="text-white font-medium">{p.archetype}</span> — {p.focus}
                          <p className="text-slate-500 text-xs mt-1">{p.how_to_find}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === 'learning' && (
            <section className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" /> Personalized Learning
              </h2>
              <p className="text-sm text-slate-400">Phased path aligned to your detected gaps (complements the main SkillForge roadmap).</p>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const data = await skillSpherePersonalizedLearning(ctx)
                    setLearnPath(data)
                  })
                }
                className="btn-primary px-5 py-2 rounded-full text-sm"
              >
                Build learning path
              </button>
              {learnPath && (
                <div className="text-sm border border-white/10 rounded-xl p-4 bg-black/30 space-y-3">
                  <p className="text-white font-medium">{learnPath.path_title}</p>
                  <p className="text-slate-400">
                    ~{learnPath.weeks_estimate} weeks · {learnPath.weekly_commitment_hours} h/week suggested
                  </p>
                  {(learnPath.phases || []).map((ph, i) => (
                    <div key={i} className="border-l-2 border-fuchsia-500/50 pl-3">
                      <p className="text-fuchsia-300 font-medium">{ph.name}</p>
                      <p className="text-slate-500 text-xs">Skills: {(ph.focus_skills || []).join(', ')}</p>
                      <ul className="list-disc list-inside text-slate-300 mt-1">{(ph.milestones || []).map((m, j) => <li key={j}>{m}</li>)}</ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'interview' && (
            <section className="space-y-6">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-orange-400" /> Mock Interview Arena
              </h2>
              <p className="text-sm text-slate-400">
                Live P2P WebRTC + cloud judge environments are heavy infrastructure; use{' '}
                <button type="button" onClick={() => navigate('/quiz')} className="text-fuchsia-400 underline">
                  Quiz Arena
                </button>{' '}
                for timed multiplayer practice. Below, paste a take-home or live-coding snippet for{' '}
                <strong className="text-slate-300">AI performance feedback</strong> (SkillSphere-style report).
              </p>
              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                placeholder="Problem statement (optional)"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
              />
              <input
                className="w-full max-w-xs rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                placeholder="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
              <textarea
                className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-sm min-h-[200px] font-mono"
                placeholder="Your code…"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || !code.trim()}
                onClick={() =>
                  run(async () => {
                    const data = await skillSphereInterviewReport({
                      problem_statement: problem,
                      code,
                      language,
                    })
                    setReport(data)
                  })
                }
                className="btn-primary px-5 py-2 rounded-full text-sm flex items-center gap-2"
              >
                <FileBarChart className="w-4 h-4" />
                Get AI performance report
              </button>
              {report && (
                <div className="text-sm border border-white/10 rounded-xl p-4 bg-black/30 space-y-2">
                  <p className="text-fuchsia-300 font-semibold">Score: {report.overall_score}/100</p>
                  <p className="text-slate-300">{report.code_quality}</p>
                  <p className="text-slate-300">{report.efficiency}</p>
                  <p className="text-xs text-slate-500 uppercase">Risks</p>
                  <ul className="list-disc list-inside">{(report.correctness_risks || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}
            </section>
          )}

          {tab === 'trends' && (
            <section className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Job Market Trends
              </h2>
              <p className="text-sm text-slate-400">Profile-aware trend narrative (LLM-grounded heuristics, not live salary APIs).</p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm flex-1 min-w-[160px]"
                  placeholder="Role hint"
                  value={roleHint}
                  onChange={(e) => setRoleHint(e.target.value)}
                />
                <input
                  className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm flex-1 min-w-[160px]"
                  placeholder="Location (optional)"
                  value={locHint}
                  onChange={(e) => setLocHint(e.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const data = await skillSphereJobTrends({
                      ...ctx,
                      profile_role_hint: roleHint,
                      location_hint: locHint,
                    })
                    setTrends(data)
                  })
                }
                className="btn-primary px-5 py-2 rounded-full text-sm"
              >
                Refresh insights
              </button>
              {trends && (
                <div className="space-y-4 text-sm border border-white/10 rounded-xl p-4 bg-black/30">
                  <p className="text-slate-300">{trends.salary_insight}</p>
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-2">Trending roles</p>
                    <ul className="space-y-2">
                      {(trends.trending_roles || []).map((r, i) => (
                        <li key={i} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                          <span className="text-white">{r.title}</span>
                          <span className="text-slate-500 text-xs">{r.salary_band_usd}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-2">Chart</p>
                    <div className="space-y-2">
                      {(trends.chart_friendly || []).map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-28 truncate text-xs text-slate-400">{c.label}</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-fuchsia-600 to-violet-500 rounded-full"
                              style={{ width: `${Math.min(100, Number(c.value) || 0)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-8">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === 'portfolio' && (
            <section className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-400" /> Dynamic Portfolio Builder
              </h2>
              <p className="text-sm text-slate-400">Single-page HTML you can download and host on GitHub Pages or Netlify.</p>
              <input
                className="w-full max-w-md rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                placeholder="Display name"
                value={nameHint}
                onChange={(e) => setNameHint(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || (ctx.resume_text || manualResume).trim().length < 80}
                onClick={() =>
                  run(async () => {
                    const data = await skillSpherePortfolio({
                      resume_text: (ctx.resume_text || manualResume).trim(),
                      name_hint: nameHint,
                    })
                    setPortfolioHtml(data.html || '')
                  })
                }
                className="btn-primary px-5 py-2 rounded-full text-sm"
              >
                Generate portfolio HTML
              </button>
              {portfolioHtml && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([portfolioHtml], { type: 'text/html' })
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(blob)
                        a.download = 'skillforge-portfolio.html'
                        a.click()
                        URL.revokeObjectURL(a.href)
                      }}
                      className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5"
                    >
                      <Download className="w-4 h-4" /> Download .html
                    </button>
                  </div>
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-white h-[480px]">
                    <iframe title="Portfolio preview" className="w-full h-full" srcDoc={portfolioHtml} sandbox="allow-same-origin" />
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
