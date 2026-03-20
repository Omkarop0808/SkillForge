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
          navigate('/results')
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
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6 float-animation">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">
            Analyzing Your <span className="gradient-text">Profile</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Estimated time: ~15 seconds</span>
          </div>
        </div>

        {/* Step Progress */}
        <div className="glass-card p-8 animate-slide-up">
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
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : isActive ? (
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    ) : (
                      <span className="text-lg">{step.icon}</span>
                    )}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-blue-300 font-medium' : isCompleted ? 'text-slate-500' : 'text-slate-500'}`}>
                    {isCompleted ? step.label.replace('...', ' ✓') : step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center animate-fade-in">
            <p className="text-sm text-red-300 mb-3">{error}</p>
            <button
              className="btn-secondary text-sm"
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
