import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Download, Play, CheckCircle2, Lock, Flame, Trophy, LayoutDashboard, BrainCircuit, Target, Settings, HelpCircle, ChevronRight, X, BookOpen, Clock, PlayCircle } from 'lucide-react'
import { ReactFlow, Background, Controls } from '@xyflow/react'
import { UserButton } from '@clerk/clerk-react'
import '@xyflow/react/dist/style.css'
import confetti from 'canvas-confetti'

/* ─── Gamified Node Component ──────────────────────── */
function CandyNode({ data }) {
  const { isCompleted, isCurrent, isLocked } = data;
  
  let styles = "bg-slate-800 border-slate-700 text-slate-500 opacity-60"; // locked
  let Icon = Lock;

  if (isCompleted) {
    styles = "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]";
    Icon = CheckCircle2;
  } else if (isCurrent) {
    styles = "bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse hover:scale-110";
    Icon = Play;
  }

  return (
    <div 
      className={`rounded-full flex items-center justify-center w-16 h-16 border-4 cursor-pointer transition-all duration-300 ${styles}`}
      onClick={() => {
        if (!isLocked) data.onNodeClick?.(data)
      }}
    >
      <Icon className="w-8 h-8" strokeWidth={isCurrent ? 3 : 2} />
      <div className="absolute top-16 w-36 text-center mt-2 pointer-events-none">
        <p className="text-xs font-bold text-slate-300 drop-shadow-md leading-tight">{data.label || data.skill}</p>
      </div>
    </div>
  )
}
const nodeTypes = { candyNode: CandyNode }

export default function ResultsDashboard() {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [completedIds, setCompletedIds] = useState(new Set())

  useEffect(() => {
    const stored = sessionStorage.getItem('skillforge_result')
    if (!stored) { navigate('/upload'); return }
    setResult(JSON.parse(stored))
  }, [navigate])

  const handleNodeClick = useCallback((moduleData) => {
    const allModules = result?.roadmap?.phases?.flatMap(p => p.modules) || []
    const mod = allModules.find(m => m.skill === moduleData.label)
    setSelectedModule(mod || moduleData)
  }, [result])

  const handleMarkComplete = (moduleId) => {
    setCompletedIds(prev => {
      const next = new Set(prev)
      next.add(moduleId)
      const allModules = result?.roadmap?.phases?.flatMap(p => p.modules) || []
      
      // Giant Celebration
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
      
      if (next.size === allModules.length) {
        setTimeout(() => confetti({ particleCount: 300, spread: 160, origin: { y: 0.5 } }), 500)
      }
      setSelectedModule(null) // Close drawer
      return next
    })
  }

  if (!result) return null

  const { gap_summary, roadmap } = result
  const allModules = roadmap?.phases?.flatMap(p => p.modules) || []
  
  // Winding Path Algorithm (S-Curve)
  const ROW_HEIGHT = 120;
  const COL_WIDTH = 150;
  const NODES_PER_ROW = 4;
  
  const candyNodes = allModules.map((m, index) => {
    const row = Math.floor(index / NODES_PER_ROW);
    const col = index % NODES_PER_ROW;
    const xIndex = row % 2 === 0 ? col : (NODES_PER_ROW - 1 - col);
    const yOffset = (xIndex === 1 || xIndex === 2) ? 30 : 0; // slight wave
    
    const firstUncompletedIndex = allModules.findIndex(mod => !completedIds.has(mod.id));
    const currentIndex = firstUncompletedIndex === -1 ? allModules.length : firstUncompletedIndex;

    return {
      id: `node-${m.id}`,
      type: 'candyNode',
      position: { x: xIndex * COL_WIDTH + 80, y: row * ROW_HEIGHT + yOffset + 50 },
      data: { 
        ...m, 
        isCompleted: completedIds.has(m.id),
        isCurrent: index === currentIndex,
        isLocked: index > currentIndex,
        onNodeClick: handleNodeClick 
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

  const firstUncompletedIndex = allModules.findIndex(mod => !completedIds.has(mod.id));
  const currentModule = firstUncompletedIndex !== -1 ? allModules[firstUncompletedIndex] : null;

  return (
    <div className="flex h-screen bg-[#06020c] text-slate-300 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR (Knovify Style) */}
      <aside className="w-64 border-r border-slate-800/50 flex flex-col bg-[#0a0514]/80 p-6 shadow-2xl relative z-20">
        <div className="flex items-center gap-3 mb-12 cursor-pointer" onClick={() => navigate('/')}>
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span className="text-xl font-display font-bold text-white tracking-tight">SkillForge AI</span>
        </div>

        <p className="text-xs font-bold text-slate-500 mb-4 tracking-widest uppercase">Learn</p>
        <nav className="space-y-2 mb-10 text-sm font-medium">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white cursor-pointer border border-white/5">
            <LayoutDashboard className="w-4 h-4 text-purple-400" /> Dashboard
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-slate-400 hover:text-white">
            <BrainCircuit className="w-4 h-4" /> AI Mentor
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-slate-400 hover:text-white">
            <Target className="w-4 h-4" /> My Progress
          </div>
        </nav>

        <p className="text-xs font-bold text-slate-500 mb-4 tracking-widest uppercase">Support</p>
        <nav className="space-y-2 text-sm font-medium">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-slate-400 hover:text-white">
            <HelpCircle className="w-4 h-4" /> Help Center
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-slate-400 hover:text-white">
            <Settings className="w-4 h-4" /> Settings
          </div>
        </nav>

        <div className="mt-auto flex items-center justify-between border-t border-slate-800/50 pt-6">
           <UserButton afterSignOutUrl="/" />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute inset-0 magic-blob top-0 right-0 opacity-40 mix-blend-screen pointer-events-none" />
        
        <div className="p-10 flex-shrink-0 relative z-10 hidden md:block">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Good Morning, Learner! 👋</h1>
          <p className="text-slate-400">Ready to conquer your next skill today?</p>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 relative z-10 custom-scrollbar">
          <div className="grid grid-cols-10 gap-8">
            
            {/* CENTER DASHBOARD / ROADMAP */}
            <div className="col-span-7 flex flex-col gap-8">
              
              {/* Continue Learning Card */}
              <div className="p-1 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-2xl shadow-xl">
                <div className="bg-[#10081c] rounded-xl p-8 h-full flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Continue Learning</h2>
                    <h3 className="text-2xl font-bold text-white mb-2">{currentModule ? currentModule.skill : "All Skills Completed! 🎉"}</h3>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                       <Clock className="w-4 h-4 text-purple-400" /> 
                       {currentModule ? `Est. ${currentModule.estimated_hours} hours remaining` : "You are job ready."}
                    </p>
                  </div>
                  {currentModule && (
                    <button 
                      onClick={() => handleNodeClick(currentModule)}
                      className="btn-primary flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    >
                      Resume <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Candy Crush Winding Roadmap */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Your Skill Path</h2>
                  <span className="text-sm px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 font-medium">
                    {completedIds.size} / {allModules.length} Completed
                  </span>
                </div>
                <div className="h-[550px] bg-black/20 rounded-2xl border border-white/5 shadow-inner overflow-hidden relative">
                  <ReactFlow
                    nodes={candyNodes}
                    edges={candyEdges}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.2}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Controls />
                  </ReactFlow>
                </div>
              </div>

            </div>

            {/* RIGHT STATS PANEL (Knovify Style) */}
            <div className="col-span-3 flex flex-col gap-6">
              
              <div className="glass-card p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                  L
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Learner AI</h3>
                  <p className="text-sm text-slate-400">Target: {gap_summary?.total_required || 0} Skills</p>
                </div>
              </div>

              <div className="glass-card p-6 bg-gradient-to-b from-[#150a26] to-[#0a0514]">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" /> Your Progress
                  </h3>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded text-slate-300">Global Rank: #5</span>
                </div>
                <div className="flex justify-between items-center text-center">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">STREAK</p>
                    <p className="text-xl font-bold text-white flex justify-center items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" /> 3
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">EXP PTS</p>
                    <p className="text-xl font-bold text-purple-400 text-shadow">{completedIds.size * 50}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-orange-500" /> Weekly Streak
                </h3>
                <div className="flex justify-between">
                  {['M','T','W','T','F','S','S'].map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i < 3 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-slate-600'}`}>
                        {i < 3 ? <Flame className="w-4 h-4" /> : <span className="text-xs">{day}</span>}
                      </div>
                      <span className="text-[10px] text-slate-500">{day}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* DRAWER FOR SELECTED MODULE (Gamified Learning Hub) */}
      {selectedModule && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedModule(null)} />
          <div className="fixed right-0 top-0 h-full w-[500px] max-w-full bg-[#0a0514] border-l border-white/10 p-8 shadow-2xl z-50 overflow-y-auto animate-slide-in flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold text-purple-400 tracking-widest uppercase bg-purple-500/10 px-3 py-1 rounded-full">Module Details</span>
              <button onClick={() => setSelectedModule(null)} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h2 className="text-3xl font-display font-medium text-white mb-2">{selectedModule.skill || selectedModule.label}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-400 mb-8 border-b border-white/5 pb-6">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedModule.estimated_hours}h</span>
              <span className="flex items-center gap-1 text-blue-400"><BookOpen className="w-4 h-4" /> {selectedModule.difficulty}</span>
            </div>

            {selectedModule.course && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                   <PlayCircle className="w-4 h-4 text-red-500" /> Watch Tutorial
                </h3>
                {selectedModule.course.url.includes("youtube.com") ? (
                  <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 aspect-video mb-3 bg-black">
                    <iframe 
                      className="w-full h-full"
                      src={selectedModule.course.url.replace("watch?v=", "embed/")} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a href={selectedModule.course.url} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                    <p className="font-bold text-white text-base mb-1">{selectedModule.course.title}</p>
                    <p className="text-xs text-blue-400 flex items-center gap-1">Open Course on {selectedModule.course.platform} <ChevronRight className="w-3 h-3" /></p>
                  </a>
                )}
              </div>
            )}

            <div className="space-y-6 mb-10 flex-1">
              {selectedModule.reasoning && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Why You Need This</h3>
                  <p className="text-slate-300 leading-relaxed text-sm bg-white/5 p-4 rounded-xl border border-white/5">{selectedModule.reasoning.why_needed}</p>
                </div>
              )}
            </div>

            {!completedIds.has(selectedModule.id) ? (
              <div className="mt-auto pt-6 border-t border-white/10">
                <button
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                  onClick={() => handleMarkComplete(selectedModule.id)}
                >
                  <CheckCircle2 className="w-6 h-6" /> Mark Complete
                </button>
              </div>
            ) : (
              <div className="mt-auto pt-6 border-t border-white/10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                  <CheckCircle2 className="w-5 h-5" /> Completed
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Embedded CSS for slide-in animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
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
