import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Brain, Target, Route, ChevronDown, CheckCircle2, Zap, Layers, Orbit } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

const highlights = [
  { icon: <Brain className="w-6 h-6 text-[#6d28d9]" />, title: 'AI Skill Gap', desc: 'Resume + JD → instant gaps, explained.' },
  { icon: <Route className="w-6 h-6 text-[#0ea5e9]" />, title: 'Playful Roadmap', desc: 'A visual path you can actually finish.' },
  { icon: <Zap className="w-6 h-6 text-[#f59e0b]" />, title: 'Learning Hub', desc: 'Videos, notes, quizzes—no tab chaos.' },
  { icon: <Orbit className="w-6 h-6 text-[#ec4899]" />, title: 'Skill Sphere', desc: 'Persona, coach, roles, portfolio & more.' },
]

const courses = [
  { title: 'Web Development Bootcamp', author: 'Sarah Chen', lessons: 48, hours: 24, rating: 4.9, color: 'from-[#ffd3c5] to-[#ffe7e0]', icon: '⌘' },
  { title: 'UI/UX Design Mastery', author: 'Mike Johnson', lessons: 36, hours: 18, rating: 4.8, color: 'from-[#d7f0ff] to-[#eaf7ff]', icon: '✦' },
  { title: 'Data Science with Python', author: 'Emily Davis', lessons: 52, hours: 30, rating: 4.9, color: 'from-[#e8ddff] to-[#f2ebff]', icon: '▣' },
  { title: 'Mobile App Development', author: 'Alex Kim', lessons: 42, hours: 22, rating: 4.7, color: 'from-[#d9ffe5] to-[#effff4]', icon: '◉' },
]

const testimonials = [
  {
    name: 'Aarav',
    role: 'Backend Intern → SDE',
    quote: 'The roadmap felt like a game. I finally knew exactly what to learn next.',
  },
  {
    name: 'Meera',
    role: 'Career switcher',
    quote: 'Skill Sphere gave me a persona + role targets. My applications got way sharper.',
  },
  {
    name: 'Kabir',
    role: 'Final-year student',
    quote: 'Gap map + quizzes made my prep structured. No more random YouTube rabbit holes.',
  },
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
    <div className="rounded-2xl bg-white/70 border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300 backdrop-blur">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-black/5 transition-colors"
      >
        <span className="font-semibold text-slate-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ${isOpen ? 'py-4 opacity-100 max-h-40' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-slate-700 leading-relaxed">{answer}</p>
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
    <div className="min-h-screen relative overflow-hidden bg-[#f7fbf2] text-slate-900">
      {/* Playful background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#86efac] to-[#60a5fa] blur-3xl opacity-35" />
        <div className="absolute top-40 -right-20 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#fda4af] to-[#a78bfa] blur-3xl opacity-30" />
        <div className="absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#fde68a] to-[#34d399] blur-3xl opacity-25" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-[#f7fbf2]/80 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
          <div className="w-10 h-10 rounded-2xl bg-white shadow-[0_14px_0_rgba(0,0,0,0.10)] border border-black/5 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#16a34a]" />
          </div>
          <span className="text-lg md:text-xl font-display font-extrabold text-slate-900">SkillForge</span>
        </div>
        
        {/* Navigation Pills */}
        <div className="hidden md:flex items-center gap-6 px-7 py-2.5 rounded-full bg-white/70 border border-black/5 shadow-[0_14px_0_rgba(0,0,0,0.08)] text-sm text-slate-700">
          <span onClick={() => scrollToSection('features')} className="hover:text-slate-950 cursor-pointer transition-colors font-semibold">Features</span>
          <span onClick={() => scrollToSection('catalog')} className="hover:text-slate-950 cursor-pointer transition-colors font-semibold">Catalog</span>
          <span onClick={() => scrollToSection('how-it-works')} className="hover:text-slate-950 cursor-pointer transition-colors font-semibold">How it Works</span>
          <span onClick={() => navigate('/skill-sphere')} className="hover:text-[#7c3aed] cursor-pointer transition-colors inline-flex items-center gap-1 font-semibold">
            <Orbit className="w-3.5 h-3.5" /> Skill Sphere
          </span>
          <span onClick={() => scrollToSection('faq')} className="hover:text-slate-950 cursor-pointer transition-colors font-semibold">FAQ</span>
        </div>

        <div className="flex items-center gap-6">
          <SignedOut>
            <SignInButton mode="modal">
              <span className="text-sm text-slate-700 hover:text-slate-950 cursor-pointer transition-colors font-semibold">Log in</span>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/upload">
              <button className="px-5 py-2.5 rounded-full text-sm font-extrabold bg-[#22c55e] text-slate-950 border border-black/10 shadow-[0_16px_0_rgba(0,0,0,0.12)] hover:translate-y-[1px] hover:shadow-[0_12px_0_rgba(0,0,0,0.12)] transition-all">
                Start Free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/upload')}
              className="px-5 py-2.5 rounded-full text-sm font-extrabold bg-[#22c55e] text-slate-950 border border-black/10 shadow-[0_16px_0_rgba(0,0,0,0.12)] hover:translate-y-[1px] hover:shadow-[0_12px_0_rgba(0,0,0,0.12)] transition-all mr-2"
            >
              Go to Dashboard
            </button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-black/5 shadow-[0_14px_0_rgba(0,0,0,0.08)] text-xs font-extrabold text-slate-800 mb-7">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              New: AI-powered learning paths
            </div>

            <h1 className="text-[44px] md:text-[64px] font-display font-black leading-[1.05] tracking-tight text-slate-950">
              Learn anything,
              <span className="text-[#22c55e]"> anytime</span>,
              <span className="text-[#0ea5e9]"> anywhere</span>.
            </h1>
            <p className="text-base md:text-lg text-slate-700 mt-5 max-w-xl leading-relaxed">
              Upload your resume + target job description. SkillForge builds a playful roadmap, shows exactly what you
              lack, and guides you with videos, quizzes, notes, and Skill Sphere career intelligence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-3 rounded-2xl bg-[#22c55e] text-slate-950 font-extrabold border border-black/10 shadow-[0_18px_0_rgba(0,0,0,0.12)] hover:translate-y-[1px] hover:shadow-[0_14px_0_rgba(0,0,0,0.12)] transition-all"
              >
                Start Learning Free →
              </button>
              <button
                onClick={() => scrollToSection('catalog')}
                className="px-6 py-3 rounded-2xl bg-white/80 text-slate-900 font-extrabold border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.10)] hover:bg-white transition-all"
              >
                Browse Courses
              </button>
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl">
              {highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl bg-white/75 border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.08)] p-4"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 shadow-[0_12px_0_rgba(0,0,0,0.10)] flex items-center justify-center mb-3">
                    {h.icon}
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">{h.title}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: progress demo + catalog preview */}
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-[28px] bg-white/70 border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.08)] rotate-[-6deg]" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-[28px] bg-white/70 border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.08)] rotate-[7deg]" />

            <div className="rounded-[34px] bg-white/80 border border-black/5 shadow-[0_22px_0_rgba(0,0,0,0.10)] p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#dbeafe] to-[#fdf2f8] border border-black/5 shadow-[0_14px_0_rgba(0,0,0,0.10)] flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#0ea5e9]" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">Web Development</p>
                    <p className="text-xs text-slate-600">12 lessons • 4h 30m</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600">Progress</p>
                  <p className="text-sm font-extrabold text-[#16a34a]">65%</p>
                </div>
              </div>
              <div className="mt-4 h-3 rounded-full bg-slate-200 overflow-hidden border border-black/5">
                <div className="h-full w-[65%] bg-[#22c55e] rounded-full" />
              </div>

              <button
                onClick={() => navigate('/upload')}
                className="mt-5 w-full px-5 py-3 rounded-2xl bg-[#22c55e] text-slate-950 font-extrabold border border-black/10 shadow-[0_18px_0_rgba(0,0,0,0.12)] hover:translate-y-[1px] hover:shadow-[0_14px_0_rgba(0,0,0,0.12)] transition-all"
              >
                Continue Learning
              </button>
            </div>

            <div id="catalog" className="mt-8 grid sm:grid-cols-2 gap-4">
              {courses.slice(0, 2).map((c) => (
                <div
                  key={c.title}
                  className="rounded-[30px] bg-white/80 border border-black/5 shadow-[0_20px_0_rgba(0,0,0,0.10)] p-5 backdrop-blur"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} border border-black/5 shadow-[0_14px_0_rgba(0,0,0,0.10)] flex items-center justify-center font-extrabold text-slate-900`}>
                    {c.icon}
                  </div>
                  <p className="mt-3 text-sm font-extrabold text-slate-950">{c.title}</p>
                  <p className="text-xs text-slate-600">by {c.author}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-700 font-semibold">
                    <span>{c.lessons} lessons</span>
                    <span>{c.hours}h</span>
                    <span className="px-2 py-1 rounded-full bg-white border border-black/5 shadow-[0_10px_0_rgba(0,0,0,0.08)]">★ {c.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-700 font-extrabold">
          {['React', 'Python', 'DevOps', 'Cloud', 'UI Design', 'Data Science', 'System Design', 'Kubernetes'].map((t) => (
            <span
              key={t}
              className="px-4 py-2 rounded-full bg-white/70 border border-black/5 shadow-[0_14px_0_rgba(0,0,0,0.08)]"
            >
              {t}
            </span>
          ))}
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-black text-slate-950 mb-3">Everything you need to learn fast</h2>
            <p className="text-slate-700 max-w-2xl mx-auto">
              Clay-smooth UI on the outside. Serious career-grade intelligence on the inside.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {highlights.map((h, idx) => (
              <div
                key={idx}
                className="rounded-[34px] bg-white/80 border border-black/5 shadow-[0_22px_0_rgba(0,0,0,0.10)] p-6 backdrop-blur"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 shadow-[0_14px_0_rgba(0,0,0,0.10)] flex items-center justify-center mb-4">
                  {h.icon}
                </div>
                <h3 className="text-lg font-extrabold text-slate-950">{h.title}</h3>
                <p className="text-sm text-slate-700 leading-relaxed mt-2">{h.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[36px] bg-white/75 border border-black/5 shadow-[0_24px_0_rgba(0,0,0,0.10)] p-8 backdrop-blur">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-display font-black text-slate-950">Course catalog preview</h3>
                <p className="text-slate-700 mt-2 max-w-2xl">
                  SkillForge can ground your roadmap with curated learning resources. Here’s a playful preview layout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/upload')}
                className="px-6 py-3 rounded-2xl bg-white text-slate-950 font-extrabold border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.10)] hover:bg-white/90 transition-all"
              >
                View your roadmap →
              </button>
            </div>
            <div className="mt-7 grid md:grid-cols-2 gap-4">
              {courses.map((c) => (
                <div
                  key={c.title}
                  className="rounded-[30px] bg-white/80 border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.10)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} border border-black/5 shadow-[0_14px_0_rgba(0,0,0,0.10)] flex items-center justify-center font-extrabold text-slate-900`}>
                        {c.icon}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-950">{c.title}</p>
                        <p className="text-xs text-slate-600">by {c.author}</p>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-white border border-black/5 shadow-[0_10px_0_rgba(0,0,0,0.08)] font-extrabold text-slate-800">
                      ★ {c.rating}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-700 font-semibold">
                    <span className="px-3 py-1 rounded-full bg-white/70 border border-black/5">📚 {c.lessons} lessons</span>
                    <span className="px-3 py-1 rounded-full bg-white/70 border border-black/5">⏱ {c.hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-black text-slate-950 mb-3">How it works</h2>
            <p className="text-slate-700">Three simple steps. Zero confusion.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '1', title: 'Upload', desc: 'Drop your resume PDF and paste a target job description.' },
              { n: '2', title: 'Analyze', desc: 'Gemini extracts skills and maps what you’re missing for that role.' },
              { n: '3', title: 'Level Up', desc: 'Follow the roadmap, track progress, and get role targets + portfolio.' },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-[34px] bg-white/80 border border-black/5 shadow-[0_22px_0_rgba(0,0,0,0.10)] p-7"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 shadow-[0_14px_0_rgba(0,0,0,0.10)] flex items-center justify-center font-black text-slate-950">
                  {s.n}
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-950">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[36px] bg-white/75 border border-black/5 shadow-[0_24px_0_rgba(0,0,0,0.10)] p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-display font-black text-slate-950">Student testimonials</h3>
                <p className="text-slate-700 mt-2">Real vibes from real progress.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/skill-sphere')}
                className="px-6 py-3 rounded-2xl bg-white text-slate-950 font-extrabold border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.10)] hover:bg-white/90 transition-all"
              >
                Explore Skill Sphere →
              </button>
            </div>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="rounded-[30px] bg-white/85 border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.10)] p-6"
                >
                  <p className="text-sm text-slate-800 leading-relaxed">“{t.quote}”</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-slate-950">{t.name}</p>
                      <p className="text-xs text-slate-600">{t.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 shadow-[0_14px_0_rgba(0,0,0,0.10)] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#22c55e]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-20">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black text-slate-950 mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-700">Quick answers for quick decisions.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Enrollment CTA */}
      <section className="relative z-10 pb-20">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="rounded-[40px] bg-white/80 border border-black/5 shadow-[0_26px_0_rgba(0,0,0,0.10)] p-10 overflow-hidden relative">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-[#22c55e] to-[#0ea5e9] blur-3xl opacity-25" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-[#fda4af] to-[#a78bfa] blur-3xl opacity-25" />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div>
                <h3 className="text-3xl md:text-4xl font-display font-black text-slate-950">Ready to enroll?</h3>
                <p className="text-slate-700 mt-2 max-w-2xl leading-relaxed">
                  Start free. Upload your resume, choose a target role, and get a roadmap you can actually follow—then
                  track progress with charts and role targets.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={() => navigate('/upload')}
                  className="px-7 py-3.5 rounded-2xl bg-[#22c55e] text-slate-950 font-extrabold border border-black/10 shadow-[0_18px_0_rgba(0,0,0,0.12)] hover:translate-y-[1px] hover:shadow-[0_14px_0_rgba(0,0,0,0.12)] transition-all w-full sm:w-auto"
                >
                  Start Free →
                </button>
                <button
                  onClick={() => navigate('/skill-sphere')}
                  className="px-7 py-3.5 rounded-2xl bg-white text-slate-950 font-extrabold border border-black/5 shadow-[0_18px_0_rgba(0,0,0,0.10)] hover:bg-white/90 transition-all w-full sm:w-auto"
                >
                  Open Skill Sphere
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-12 border-t border-black/5">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-white shadow-[0_14px_0_rgba(0,0,0,0.10)] border border-black/5 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#16a34a]" />
          </div>
          <span className="font-extrabold text-slate-950 tracking-wide">SkillForge</span>
        </div>
        <p className="text-sm text-slate-600">AI-adaptive learning paths • FastAPI + React • Gemini-powered intelligence</p>
      </footer>
    </div>
  )
}
