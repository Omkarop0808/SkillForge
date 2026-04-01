import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Loader2, Clock, Sparkles } from 'lucide-react'
import { analyzeGap } from '../utils/api'

const steps = [
  { label: 'Reading your resume...', icon: '📄' },
  { label: 'Extracting your skills...', icon: '🔍' },
  { label: 'Analyzing job requirements...', icon: '📋' },
  { label: 'Calculating skill gaps...', icon: '🧮' },
  { label: 'Building your learning path...', icon: '🗺️' },
]

export default function ProcessingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const sessionData = sessionStorage.getItem('skillforge_session')
    if (!sessionData) {
      navigate('/upload')
      return
    }

    const data = JSON.parse(sessionData)

    // Animate steps while analysis runs
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 2500)

    // Run actual analysis
    const runAnalysis = async () => {
      try {
        const result = await analyzeGap(
          data.sessionId,
          data.resumeSkills,
          data.jdText,
          data.domain,
        )

        // Store result
        sessionStorage.setItem('skillforge_result', JSON.stringify(result))

        // Wait for steps to finish visually
        setTimeout(() => {
          clearInterval(stepInterval)
          navigate('/dashboard')
        }, 1500)
      } catch (err) {
        setError(err.message || 'Analysis failed. Please try again.')
        clearInterval(stepInterval)
      }
    }

    runAnalysis()

    return () => clearInterval(stepInterval)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center relative clay-hero-bg">

      <div className="relative z-10 w-full max-w-lg mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-white/80 border border-black/5 shadow-[0_12px_0_rgba(15,23,42,0.10),0_26px_70px_rgba(15,23,42,0.10)] flex items-center justify-center mx-auto mb-6 float-animation">
            <Sparkles className="w-8 h-8 text-[#16a34a]" />
          </div>
          <h1 className="text-2xl font-display font-black mb-2 text-slate-950">
            Analyzing Your <span className="text-[#7c3aed]">Profile</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>Estimated time: ~15 seconds</span>
          </div>
        </div>

        {/* Step Progress */}
        <div className="clay-card p-8 animate-slide-up">
          <div className="space-y-2">
            {steps.map((step, i) => {
              const isCompleted = i < currentStep
              const isActive = i === currentStep
              const isPending = i > currentStep

              return (
                <div
                  key={i}
                  className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-[#16a34a]" />
                    ) : isActive ? (
                      <Loader2 className="w-6 h-6 text-[#7c3aed] animate-spin" />
                    ) : (
                      <span className="text-lg">{step.icon}</span>
                    )}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-slate-950 font-semibold' : isCompleted ? 'text-slate-600' : 'text-slate-600'}`}>
                    {isCompleted ? step.label.replace('...', ' ✓') : step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 h-2 bg-black/5 rounded-full overflow-hidden border border-black/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#7c3aed] transition-all duration-1000 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-3xl bg-white/80 border border-red-500/20 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)] text-center animate-fade-in">
            <p className="text-sm text-red-700 font-semibold mb-3">{error}</p>
            <button
              className="clay-btn-secondary text-sm px-5 py-2.5"
              onClick={() => navigate('/upload')}
            >
              Go Back & Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
