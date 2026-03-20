import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Brain, Target, Route } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

const personas = [
  {
    from: "Junior Developer",
    to: "Senior ML Engineer",
    domain: "tech",
    icon: "💻",
    skills: ["Python", "TensorFlow", "MLOps"],
    color: "from-blue-500 to-purple-500",
  },
  {
    from: "Fresher",
    to: "Operations Manager",
    domain: "operational",
    icon: "🏭",  
    skills: ["Supply Chain", "Team Leadership", "Six Sigma"],
    color: "from-emerald-500 to-teal-500",
  },
]

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Analysis",
    desc: "Gemini 2.5 Flash extracts skills with confidence scores",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Zero Hallucinations",
    desc: "Every course grounded in verified catalog — no made-up recommendations",
  },
  {
    icon: <Route className="w-6 h-6" />,
    title: "Adaptive Pathways",
    desc: "Smart graph-based learning order with prerequisite tracking",
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#06020c]">
      {/* Magic UI Background Blobs */}
      <div className="magic-blob top-[-10%] left-[-10%]" />
      <div className="magic-blob bottom-[-10%] right-[-10%]" style={{ animationDelay: '-4s' }} />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span className="text-xl font-display font-bold text-white">SkillForge AI</span>
        </div>
        
        {/* Knovify style pill nav (mock) */}
        <div className="hidden md:flex items-center gap-8 px-8 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm text-slate-300">
          <span className="hover:text-white cursor-pointer transition-colors">Features</span>
          <span className="hover:text-white cursor-pointer transition-colors">How it Works</span>
          <span className="hover:text-white cursor-pointer transition-colors">FAQ</span>
        </div>

        <div className="flex items-center gap-6">
          <SignedOut>
            <SignInButton mode="modal">
              <span className="text-sm text-slate-300 hover:text-white cursor-pointer transition-colors font-medium">Log in</span>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/upload">
              <button className="btn-primary py-2 px-6 rounded-full text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary py-2 px-6 rounded-full text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] mr-2"
            >
              Go to Dashboard
            </button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          {/* Shimmer Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 text-purple-300 text-xs font-medium mb-8 shimmer">
            <Sparkles className="w-3.5 h-3.5" />
            Personalized by AI. Mastered by You.
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-display font-medium text-white mb-6 leading-[1.1] tracking-tight">
            The smartest way<br />
            <span className="text-slate-400">to learn anything.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop drowning in generic courses. SkillForge AI builds a custom 
            curriculum tailored to your skill level and goal — then adapts as you grow.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              id="cta-start"
              onClick={() => navigate('/upload')}
              className="btn-primary text-base px-8 py-3.5 shadow-[0_0_30px_rgba(217,70,239,0.4)]"
            >
              Start Learning Free →
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="btn-secondary text-base px-8 py-3.5 rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              ▶ Watch Demo
            </button>
          </div>
        </div>

        {/* Topics Marquee (Mock) */}
        <div className="mt-32 border-t border-slate-800/50 pt-10">
          <p className="text-center text-xs font-bold text-slate-500 tracking-[0.2em] mb-8 uppercase">Topics You Can Master</p>
          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {['Web3', 'Solidity', 'Machine Learning', 'React', 'UI Design', 'DevOps', 'Python', 'Cloud', 'Cybersecurity', 'Data Science', 'Swift', 'Rust'].map(t => (
              <div key={t} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-slate-300 text-sm hover:bg-white/10 cursor-pointer transition-colors">
                {t}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-slate-500 border-t border-slate-800">
        <p>SkillForge — AI-Adaptive Onboarding Engine | Powered by Gemini & O*NET</p>
      </footer>
    </div>
  )
}
