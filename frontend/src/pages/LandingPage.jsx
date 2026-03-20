import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Brain, Target, Route, ChevronDown, CheckCircle2, Zap, Layers } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

const features = [
  {
    icon: <Brain className="w-8 h-8 text-purple-400" />,
    title: "AI Gap Analysis",
    desc: "Gemini 2.5 Flash cross-references your resume with target jobs to extract precise missing skills.",
  },
  {
    icon: <Target className="w-8 h-8 text-blue-400" />,
    title: "Curated Roadmaps",
    desc: "Instantly generates a step-by-step curriculum prioritizing high-impact modules.",
  },
  {
    icon: <Route className="w-8 h-8 text-emerald-400" />,
    title: "Visual Skill Trees",
    desc: "Track your progress on a beautiful topological graph that physically maps your journey.",
  },
  {
    icon: <Zap className="w-8 h-8 text-amber-400" />,
    title: "Embedded YouTube Hub",
    desc: "Watch top-tier tutorials inside our immersive LMS. No context switching necessary.",
  },
  {
    icon: <Layers className="w-8 h-8 text-pink-400" />,
    title: "6-Page AI Syllabus",
    desc: "Generate and export a polished PDF roadmap featuring weekly schedules and external resources.",
  },
  {
    icon: <CheckCircle2 className="w-8 h-8 text-green-400" />,
    title: "Gamified Progress",
    desc: "Earn satisfying visual feedback and confetti as you conquer missing skills one by one.",
  }
]

const faqs = [
  {
    q: "How does the AI analyze my resume?",
    a: "We pipeline your PDF through a FastAPI backend where TensorFlow embeddings and the Gemini 2.5 Flash API perform semantic math to isolate exactly what constraints your resume is lacking based on the Job Description."
  },
  {
    q: "Is it really free?",
    a: "Yes! SkillForge is built as an open-source adaptive onboarding engine, designed specifically to help juniors and pros upskill without paying thousands for generic bootcamps."
  },
  {
    q: "Where do the video courses come from?",
    a: "Our AI curates highly-rated, relevant content directly from YouTube's top educational channels (such as CodeWithHarry, FreeCodeCamp, etc.) so you get world-class instruction inside our platform."
  },
  {
    q: "Can I export my learning path?",
    a: "Absolutely. Our platform features a native jsPDF engine that constructs a professional 6-page personalized syllabus document for offline studying and tracking."
  }
]

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border border-slate-800 rounded-2xl bg-white/5 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-slate-200">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ${isOpen ? 'py-4 opacity-100 max-h-40' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-slate-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#06020c]">
      {/* Magic UI Background Blobs */}
      <div className="magic-blob top-[-10%] left-[-10%]" />
      <div className="magic-blob bottom-[-10%] right-[-10%]" style={{ animationDelay: '-4s' }} />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-4 bg-[#06020c]/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span className="text-xl font-display font-bold text-white">SkillForge AI</span>
        </div>
        
        {/* Navigation Pills */}
        <div className="hidden md:flex items-center gap-8 px-8 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
          <span onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer transition-colors">Features</span>
          <span onClick={() => scrollToSection('how-it-works')} className="hover:text-white cursor-pointer transition-colors">How it Works</span>
          <span onClick={() => scrollToSection('faq')} className="hover:text-white cursor-pointer transition-colors">FAQ</span>
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
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-40 pb-20">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          {/* Shimmer Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 text-purple-300 text-xs font-medium mb-8 shimmer bg-purple-500/10">
            <Sparkles className="w-3.5 h-3.5" />
            Personalized by AI. Mastered by You.
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-display font-medium text-white mb-6 leading-[1.1] tracking-tight">
            The smartest way<br />
            <span className="text-slate-400">to learn anything.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop drowning in generic courses. SkillForge AI builds a custom 
            curriculum specifically tailored to your skill gaps — then adapts as you grow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary text-base px-8 py-3.5 shadow-[0_0_30px_rgba(217,70,239,0.4)] w-full sm:w-auto text-lg"
            >
              Start Learning Free →
            </button>
          </div>
        </div>

        {/* Topics Marquee */}
        <div className="mt-24 border-t border-slate-800/50 pt-10">
          <p className="text-center text-xs font-bold text-slate-500 tracking-[0.2em] mb-8 uppercase">Topics You Can Master</p>
          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {['Web3', 'Solidity', 'Machine Learning', 'React', 'UI Design', 'DevOps', 'Python', 'Cloud', 'Cybersecurity', 'Data Science', 'Swift', 'Rust'].map(t => (
              <div key={t} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-slate-300 text-sm hover:bg-white/10 cursor-pointer transition-colors shadow-lg">
                {t}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Enterprise-grade capabilities</h2>
            <p className="text-slate-400">Everything you need to upskill precisely for your target role.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <div key={idx} className="bg-[#0f0a1c] border border-white/5 p-8 rounded-3xl hover:border-purple-500/30 transition-all hover:-translate-y-1 shadow-xl group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-[20%] left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0" />
            <div className="relative z-10 bg-[#06020c]">
              <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-[0_0_20px_rgba(147,51,234,0.5)]">1</div>
              <h3 className="text-xl font-bold text-white mb-3">Upload Resume</h3>
              <p className="text-slate-400 text-sm">Drag and drop your PDF resume and paste the exact Job Description you want.</p>
            </div>
            <div className="relative z-10 bg-[#06020c]">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-[0_0_20px_rgba(37,99,235,0.5)]">2</div>
              <h3 className="text-xl font-bold text-white mb-3">AI Engine Analyzes</h3>
              <p className="text-slate-400 text-sm">Our Gemini ML backend calculates your topological skill gaps.</p>
            </div>
            <div className="relative z-10 bg-[#06020c]">
              <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.5)]">3</div>
              <h3 className="text-xl font-bold text-white mb-3">Learn Intelligently</h3>
              <p className="text-slate-400 text-sm">Follow your generated visual roadmap and watch embedded video tutorials to land the job.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-24 bg-black/40 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-12 bg-black border-t border-slate-800">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span className="font-bold text-white tracking-widest uppercase">SkillForge</span>
        </div>
        <p className="text-sm text-slate-500">AI-Adaptive Onboarding Engine | Powered by Gemini & Clerk</p>
      </footer>
    </div>
  )
}
