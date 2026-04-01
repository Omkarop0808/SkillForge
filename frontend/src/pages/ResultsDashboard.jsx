import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Play, CheckCircle2, Lock, Flame, Trophy, LayoutDashboard, BrainCircuit, Target, Settings, HelpCircle, ChevronRight, X, BookOpen, Clock, PlayCircle, Loader2, LogOut, ArrowRight, Video, Download, Menu, Orbit } from 'lucide-react'
import { UserButton, useUser } from '@clerk/clerk-react'
import YouTube from 'react-youtube'
import confetti from 'canvas-confetti'
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { scrapeUrl, skillSphereRoleTargets } from '../utils/api'

/* ─── Gamified Node Component ──────────────────────── */
function CandyNode({ data }) {
  const { isCompleted, isCurrent, isLocked } = data;
  let styles = "bg-slate-800 border-slate-700 text-slate-500 opacity-60"; // locked
  let Icon = Lock;
  if (isCompleted) {
    styles = "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]";
    Icon = CheckCircle2;
  } else if (isCurrent) {
    styles = "bg-purple-600 border-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.8)] animate-bounce hover:scale-110";
    Icon = Play;
  }
  return (
    <div 
      className={`rounded-full flex items-center justify-center w-20 h-20 border-4 cursor-pointer transition-all duration-300 relative ${styles}`}
      onClick={() => {
        if (!isLocked) data.onNodeClick?.(data)
      }}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 w-0 h-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 w-0 h-0" />
      <Icon className="w-10 h-10" strokeWidth={isCurrent ? 3 : 2} />
      <div className="absolute top-20 w-40 text-center mt-3 pointer-events-none bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1">
        <p className="text-sm font-bold text-slate-200 drop-shadow-md leading-tight">{data.label || data.skill}</p>
      </div>
    </div>
  )
}

/* ─── Gap Node Component ──────────────────────── */
function GapNode({ data }) {
  const { isCompleted, isCurrent, isLocked } = data;
  let severity = 'partial';
  let currentLevel = 'Beginner';
  let reqLevel = 'Intermediate';
  
  if (data.estimated_hours > 5) { severity = 'critical'; currentLevel = 'None'; reqLevel = 'Advanced'; }
  else if (data.estimated_hours <= 2) { severity = 'near'; currentLevel = 'Intermediate'; reqLevel = 'High'; }

  let borderColor = 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
  let badgeColor = 'bg-yellow-500/20 text-yellow-400';
  let progressColor = 'bg-yellow-500';
  let progressWidth = '50%';
  
  if (severity === 'critical') {
    borderColor = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    badgeColor = 'bg-red-500/20 text-red-500';
    progressColor = 'bg-red-500';
    progressWidth = '10%';
  } else if (severity === 'near') {
    borderColor = 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
    badgeColor = 'bg-green-500/20 text-green-400';
    progressColor = 'bg-green-500';
    progressWidth = '80%';
  }

  if (isCompleted) {
    borderColor = 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] bg-[#05140a]/95';
    badgeColor = 'bg-emerald-500/20 text-emerald-400';
    progressColor = 'bg-emerald-500';
    progressWidth = '100%';
    severity = 'Acquired';
  }

  return (
    <div className={`w-72 backdrop-blur border-2 rounded-xl p-5 flex flex-col gap-3 relative group transition-all hover:scale-105 ${borderColor} ${isCompleted ? 'opacity-75' : 'bg-[#0a0514]/95'}`}>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 rounded-full border border-slate-700 bg-slate-900 -top-[7px]" />
      <Handle type="source" position={Position.Bottom} className={`w-3 h-3 rounded-full border border-slate-900 -bottom-[7px] ${progressColor}`} />

      <div className="flex justify-between items-start">
        <h3 className="text-white font-bold text-lg leading-tight w-2/3">{data.skill}</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badgeColor}`}>
          {severity} gap
        </span>
      </div>
      
      <div className="text-xs text-slate-400 flex flex-col gap-1 mt-2">
        <span className="flex justify-between">Current Level: <span className="text-white font-medium">{currentLevel}</span></span>
        <span className="flex justify-between">Required Level: <span className="text-white font-medium">{reqLevel}</span></span>
      </div>
      
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 mb-2">
        <div className={`h-full ${progressColor}`} style={{ width: progressWidth }} />
      </div>
      
      {isCompleted ? (
        <div className="w-full py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-sm text-emerald-400 font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Skill Acquired!
        </div>
      ) : (
        <button 
          onClick={() => data.onNodeClick?.(data)}
          className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-sm text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50"
        >
          <Play className="w-4 h-4" /> Learn This
        </button>
      )}

      {/* Hover Tooltip */}
      <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-[300px] bg-slate-900 border border-slate-700 text-slate-300 text-xs p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-2xl">
        <p className="font-bold text-white mb-1">Why learn {data.skill}?</p>
        <p>{data.reasoning?.why_needed || "Core requirement for this role."}</p>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-b border-r border-slate-700 rotate-45" />
      </div>
    </div>
  )
}

const nodeTypes = { candyNode: CandyNode, gapNode: GapNode }

/* ─── Tracked YouTube Player Component ──────────────────────── */
function TrackedYouTube({ url, onComplete }) {
  const [player, setPlayer] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      // 1 = playing
      if (player.getPlayerState() === 1) { 
        const ct = player.getCurrentTime()
        const dur = player.getDuration()
        if (dur > 0) {
          const pct = (ct / dur) * 100;
          setProgress(pct)
          if (pct >= 80) {
            onComplete()
            clearInterval(interval)
          }
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [player, onComplete])

  let videoId = ""
  let isPlaylist = false
  let playlistUrl = ""
  
  if (url.includes("videoseries?list=") || url.includes("listType=search")) {
    isPlaylist = true
    playlistUrl = url
  } else if (url.includes("watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0]
  } else if (url.includes("embed/")) {
    videoId = url.split("embed/")[1]?.split("?")[0]
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0]
  }

  // --- Dynamic Playlist Search Support ---
  if (isPlaylist) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video mb-6 bg-black flex flex-col">
        <iframe 
          className="w-full flex-1 border-0"
          src={playlistUrl}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
        {/* Manual Complete Trigger for Iframe Sandboxes */}
        <div className="h-10 w-full bg-slate-900 border-t border-white/10 flex items-center justify-center">
            <button 
              onClick={onComplete} 
              className="text-xs text-purple-400 hover:text-purple-300 uppercase font-bold tracking-[0.2em] transition-colors h-full w-full flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark Playlist Progress Complete
            </button>
        </div>
      </div>
    )
  }

  // --- Single Video Support ---

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video mb-6 bg-black">
      <YouTube 
        videoId={videoId}
        opts={{
          height: '100%',
          width: '100%',
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1 }
        }}
        className="w-full h-full absolute inset-0"
        onReady={(e) => setPlayer(e.target)}
      />
      {/* Dynamic Progress Bar */}
      <div className="h-1.5 w-full bg-slate-800 absolute bottom-0 left-0 bg-opacity-90 z-10">
        <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function ResultsDashboard() {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [activeVideo, setActiveVideo] = useState(null) // Controls the currently playing iframe
  const [completedIds, setCompletedIds] = useState(new Set())
  const [activeTab, setActiveTab] = useState('resources')
  const [currentView, setCurrentView] = useState('gap') // Start on Gap Map!
  
  // Reset active video when module changes
  useEffect(() => {
    setActiveVideo(null)
  }, [selectedModule])
  const [isExporting, setIsExporting] = useState(false)

  const [roleInsights, setRoleInsights] = useState(null)
  const [roleInsightsLoading, setRoleInsightsLoading] = useState(false)
  const [roleInsightsError, setRoleInsightsError] = useState('')
  const roleInsightSessionRef = useRef(null)
  const [roleInsightRefresh, setRoleInsightRefresh] = useState(0)

  const { user } = useUser()
  const userName = user?.firstName || "Student"
  
  // Settings & Navigation State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Mentor State
  const [isMentorOpen, setIsMentorOpen] = useState(false)
  const [mentorChat, setMentorChat] = useState([])
  const [isMentorTyping, setIsMentorTyping] = useState(false)

  const handleMentorSubmit = async (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      const query = e.target.value.trim()
      setMentorChat(prev => [...prev, { role: 'user', text: query }])
      e.target.value = ''
      setIsMentorTyping(true)
      
      try {
        if (query.includes("http://") || query.includes("https://")) {
          const scrapedData = await scrapeUrl(query);
          
          const noteCard = {
            title: scrapedData.title || "📝 Extracted Notes",
            topics: scrapedData.topics || [],
            points: scrapedData.takeaways || [],
            sourceUrl: query,
            sourceType: scrapedData.source_type
          };
          
          setMentorChat(prev => [...prev, { 
            role: 'ai', 
            text: "I fetched that URL! Here are the key takeaways I extracted:", 
            noteCard,
            isScraped: true,
            isSaved: false
          }])
        } else {
          // Standard generic AI response handler
          setTimeout(() => {
            let reply = "I've saved that to your Notebook. Do you want me to quiz you on this later?"
            let noteCard = null;
            if (query.toLowerCase().includes("summarize")) {
              reply = "I analyzed this module for you. Here is your structured summary:"
              noteCard = {
                title: "⚡ Concept Summary",
                points: [
                  "The core concept revolves around optimizing data traversals.",
                  "Track your state rigorously to prevent recursive infinite loops.",
                  "I've appended this flashcard to your active skill node for later review."
                ]
              }
            }
            setMentorChat(prev => [...prev, { role: 'ai', text: reply, noteCard }])
            setIsMentorTyping(false)
          }, 1500)
          return;
        }
      } catch (err) {
        console.error(err);
        setMentorChat(prev => [...prev, { role: 'ai', text: `Sorry, I couldn't read that URL. Reason: ${err.message}` }])
      }
      
      setIsMentorTyping(false)
    }
  }

  const handleSaveNote = (msg, idx) => {
    const existingNotes = JSON.parse(localStorage.getItem('skillforge_notes') || '[]');
    const newNote = {
      id: Date.now().toString(),
      title: msg.noteCard.title,
      tags: msg.noteCard.topics || ['Scraped'],
      sourceType: msg.noteCard.sourceType || 'article',
      url: msg.noteCard.sourceUrl || '',
      date: new Date().toISOString(),
      content: `# ${msg.noteCard.title}\n\n` + msg.noteCard.points.map(p => `- ${p}`).join('\n')
    };
    localStorage.setItem('skillforge_notes', JSON.stringify([newNote, ...existingNotes]));
    
    setMentorChat(prev => prev.map((m, i) => i === idx ? { ...m, isSaved: true, text: "✅ Saved securely to your Notes!" } : m));
  }

  const handleCancelNote = (idx) => {
    setMentorChat(prev => prev.map((m, i) => i === idx ? { ...m, isScraped: false } : m));
  }

  useEffect(() => {
    const stored = sessionStorage.getItem('skillforge_result')
    if (!stored) { navigate('/upload'); return }
    setResult(JSON.parse(stored))
  }, [navigate])

  const handleLogout = () => {
    sessionStorage.removeItem('skillforge_result')
    sessionStorage.removeItem('is_demo')
    navigate('/')
  }

  const handleNodeClick = (mod) => {
    setSelectedModule(mod)
  }

  // Auto-select the first uncompleted module on load
  useEffect(() => {
    if (result && !selectedModule) {
      const allMods = result.roadmap?.phases?.flatMap(p => p.modules) || []
      if (allMods.length > 0) {
        const firstUncompIdx = allMods.findIndex(mod => !completedIds.has(mod.skill))
        const idx = firstUncompIdx !== -1 ? firstUncompIdx : 0
        setSelectedModule(allMods[idx])
      }
    }
  }, [result, selectedModule, completedIds])

  const handleMarkComplete = (moduleId) => {
    setCompletedIds(prev => {
      if (prev.has(moduleId)) return prev;
      const next = new Set(prev)
      next.add(moduleId)
      const allModules = result?.roadmap?.phases?.flatMap(p => p.modules) || []
      
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
      
      const firstUncompletedIndex = allModules.findIndex(mod => !next.has(mod.skill));
      if (firstUncompletedIndex !== -1) {
         setTimeout(() => {
           setSelectedModule(allModules[firstUncompletedIndex]);
         }, 800)
      } else {
        setTimeout(() => confetti({ particleCount: 300, spread: 160, origin: { y: 0.5 } }), 500)
      }
      return next
    })
  }

  useEffect(() => {
    setRoleInsights(null)
    setRoleInsightsError('')
    roleInsightSessionRef.current = null
    setRoleInsightRefresh(0)
  }, [result?.session_id])

  useEffect(() => {
    if (currentView !== 'progress' || !result?.session_id) return
    if (roleInsightSessionRef.current === result.session_id) return
    let cancelled = false
    ;(async () => {
      setRoleInsightsLoading(true)
      setRoleInsightsError('')
      try {
        const profileSkills = result.profile?.skills || []
        const skills = profileSkills.map((s) => s.name)
        const roadmapMods = result.roadmap?.phases?.flatMap((p) => p.modules || []) || []
        const gaps = [
          ...new Set([
            ...(result.gap_summary?.critical_missing || []),
            ...roadmapMods.map((m) => m.skill),
          ]),
        ]
        let jd = ''
        try {
          const raw = sessionStorage.getItem('skillforge_session')
          if (raw) jd = JSON.parse(raw).jdText || ''
        } catch {
          /* ignore */
        }
        const data = await skillSphereRoleTargets({
          resume_skills: skills,
          skills_still_needed: gaps.slice(0, 35),
          experience_level: result.profile?.experience_level || 'mid',
          jd_text_snippet: jd.slice(0, 6000),
          match_percentage: result.profile?.match_percentage ?? 0,
        })
        if (!cancelled) {
          setRoleInsights(data)
          roleInsightSessionRef.current = result.session_id
        }
      } catch (e) {
        if (!cancelled) setRoleInsightsError(e.message || 'Failed to load role insights')
      } finally {
        if (!cancelled) setRoleInsightsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentView, result, roleInsightRefresh])

  const chartAlignment = useMemo(() => {
    if (!result?.gap_summary) return []
    const g = result.gap_summary
    const tr = Math.max(g.total_required || 0, 1)
    const mc = Math.min(g.matched_count || 0, tr)
    const gap = Math.max(0, tr - mc)
    if (gap === 0 && mc > 0) {
      return [{ name: 'Aligned with JD', value: mc, fill: '#10b981' }]
    }
    return [
      { name: 'Aligned with target JD', value: mc || 0.001, fill: '#a855f7' },
      { name: 'Still to acquire', value: gap || 0.001, fill: '#475569' },
    ]
  }, [result])

  const skillCoverageBars = useMemo(() => {
    if (!result?.profile?.skills?.length) return []
    const score = (m) => (m === 'strong' ? 100 : m === 'partial' ? 62 : 38)
    return [...result.profile.skills]
      .map((s) => ({
        name: s.name.length > 20 ? `${s.name.slice(0, 18)}…` : s.name,
        Coverage: score(s.match),
        match: s.match,
      }))
      .sort((a, b) => a.Coverage - b.Coverage)
      .slice(0, 14)
  }, [result])

  const roadmapProgressBars = useMemo(() => {
    if (!result?.roadmap) return []
    const mods = result.roadmap.phases?.flatMap((p) => p.modules || []) || []
    return mods.slice(0, 16).map((m) => ({
      name: m.skill.length > 20 ? `${m.skill.slice(0, 18)}…` : m.skill,
      Progress: completedIds.has(m.skill) ? 100 : 0,
    }))
  }, [result, completedIds])

  if (!result) return null

  const { roadmap, gap_summary } = result
  const allModules = roadmap?.phases?.flatMap(p => p.modules) || []
  
  const firstUncompletedIndex = allModules.findIndex(mod => !completedIds.has(mod.skill));
  const defaultCurrentIndex = firstUncompletedIndex === -1 ? allModules.length : firstUncompletedIndex;

  // React Flow Setup (Candy Mindmap)
  const COL_WIDTH = 250;
  const candyNodes = allModules.map((m, index) => {
    // Elegant snake layout 3 nodes wide
    const row = Math.floor(index / 3);
    const colTheme = index % 3;
    const isEven = row % 2 === 0;
    const xIndex = isEven ? colTheme : (2 - colTheme);
    
    return {
      id: `node-${m.skill.replace(/ /g, '-')}`,
      type: 'candyNode',
      position: { x: xIndex * COL_WIDTH + 80, y: row * 150 + 50 },
      data: { 
        ...m, 
        isCompleted: completedIds.has(m.skill),
        isCurrent: index === defaultCurrentIndex,
        isLocked: index > defaultCurrentIndex,
        onNodeClick: (mod) => {
          handleNodeClick(mod);
          setCurrentView('dashboard');
        }
      }
    }
  });

  const candyEdges = allModules.slice(0, -1).map((m, i) => {
    const nextM = allModules[i+1];
    return {
      id: `edge-${i}`,
      source: `node-${m.id}`,
      target: `node-${nextM.id}`,
      type: 'smoothstep',
      animated: completedIds.has(m.id),
      style: { stroke: completedIds.has(m.id) ? '#10b981' : '#334155', strokeWidth: 4 }
    }
  });

  // React Flow Setup (Skill Gap Map)
  // Winding vertical zigzag (Responsive)
  const GAP_ROW_HEIGHT = 180;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const gapNodes = allModules.map((m, index) => {
    const isEven = index % 2 === 0;
    const xPos = isMobile ? 50 : (isEven ? 100 : 450);
    
    return {
      id: `gap-${m.skill.replace(/ /g, '-')}`,
      type: 'gapNode',
      position: { x: xPos, y: index * GAP_ROW_HEIGHT + 50 },
      data: { 
        ...m, 
        isCompleted: completedIds.has(m.skill),
        onNodeClick: (mod) => {
          handleNodeClick(mod);
          setCurrentView('dashboard');
        }
      }
    }
  });

  const gapEdges = allModules.slice(0, -1).map((m, i) => {
    const nextM = allModules[i+1];
    return {
      id: `gapedge-${i}`,
      source: `gap-${m.skill.replace(/ /g, '-')}`,
      target: `gap-${nextM.skill.replace(/ /g, '-')}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#475569', strokeWidth: 2 }
    }
  });

  // Advanced 6-Page AI PDF Export Function
  const exportPDF = async () => {
    setIsExporting(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)

      // Helpers
      const addHeader = (title) => {
        pdf.setFillColor(10, 5, 20)
        pdf.rect(0, 0, pageWidth, 25, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(16)
        pdf.text(title, margin, 16)
      }

      const drawLine = (y) => {
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, y, pageWidth - margin, y)
      }

      const totalHours = allModules.reduce((acc, m) => acc + (m.estimated_hours || 0), 0)
      const criticalGaps = allModules.filter(m => m.estimated_hours > 5).length
      
      // PAGE 1: Cover Page
      pdf.setFillColor(15, 10, 30)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      pdf.setTextColor(168, 85, 247) // Purple
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(36)
      pdf.text("SkillForge", pageWidth / 2, pageHeight * 0.4, { align: "center" })
      pdf.setTextColor(200, 200, 200)
      pdf.setFontSize(16)
      pdf.text("Your Personalized AI Learning Roadmap", pageWidth / 2, pageHeight * 0.48, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(`Prepared for: ${user?.fullName || 'Student'}`, pageWidth / 2, pageHeight * 0.55, { align: "center" })
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight * 0.6, { align: "center" })
      pdf.setFontSize(14)
      pdf.setTextColor(100, 255, 100)
      pdf.text(`Target Role: ${gap_summary?.job_title || 'Target Role'}`, pageWidth / 2, pageHeight * 0.68, { align: "center" })

      // PAGE 2: Executive Summary
      pdf.addPage()
      addHeader("Executive Summary")
      
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(22)
      pdf.setTextColor(50, 50, 50)
      pdf.text("Readiness Assessment", margin, 45)
      
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(80, 80, 80)
      let execText = `Based on a comprehensive AI analysis of your resume against the target role requirements, you have a solid foundation but currently exhibit ${allModules.length} distinct skill gaps. Among these, ${criticalGaps} are considered critical and require immediate targeted learning.`
      let splitExec = pdf.splitTextToSize(execText, contentWidth)
      pdf.text(splitExec, margin, 55)

      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(0,0,0)
      pdf.text(`Total Skills Missing: ${allModules.length}`, margin, 85)
      pdf.text(`Estimated Time to Readiness: ~${Math.ceil(totalHours / 14)} weeks (at 2 hrs/day)`, margin, 95)
      pdf.text(`Current Readiness Score: ${allModules.length === 0 ? 100 : Math.max(20, Math.floor(100 - (allModules.length * 5)))}%`, margin, 105)

      // PAGE 3: Skill Gap Breakdown
      pdf.addPage()
      addHeader("Skill Gap Breakdown")
      let yOffset = 40
      
      pdf.setFillColor(240, 240, 240)
      pdf.rect(margin, yOffset - 5, contentWidth, 10, 'F')
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(10)
      pdf.setTextColor(0,0,0)
      pdf.text("Skill Name", margin + 2, yOffset + 2)
      pdf.text("Current Level", margin + 60, yOffset + 2)
      pdf.text("Severity", margin + 110, yOffset + 2)
      pdf.text("Est. Hours", margin + 145, yOffset + 2)
      
      yOffset += 15
      pdf.setFont("helvetica", "normal")
      allModules.forEach((m) => {
        let severity = m.estimated_hours > 5 ? 'Critical' : m.estimated_hours > 2 ? 'Partial' : 'Near-Competent'
        let currentLevel = m.estimated_hours > 5 ? 'None' : m.estimated_hours > 2 ? 'Beginner' : 'Intermediate'
        
        if (severity === 'Critical') pdf.setTextColor(220, 38, 38)
        else if (severity === 'Partial') pdf.setTextColor(217, 119, 6)
        else pdf.setTextColor(22, 163, 74)
        
        pdf.text(m.skill.substring(0, 25), margin + 2, yOffset)
        pdf.setTextColor(80,80,80)
        pdf.text(currentLevel, margin + 60, yOffset)
        pdf.text(severity, margin + 110, yOffset)
        pdf.text(`${m.estimated_hours}h`, margin + 145, yOffset)
        drawLine(yOffset + 3)
        yOffset += 10
        
        if (yOffset > pageHeight - 20) {
          pdf.addPage()
          addHeader("Skill Gap Breakdown (Cont.)")
          yOffset = 40
        }
      })

      // PAGE 4: AI-Generated Learning Path
      pdf.addPage()
      addHeader("AI-Generated Learning Path")
      yOffset = 40
      
      allModules.forEach((m, idx) => {
        if (yOffset > pageHeight - 50) {
          pdf.addPage()
          addHeader("AI-Generated Learning Path (Cont.)")
          yOffset = 40
        }
        
        let severity = m.estimated_hours > 5 ? 'Critical' : m.estimated_hours > 2 ? 'Partial' : 'Minor'

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(12)
        pdf.setTextColor(0,0,0)
        pdf.text(`SKILL: ${m.skill}`, margin, yOffset)
        drawLine(yOffset + 2)
        yOffset += 8
        
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(9)
        pdf.setTextColor(80,80,80)
        pdf.text(`Priority: ${severity} | Est. Time: ${m.estimated_hours} hours`, margin, yOffset)
        yOffset += 6
        
        const whyText = m.reasoning?.why_needed || "Core requirement for the target role."
        const splitWhy = pdf.splitTextToSize(`How to Learn This: ${whyText}`, contentWidth)
        pdf.text(splitWhy, margin, yOffset)
        yOffset += (splitWhy.length * 5) + 3
        
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(37, 99, 235)
        pdf.text(`Recommended Resource: ${m.course?.title || m.skill + ' Tutorial'}`, margin, yOffset)
        yOffset += 5
        pdf.setFont("helvetica", "normal")
        pdf.text(m.course?.url || `https://youtube.com/results?search_query=${m.skill}+tutorial`, margin, yOffset)
        yOffset += 12
      })

      // PAGE 5: Weekly Study Schedule
      pdf.addPage()
      addHeader("Weekly Study Schedule")
      yOffset = 40
      let currentWeek = 1
      let currentWeekHours = 0
      
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      pdf.setTextColor(0,0,0)
      pdf.text(`Week ${currentWeek}`, margin, yOffset)
      yOffset += 8
      
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(80,80,80)

      allModules.forEach((m) => {
        if (currentWeekHours + m.estimated_hours > 14) {
          currentWeek++
          currentWeekHours = 0
          yOffset += 10
          if (yOffset > pageHeight - 30) {
             pdf.addPage()
             addHeader("Weekly Study Schedule (Cont.)")
             yOffset = 40
          }
          pdf.setFont("helvetica", "bold")
          pdf.setTextColor(0,0,0)
          pdf.text(`Week ${currentWeek}`, margin, yOffset)
          yOffset += 8
          pdf.setFont("helvetica", "normal")
          pdf.setTextColor(80,80,80)
        }
        pdf.text(`• ${m.skill} (${m.estimated_hours}h)`, margin + 5, yOffset)
        currentWeekHours += m.estimated_hours
        yOffset += 6
      })

      // PAGE 6: Resources Reference Sheet
      pdf.addPage()
      addHeader("Resources Reference Sheet")
      yOffset = 40
      
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      pdf.setTextColor(0,0,0)
      pdf.text("Top Indian Tech Educators (Recommended)", margin, yOffset)
      yOffset += 10
      
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)
      pdf.setTextColor(80,80,80)
      const educators = [
        "CodeWithHarry - Master full-stack Hindi playlists",
        "Akshay Saini - Namaste Series (Deep JS/React concepts)",
        "Hitesh Choudhary - Chai aur Code (Modern web dev)",
        "Striver (Take U Forward) - Algorithms and LeetCode",
        "Thapa Technical - Project-based Hindi tutorials"
      ]
      educators.forEach(ed => {
        pdf.text(`• ${ed}`, margin + 5, yOffset)
        yOffset += 7
      })
      
      yOffset += 10
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      pdf.setTextColor(0,0,0)
      pdf.text("Practice Platforms & Docs", margin, yOffset)
      yOffset += 10
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)
      pdf.setTextColor(37, 99, 235)
      pdf.text("• LeetCode: https://leetcode.com/problemset/all", margin + 5, yOffset)
      yOffset += 7
      pdf.text("• Roadmap.sh: https://roadmap.sh", margin + 5, yOffset)
      yOffset += 7
      pdf.text("• MDN Web Docs: https://developer.mozilla.org", margin + 5, yOffset)

      // Save PDF
      const dateStr = new Date().toISOString().split('T')[0]
      pdf.save(`SkillForge_Report_${userName.replace(' ', '_')}_${dateStr}.pdf`)
      
    } catch (err) {
      console.error("PDF generation error:", err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] clay-hero-bg text-slate-900 overflow-hidden font-sans">
      
      {/* MOBILE OVERLAY BACKDROP */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Knovify Style) */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-64 border-r border-black/5 flex flex-col bg-white/75 backdrop-blur-md p-6 shadow-[0_14px_0_rgba(15,23,42,0.10),0_30px_80px_rgba(15,23,42,0.10)] z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} overflow-y-auto`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#16a34a]" />
            </div>
            <span className="text-xl font-display font-extrabold text-slate-950 tracking-tight">SkillForge</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-black/5 rounded-full text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs font-extrabold text-slate-600 mb-4 tracking-widest uppercase">Learn</p>
        <nav className="space-y-2 mb-10 text-sm font-medium">
          <div 
            onClick={() => setCurrentView('gap')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors border ${currentView === 'gap' ? 'bg-white text-slate-950 border-black/10 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)]' : 'border-black/5 text-slate-700 hover:text-slate-950 hover:bg-white/70'}`}
          >
            <Target className="w-4 h-4 text-red-500" /> Skill Gap Map
          </div>
          <div 
            onClick={() => setCurrentView('mindmap')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors border ${currentView === 'mindmap' ? 'bg-white text-slate-950 border-black/10 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)]' : 'border-black/5 text-slate-700 hover:text-slate-950 hover:bg-white/70'}`}
          >
            <BrainCircuit className="w-4 h-4 text-[#0ea5e9]" /> Interactive Roadmap
          </div>
          <div 
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors border ${currentView === 'dashboard' ? 'bg-white text-slate-950 border-black/10 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)]' : 'border-black/5 text-slate-700 hover:text-slate-950 hover:bg-white/70'}`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#7c3aed]" /> Learning Hub
          </div>
          <div 
            onClick={() => setCurrentView('progress')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors border ${currentView === 'progress' ? 'bg-white text-slate-950 border-black/10 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)]' : 'border-black/5 text-slate-700 hover:text-slate-950 hover:bg-white/70'}`}
          >
            <Download className="w-4 h-4 text-emerald-600" /> My Progress
          </div>
          <div 
            onClick={() => navigate('/notes')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors text-slate-400 hover:text-white hover:bg-purple-500/10 hover:border hover:border-purple-500/20`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" /> My Notes
          </div>
          <div 
            onClick={() => navigate('/quiz')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors text-slate-400 hover:text-white hover:bg-orange-500/10 hover:border hover:border-orange-500/20`}
          >
            <Flame className="w-4 h-4 text-orange-500" /> Quiz Arena
          </div>
          <div 
            onClick={() => navigate('/skill-sphere')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors text-slate-400 hover:text-white hover:bg-fuchsia-500/10 hover:border hover:border-fuchsia-500/20`}
          >
            <Orbit className="w-4 h-4 text-fuchsia-400" /> Skill Sphere
          </div>
        </nav>

        <p className="text-xs font-extrabold text-slate-600 mb-4 tracking-widest uppercase">Support</p>
        <nav className="space-y-2 text-sm font-medium">
          <div 
            onClick={() => setIsMentorOpen(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/70 cursor-pointer transition-colors text-slate-700 hover:text-slate-950 border border-black/5"
          >
            <BrainCircuit className="w-4 h-4 text-slate-600" /> AI Mentor (Notebook)
          </div>
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/70 cursor-pointer transition-colors text-slate-700 hover:text-slate-950 border border-black/5"
          >
            <Settings className="w-4 h-4" /> Settings
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-4 border-t border-black/5 pt-6">
           <UserButton afterSignOutUrl="/" />
           {sessionStorage.getItem('is_demo') === 'true' && (
             <button 
               onClick={handleLogout} 
               className="flex items-center gap-2 text-sm font-extrabold text-red-700 hover:text-red-800 transition-colors w-max"
             >
               <LogOut className="w-4 h-4" /> Exit Demo
             </button>
           )}
        </div>
      </aside>

      {/* MAIN LAYOUT: CONDITIONAL TABS */}
      <main className="flex-1 flex flex-col overflow-hidden relative font-sans w-full">
        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/70 border-b border-black/5 z-30 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#16a34a]" />
            <span className="font-display font-extrabold text-slate-950 tracking-tight">SkillForge</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-700 bg-white rounded-2xl border border-black/5 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)]">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-30" />

        {currentView === 'gap' && (
          <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 relative z-10 animate-fade-in custom-scrollbar overflow-y-auto w-full">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-display font-black text-slate-950 mb-2 flex items-center gap-3">
                  <Target className="w-8 h-8 text-red-500" /> Interactive Skill Gap Analysis
                </h1>
                <p className="text-slate-700 max-w-2xl text-sm">
                  You have <span className="text-red-600 font-extrabold">{allModules.filter(m => m.estimated_hours > 5).length} critical gaps</span>, 
                  <span className="text-amber-700 font-extrabold ml-1">{allModules.filter(m => m.estimated_hours <= 5 && m.estimated_hours > 2).length} partial gaps</span>, and 
                  <span className="text-emerald-700 font-extrabold ml-1">{allModules.filter(m => m.estimated_hours <= 2).length} near-competent skills</span> to close before reaching your target role readiness.
                </p>
              </div>
              <button 
                onClick={() => setCurrentView('mindmap')}
                className="px-6 py-3 clay-btn-secondary rounded-2xl font-extrabold transition-all"
              >
                Generate Learning Plan →
              </button>
            </div>
            <div className="flex-1 min-h-[600px] w-full bg-[#0a0514]/50 rounded-3xl border border-white/5 shadow-inner overflow-hidden relative">
              <ReactFlow
                nodes={gapNodes}
                edges={gapEdges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.1 }}
                minZoom={0.3}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#334155" gap={20} size={1} />
                <Controls />
              </ReactFlow>
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="flex-1 flex flex-row w-full h-full overflow-hidden">
            {/* VERTICAL TIMELINE ROADMAP */}
            <div className={`${selectedModule ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 shrink-0 border-r border-slate-800/50 flex-col bg-[#080310] relative z-10 shadow-2xl`}>
              <div className="p-6 border-b border-slate-800/50 bg-[#0a0514]/90 sticky top-0 z-10 backdrop-blur-md">
                <h2 className="text-xl font-display font-medium text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> Course Content
                </h2>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{completedIds.size} / {allModules.length} Modules</span>
                    <span>{Math.round((completedIds.size / allModules.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-green-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(completedIds.size / allModules.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
                {allModules.map((m, idx) => {
                  const isCompleted = completedIds.has(m.skill);
                  const isCurrent = idx === defaultCurrentIndex;
                  const isLocked = idx > defaultCurrentIndex;
                  const isActive = selectedModule?.skill === m.skill;

                  let statusStyles = "border border-transparent hover:bg-white/5";
                  let icon = <Video className="w-4 h-4 text-slate-500" />;
                  let textStyle = "text-slate-400";
                  let badge = null;

                  if (isCompleted) {
                    statusStyles = "border border-green-500/20 bg-green-500/5 shadow-[0_0_10px_rgba(34,197,94,0.05)]";
                    icon = <CheckCircle2 className="w-4 h-4 text-green-500" />;
                    textStyle = "text-slate-300";
                  } else if (isCurrent) {
                    statusStyles = "border border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]";
                    icon = <Play className="w-4 h-4 text-purple-400 fill-purple-400" />;
                    textStyle = "text-white font-medium";
                  } else if (isLocked) {
                    statusStyles = "opacity-50 grayscale";
                    icon = <Lock className="w-4 h-4 text-slate-600" />;
                    textStyle = "text-slate-600";
                  }

                  if (isActive && !isLocked) {
                    statusStyles += " ring-2 ring-purple-500 ring-offset-2 ring-offset-[#080310]";
                  }

                  return (
                    <div 
                      key={m.skill}
                      onClick={() => { if (!isLocked) handleNodeClick(m) }}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${statusStyles} group`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">{icon}</div>
                        <div>
                          <h4 className={`text-sm ${textStyle} leading-tight`}>
                            <span className="text-xs mr-2 opacity-50 font-mono tracking-tighter">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            {m.skill}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {m.estimated_hours}h
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MAIN VIDEO & RESOURCES STAGE */}
            <div className={`${selectedModule ? 'flex' : 'hidden lg:flex'} flex-1 flex-col overflow-y-auto relative z-10 custom-scrollbar p-6 lg:p-10 bg-[#06020c]`}>
              {selectedModule ? (
                <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in w-full">
                  <div className="lg:hidden flex items-center mb-2 -mt-2">
                     <button onClick={() => setSelectedModule(null)} className="flex items-center justify-center p-2 bg-white/5 rounded-full text-slate-400 hover:text-white"><ChevronRight className="w-6 h-6 rotate-180"/></button>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h1 className="text-3xl font-display font-medium text-white mb-2">{selectedModule.skill}</h1>
                      <span className="flex items-center gap-2 text-sm text-slate-400">
                        <BookOpen className="w-4 h-4" /> {selectedModule.difficulty} track
                      </span>
                    </div>
                    {!completedIds.has(selectedModule.skill) ? (
                      <button
                        onClick={() => handleMarkComplete(selectedModule.skill)}
                        className="px-6 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:-translate-y-0.5 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Finish Module
                      </button>
                    ) : (
                      <div className="px-6 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Completed
                      </div>
                    )}
                  </div>

                  {/* YouTube Player & Dynamic 6-Video Grid */}
                  {selectedModule.course && (
                    <div className="w-full">
                      
                      {/* 1. Main Featured Iframe Player */}
                      {(() => {
                        const videoUrl = activeVideo || selectedModule.course.url;
                        if (videoUrl.includes("watch?v=") || videoUrl.includes("youtu.be/") || videoUrl.includes("embed/") || videoUrl.includes("videoseries?list=") || videoUrl.includes("listType=search")) {
                          return <TrackedYouTube url={videoUrl} onComplete={() => handleMarkComplete(selectedModule.skill)} />;
                        } else {
                          return (
                            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block p-8 rounded-2xl bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 hover:border-blue-500/40 transition-colors shadow-2xl mb-6">
                              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                                <ArrowRight className="w-8 h-8 text-blue-400 -rotate-45" />
                              </div>
                              <h3 className="font-bold text-white text-2xl mb-2">{selectedModule.course.title || "External Course"}</h3>
                              <p className="text-sm text-blue-300">Click to open this external course on {selectedModule.course.platform}</p>
                            </a>
                          );
                        }
                      })()}

                      {/* 2. Top Recommended Mentors Grid (6 Videos) */}
                      {selectedModule.course.videos && selectedModule.course.videos.length > 0 && (
                        <div className="mt-8">
                           <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                             <Video className="w-5 h-5 text-purple-400"/> Top Recommended Tutorials
                           </h3>
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                             {selectedModule.course.videos.map((vid, idx) => {
                               const isActivePill = activeVideo === vid.url || (!activeVideo && idx === 0 && selectedModule.course.url === vid.url);
                               return (
                               <div 
                                 key={idx}
                                 onClick={() => { setActiveVideo(vid.url); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                                 className={`cursor-pointer rounded-xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(168,85,247,0.2)] flex flex-col ${isActivePill ? 'border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-1 ring-purple-500' : 'border-white/10 bg-black/40 hover:border-purple-500/50'}`}
                               >
                                  <div className="w-full aspect-video bg-slate-800 relative group">
                                    <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    {isActivePill && <div className="absolute top-2 left-2 bg-purple-600 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-widest uppercase">Now Playing</div>}
                                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-white shadow">{vid.duration}</div>
                                  </div>
                                  <div className="p-3 flex-1 flex flex-col justify-between">
                                    <h4 className="text-sm font-bold text-slate-200 line-clamp-2 leading-tight mb-2 group-hover:text-purple-300 transition-colors" title={vid.title}>{vid.title}</h4>
                                    <div className="flex items-center justify-between text-xs text-slate-400 mt-auto">
                                      <span className="font-medium text-purple-300 line-clamp-1 truncate mr-2" title={vid.channel}>{vid.channel}</span>
                                      <span className="whitespace-nowrap opacity-80">{vid.viewCount} views</span>
                                    </div>
                                  </div>
                               </div>
                             )})}
                           </div>
                        </div>
                      )}
                      
                    </div>
                  )}

                  {/* 3-Tab Resources Panel */}
                  <div className="bg-[#0a0514]/80 border border-white/5 rounded-2xl p-6 shadow-2xl mt-4">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                      <button 
                        onClick={() => setActiveTab('resources')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'resources' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                      >
                        Learning Context
                      </button>
                      <button 
                        onClick={() => setActiveTab('docs')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'docs' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                      >
                        Official Documentation
                      </button>
                      <button 
                        onClick={() => setActiveTab('practice')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'practice' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                      >
                        Hands-on Practice
                      </button>
                    </div>

                    <div className="min-h-[200px]">
                      {activeTab === 'resources' && (
                        <div className="animate-fade-in text-slate-300 leading-relaxed grid md:grid-cols-2 gap-8">
                          <div>
                            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                              <BrainCircuit className="w-5 h-5 text-purple-400"/> Why You Need This
                            </h3>
                            <p className="text-slate-400 text-sm">{selectedModule.reasoning?.why_needed}</p>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-purple-400"/> Recommended Reading
                            </h3>
                            <ul className="space-y-3">
                               <li><a href="#" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline"><ArrowRight className="w-4 h-4"/> freeCodeCamp: {selectedModule.skill} Basics</a></li>
                               <li><a href="#" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline"><ArrowRight className="w-4 h-4"/> DEV.to: Understanding {selectedModule.skill}</a></li>
                            </ul>
                          </div>
                        </div>
                      )}
                      {activeTab === 'docs' && (
                        <div className="animate-fade-in text-slate-300 leading-relaxed max-w-2xl">
                          <h3 className="text-base font-bold text-white mb-2">Canonical Documentation</h3>
                          <p className="mb-6 text-slate-400 text-sm">Always refer to the official specs for the most accurate and up-to-date API references when learning.</p>
                          <ul className="space-y-4">
                             <li><a href={`https://developer.mozilla.org/en-US/search?q=${selectedModule.skill}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-white font-medium group"><BookOpen className="w-5 h-5 text-blue-400"/> MDN Web Docs: {selectedModule.skill} <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                             <li><a href={`https://roadmap.sh/`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-white font-medium group"><BookOpen className="w-5 h-5 text-blue-400"/> Roadmap.sh Reference <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                          </ul>
                        </div>
                      )}
                      {activeTab === 'practice' && (
                        <div className="animate-fade-in text-slate-300 leading-relaxed max-w-2xl">
                          <h3 className="text-base font-bold text-white mb-2">Execution Environments</h3>
                          <p className="mb-6 text-slate-400 text-sm">Execution is the only way to solidify your learning. Open these sandboxes and start coding immediately.</p>
                          <ul className="space-y-4">
                             <li><a href={`https://leetcode.com/problemset/all/?search=${selectedModule.skill}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-emerald-400 font-bold tracking-wide group"><Target className="w-5 h-5"/> Train on LeetCode <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" /></a></li>
                             <li><a href={`https://github.com/search?q=${selectedModule.skill}+template`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-white font-bold tracking-wide group"><Target className="w-5 h-5 text-slate-400" /> Start from GitHub Templates <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" /></a></li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                   <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'mindmap' && (
          <div className="flex-1 flex flex-col p-8 lg:p-12 relative z-10 animate-fade-in custom-scrollbar overflow-y-auto">
            <h1 className="text-3xl font-display font-medium text-white mb-2 flex items-center gap-3">
              <BrainCircuit className="w-8 h-8 text-blue-500" /> Interactive Skill Mindmap
            </h1>
            <p className="text-slate-400 mb-8 max-w-2xl">This flowing landscape visualizes your entire learning journey. Click on any unlocked node to jump straight into the corresponding video lesson in the Learning Hub.</p>
            <div className="h-[600px] w-full bg-black/40 rounded-3xl border border-white/5 shadow-inner overflow-hidden relative">
              <ReactFlow
                nodes={candyNodes}
                edges={candyEdges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.4}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
              >
                <Controls />
              </ReactFlow>
            </div>
          </div>
        )}

        {currentView === 'progress' && (
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative z-10 custom-scrollbar animate-fade-in" id="progress-export-container">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
               <div>
                  <h1 className="text-3xl font-display font-medium text-white flex items-center gap-3 mb-2">
                    <Target className="w-8 h-8 text-emerald-500" /> My Progress & Routine
                  </h1>
                  <p className="text-slate-400">Track your analytics, view your customized schedule, and export your roadmap to PDF right away!</p>
               </div>
               <button 
                 onClick={exportPDF} 
                 disabled={isExporting}
                 className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
               >
                 {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                 {isExporting ? 'Generating PDF...' : 'Export to PDF'}
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
               <div className="clay-card-sm p-6 border-t-2 border-[#7c3aed]">
                  <p className="text-sm font-extrabold uppercase tracking-widest text-slate-600 mb-2">Target Role Gap</p>
                  <p className="text-4xl font-black text-slate-950 mb-2">{gap_summary?.total_required || allModules.length} Skills</p>
                  <p className="text-xs text-[#7c3aed] font-semibold">Total skills missing from Job Description</p>
               </div>
               <div className="clay-card-sm p-6 border-t-2 border-emerald-600">
                  <p className="text-sm font-extrabold uppercase tracking-widest text-slate-600 mb-2">Completed</p>
                  <p className="text-4xl font-black text-emerald-700 mb-2">{completedIds.size}</p>
                  <p className="text-xs text-emerald-700 font-semibold">Skills mastered so far</p>
               </div>
               <div className="clay-card-sm p-6 border-t-2 border-sky-600">
                  <p className="text-sm font-extrabold uppercase tracking-widest text-slate-600 mb-2">Est. Completion</p>
                  <p className="text-4xl font-black text-sky-700 mb-2">{Math.ceil((allModules.reduce((acc, m) => acc + (m.estimated_hours || 0), 0) - [...completedIds].reduce((acc, id) => { const mod = allModules.find(m => m.skill === id); return acc + (mod ? (mod.estimated_hours || 0) : 0); }, 0)))} Hrs</p>
                  <p className="text-xs text-sky-700 font-semibold">Remaining time requirement</p>
               </div>
            </div>

            <div className="mb-12 space-y-8">
              <div>
                <h2 className="text-2xl font-display font-semibold text-white mb-1 flex items-center gap-2">
                  <BrainCircuit className="w-7 h-7 text-fuchsia-400" /> Skill intelligence
                </h2>
                <p className="text-slate-400 text-sm max-w-3xl">
                  Visual gap vs your target JD, how your resume lines up, roadmap completion, and AI-suggested roles you can
                  target today versus after you finish this plan.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="clay-card-sm p-6 border border-black/10 bg-white/85">
                  <h3 className="text-lg font-bold text-white mb-1">Target role: have vs need</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Matched JD skills ({gap_summary?.matched_count ?? 0} of {gap_summary?.total_required ?? '—'}) vs what is
                    still open for this role.
                  </p>
                  <div className="h-[260px] w-full">
                    {chartAlignment.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartAlignment}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={88}
                            paddingAngle={2}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartAlignment.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                            labelStyle={{ color: '#e2e8f0' }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-500 text-sm">No alignment data yet.</p>
                    )}
                  </div>
                </div>

                <div className="clay-card-sm p-6 border border-black/10 bg-white/85">
                  <h3 className="text-lg font-bold text-white mb-1">Resume skills → JD alignment</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Higher bars = stronger match to the job description; lower = extra or weaker overlap.
                  </p>
                  <div className="h-[280px] w-full">
                    {skillCoverageBars.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={skillCoverageBars} margin={{ left: 8, right: 16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fill: '#cbd5e1', fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                            formatter={(v, _n, p) => [`${v}% (${p?.payload?.match})`, 'Coverage']}
                          />
                          <Bar dataKey="Coverage" fill="#a855f7" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-500 text-sm">No resume skills to chart.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="clay-card-sm p-6 border border-black/10 bg-white/85">
                <h3 className="text-lg font-bold text-white mb-1">Roadmap skills — completion</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Each bar is a skill required for your target role; 100% when marked complete in the Learning Hub.
                </p>
                <div className="h-[min(420px,50vh)] w-full">
                  {roadmapProgressBars.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={roadmapProgressBars} margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                          formatter={(v) => [`${v}%`, 'Done']}
                        />
                        <Bar dataKey="Progress" fill="#34d399" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-500 text-sm">No roadmap modules.</p>
                  )}
                </div>
              </div>

              <div className="clay-card p-6 border border-black/10 bg-white/80">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-fuchsia-400" /> Roles you can target (AI)
                    </h3>
                    <p className="text-xs text-slate-400 max-w-2xl">
                      Suggested from your current resume skills, gaps vs this JD, and your match score — refresh after you
                      complete modules.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      roleInsightSessionRef.current = null
                      setRoleInsightRefresh((n) => n + 1)
                    }}
                    disabled={roleInsightsLoading}
                    className="text-xs px-4 py-2 rounded-xl border border-white/15 text-slate-300 hover:bg-white/5 disabled:opacity-50"
                  >
                    {roleInsightsLoading ? 'Refreshing…' : 'Refresh insights'}
                  </button>
                </div>
                {roleInsightsLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
                    <Loader2 className="w-5 h-5 animate-spin" /> Generating role suggestions…
                  </div>
                )}
                {roleInsightsError && (
                  <p className="text-sm text-red-400 border border-red-500/30 rounded-lg px-4 py-3">{roleInsightsError}</p>
                )}
                {!roleInsightsLoading && roleInsights && (
                  <div className="space-y-6 text-sm">
                    {roleInsights.one_line_summary && (
                      <p className="text-slate-200 border-l-2 border-fuchsia-500 pl-4">{roleInsights.one_line_summary}</p>
                    )}
                    {roleInsights.coverage_vs_target && (
                      <p className="text-slate-400 leading-relaxed">{roleInsights.coverage_vs_target}</p>
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/90 mb-3">
                          Realistic with your skills now
                        </p>
                        <ul className="space-y-3">
                          {(roleInsights.realistic_roles_now || []).map((r, i) => (
                            <li key={i} className="rounded-xl bg-black/30 border border-white/10 p-4">
                              <div className="flex justify-between gap-2 items-start">
                                <span className="font-semibold text-white">{r.title}</span>
                                {r.fit_score != null && (
                                  <span className="text-xs shrink-0 text-fuchsia-300">{r.fit_score}% fit</span>
                                )}
                              </div>
                              <p className="text-slate-400 text-xs mt-2 leading-relaxed">{r.rationale}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-400/90 mb-3">
                          After you close the gap
                        </p>
                        <ul className="space-y-3">
                          {(roleInsights.stretch_after_roadmap || []).map((r, i) => (
                            <li key={i} className="rounded-xl bg-black/30 border border-white/10 p-4">
                              <span className="font-semibold text-white">{r.title}</span>
                              <p className="text-slate-400 text-xs mt-2 leading-relaxed">{r.why}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {(roleInsights.skill_gap_priority || []).length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Priority gaps</p>
                        <div className="flex flex-wrap gap-2">
                          {roleInsights.skill_gap_priority.map((s, i) => (
                            <span key={i} className="text-xs px-3 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              <div className="clay-card p-8 order-2 lg:order-1 border border-black/10 bg-white/80">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                   <Lock className="w-5 h-5 text-orange-500" /> Skill Acquisition Plan
                 </h2>
                 <p className="text-slate-400 text-sm mb-6">Your ordered timeline. Complete tasks in the Learning Hub to progress down this path.</p>
                 <div className="space-y-6">
                   {allModules.map((m, idx) => (
                     <div key={m.skill} className="flex gap-4">
                       <div className="relative flex flex-col items-center">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${completedIds.has(m.skill) ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : idx === defaultCurrentIndex ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-slate-800 border-slate-700'}`}>
                           {completedIds.has(m.skill) ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-slate-500" />}
                         </div>
                         {idx < allModules.length - 1 && <div className={`w-0.5 h-full my-2 bg-gradient-to-b ${completedIds.has(m.skill) ? 'from-emerald-500 to-purple-500/30' : 'from-slate-800 to-slate-800'}`} />}
                       </div>
                       <div className={`pb-8 ${idx === defaultCurrentIndex ? 'opacity-100' : 'opacity-60'}`}>
                         <h3 className="text-lg font-bold text-white mb-1 leading-tight">{m.skill} <span className="text-xs font-normal text-slate-500 ml-2 bg-white/5 px-2 py-1 rounded">({m.estimated_hours}h)</span></h3>
                         <p className="text-sm text-slate-400">{m.reasoning?.why_needed}</p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="flex flex-col gap-8 order-1 lg:order-2">
                <div className="clay-card p-8 border border-black/10 bg-white/80">
                   <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                     <Trophy className="w-5 h-5 text-yellow-500" /> Daily Routine Goals
                   </h2>
                   <p className="text-sm text-slate-300 mb-6">Set aside 2 hours every day to conquer your roadmap. Here is your recommended schedule:</p>
                   
                   <div className="flex justify-between items-center text-center">
                     {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                       <div key={day} className="flex flex-col items-center gap-3">
                         <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold relative group ${i === new Date().getDay() - 1 ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-slate-700 bg-white/5 text-slate-500'}`}>
                           2h
                           {i === new Date().getDay() - 1 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
                         </div>
                         <span className={`text-xs uppercase tracking-widest ${i === new Date().getDay() - 1 ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>{day}</span>
                       </div>
                     ))}
                     <div className="flex flex-col items-center gap-3 opacity-40">
                       <div className="w-12 h-12 rounded-full border-2 border-slate-700 bg-black text-slate-500 flex items-center justify-center font-bold">R</div>
                       <span className="text-xs text-slate-500 uppercase tracking-widest">Wkd</span>
                     </div>
                   </div>
                </div>

                <div className="clay-card-sm p-6 border-l-4 border-l-sky-600 bg-white/80 mt-auto">
                    <h3 className="text-base font-extrabold text-slate-950 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-sky-600" /> Career Alignment</h3>
                    <p className="text-sm text-slate-700 mb-2">This curriculum was exclusively built referencing your exact PDF constraints against the Target Job Description via Gemini & TensorFlow.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI MENTOR / NOTEBOOK LM DRAWER */}
      {isMentorOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsMentorOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-[450px] max-w-full bg-[#0a0514] border-r border-white/10 p-6 shadow-2xl z-50 flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-medium text-white">Notebook AI</h2>
                  <p className="text-xs text-purple-400">Your custom learning memory</p>
                </div>
              </div>
              <button onClick={() => setIsMentorOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar space-y-6 pr-2">
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/5 text-sm text-slate-300 shadow-lg">
                Hi! I'm your AI Mentor. Paste any URL or text here to generate study notes, or ask me a question about your learning roadmap!
              </div>
              
              {mentorChat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 max-w-[85%] text-sm rounded-2xl shadow-lg whitespace-pre-wrap flex flex-col ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-sm'}`}>
                    <span>{msg.text}</span>
                    {msg.noteCard && (
                      <div className="mt-4 bg-[#06020c]/80 border border-purple-500/30 rounded-xl p-4 shadow-inner">
                        <div className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                          {msg.noteCard.title}
                        </div>
                        <ul className="space-y-2 mb-4">
                          {msg.noteCard.points.map((pt, i) => (
                            <li key={i} className="flex gap-2 text-slate-300 leading-relaxed text-[13px]">
                              <span className="text-purple-500 mt-0.5">•</span> {pt}
                            </li>
                          ))}
                        </ul>
                        {msg.isScraped && !msg.isSaved && (
                          <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                            <button 
                              onClick={() => handleSaveNote(msg, idx)}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg"
                            >
                              <BookOpen className="w-4 h-4" />
                              Add to Notes
                            </button>
                            <button 
                              onClick={() => handleCancelNote(idx)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isMentorTyping && (
                <div className="flex justify-start">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <div className="relative mt-2">
              <input 
                type="text" 
                placeholder="Paste URL, text, or ask..." 
                className="w-full bg-[#150a26] border border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                onKeyDown={handleMentorSubmit}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors pointer-events-none">
                 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#0f0a1c] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" /> Account Settings
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl uppercase">
                  {userName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-white">{user?.fullName || 'Demo Student'}</h4>
                  <p className="text-sm text-slate-400">{user?.primaryEmailAddress?.emailAddress || 'student@skillforge.ai'}</p>
                </div>
                <div className="ml-auto">
                  <UserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 block">Preferences</h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-white/10">
                    <span className="text-slate-200">Dark Mode</span>
                    <input type="checkbox" defaultChecked className="accent-purple-500 w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-white/10">
                    <span className="text-slate-200">Email Notifications</span>
                    <input type="checkbox" defaultChecked className="accent-purple-500 w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-white/10">
                    <span className="text-slate-200">Auto-play Learning Hub Videos</span>
                    <input type="checkbox" defaultChecked className="accent-purple-500 w-4 h-4" />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 block">Danger Zone</h4>
                <button 
                  onClick={handleLogout}
                  className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out / Exit Demo
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-purple-900/50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for slide-in animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .text-shadow {
          text-shadow: 0 0 20px rgba(168,85,247,0.5);
        }
      `}} />
    </div>
  )
}
