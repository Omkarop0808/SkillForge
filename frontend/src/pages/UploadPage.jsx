import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, Sparkles, ArrowRight, ChevronDown } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { uploadResume, uploadJD } from '../utils/api'
import { sampleJDs } from '../utils/sampleData'

export default function UploadPage() {
  const navigate = useNavigate()
  const [resumeFile, setResumeFile] = useState(null)
  const [jdText, setJdText] = useState('')
  const [domain, setDomain] = useState('tech')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('')
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.')
      } else {
        setError('Only PDF files are accepted.')
      }
      return
    }
    if (acceptedFiles.length > 0) {
      setResumeFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
  })

  const handleAnalyze = async () => {
    setError('')
    
    if (!resumeFile) {
      setError('Please upload your resume PDF.')
      return
    }
    if (!jdText.trim() || jdText.trim().split(/\s+/).length < 50) {
      setError('Please provide a job description with at least 50 words.')
      return
    }

    setLoading(true)
    try {
      // Upload resume
      const resumeResult = await uploadResume(resumeFile)
      
      // Store in sessionStorage for processing page
      sessionStorage.setItem('skillforge_session', JSON.stringify({
        sessionId: resumeResult.session_id,
        resumeSkills: resumeResult.skills,
        experienceLevel: resumeResult.experience_level,
        jdText: jdText.trim(),
        domain,
      }))

      navigate('/processing')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative bg-[#06020c]">
      {/* Background Magic Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="magic-blob top-[-10%] right-[-5%]" style={{ animationDelay: '-1s' }} />
        <div className="magic-blob bottom-[-10%] left-[-5%]" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span className="text-xl font-display font-bold text-white cursor-pointer" onClick={() => navigate('/')}>
            SkillForge AI
          </span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-8 py-8 animate-slide-up">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-display font-medium text-white mb-4">
            Analyze Your Skill Gap
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Upload your resume and paste the job description to instantly build your personalized learning roadmap.
          </p>
        </div>

        {/* Domain Toggle */}
        <div className="flex justify-center mb-8" id="domain-toggle">
          <div className="glass-card inline-flex p-1.5 gap-1">
            <button
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                domain === 'tech'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setDomain('tech')}
            >
              💻 Tech Role
            </button>
            <button
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                domain === 'operational'
                  ? 'bg-[#10b981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setDomain('operational')}
            >
              🏭 Operational Role
            </button>
          </div>
        </div>

        {/* Two Column Upload */}
        <div className="grid md:grid-cols-2 gap-8 animate-slide-up">
          {/* Left: Resume Upload */}
          <div className="glass-card p-8">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              Upload Your Resume
            </h2>
            <p className="text-sm text-slate-400 mb-6">PDF format, max 5MB</p>

            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${resumeFile ? 'border-green-500/40 bg-green-500/10' : ''}`}
              id="resume-dropzone"
            >
              <input {...getInputProps()} />
              {resumeFile ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-10 h-10 text-green-400" />
                  <p className="text-green-300 font-medium">{resumeFile.name}</p>
                  <p className="text-xs text-slate-400">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                  <button
                    className="text-xs text-red-400 hover:text-red-300 mt-2 px-3 py-1 rounded bg-red-400/10"
                    onClick={(e) => { e.stopPropagation(); setResumeFile(null) }}
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Upload className="w-10 h-10 text-purple-400/50" />
                  <p className="text-slate-300">
                    {isDragActive ? 'Drop your resume here...' : 'Drag & drop your resume PDF'}
                  </p>
                  <p className="text-xs text-slate-500">or click to browse</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: JD Input */}
          <div className="glass-card p-8">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Paste Job Description
            </h2>
            <p className="text-sm text-slate-400 mb-3">Minimum 50 words for accurate analysis</p>

            {/* Sample JD Dropdown */}
            <div className="mb-3">
              <select
                id="sample-jd-select"
                className="w-full bg-surface-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                value=""
                onChange={(e) => {
                  const selected = sampleJDs.find(j => j.title === e.target.value)
                  if (selected) {
                    setJdText(selected.text)
                    setDomain(selected.domain)
                    setError('')
                  }
                }}
              >
                <option value="">⚡ Quick fill — select a sample JD</option>
                {sampleJDs.map((jd, i) => (
                  <option key={i} value={jd.title}>
                    {jd.domain === 'tech' ? '💻' : '🏭'} {jd.title}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              id="jd-textarea"
              className="w-full h-[215px] bg-[#0a0514]/50 border border-slate-700/50 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all resize-none text-sm shadow-inner"
              placeholder="Paste the full job description here...&#10;&#10;Include responsibilities, qualifications, and required skills for the best analysis."
              value={jdText}
              onChange={(e) => { setJdText(e.target.value); setError('') }}
            />

            <div className="flex justify-between items-center mt-3">
              <span className={`text-xs px-2 py-1 rounded bg-black/20 ${jdText.trim().split(/\s+/).filter(Boolean).length < 50 ? 'text-amber-400' : 'text-green-400'}`}>
                {jdText.trim().split(/\s+/).filter(Boolean).length} words
                {jdText.trim().split(/\s+/).filter(Boolean).length < 50 && ' (min 50)'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-fade-in max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Analyze Button */}
        <div className="text-center mt-10">
          <button
            id="analyze-button"
            className="btn-primary text-lg px-12 py-4 inline-flex items-center gap-3"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Analyze My Gap
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
