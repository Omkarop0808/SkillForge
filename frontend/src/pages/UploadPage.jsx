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
        resumeRawText: resumeResult.raw_text || '',
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
    <div className="min-h-screen relative clay-hero-bg">
      {/* Header */}
      <header className="relative z-20 border-b border-black/5 bg-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#16a34a]" />
            </div>
            <span className="text-lg md:text-xl font-display font-extrabold text-slate-950 cursor-pointer" onClick={() => navigate('/')}>
              SkillForge
            </span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-12 animate-slide-up">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-display font-black text-slate-950 mb-3">
            Analyze Your Skill Gap
          </h1>
          <p className="text-slate-700 max-w-xl mx-auto">
            Upload your resume and paste the job description to instantly build your personalized learning roadmap.
          </p>
        </div>

        {/* Domain Toggle */}
        <div className="flex justify-center mb-8" id="domain-toggle">
          <div className="clay-pill inline-flex p-1.5 gap-1">
            <button
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                domain === 'tech'
                  ? 'bg-[#7c3aed] text-white shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)]'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
              onClick={() => setDomain('tech')}
            >
              💻 Tech Role
            </button>
            <button
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                domain === 'operational'
                  ? 'bg-[#22c55e] text-slate-950 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)]'
                  : 'text-slate-700 hover:text-slate-950'
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
          <div className="clay-card p-8">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#0ea5e9]" />
              Upload Your Resume
            </h2>
            <p className="text-sm text-slate-600 mb-6">PDF format, max 5MB</p>

            <div
              {...getRootProps()}
              className={`rounded-[26px] border-2 border-dashed p-10 text-center cursor-pointer transition-all bg-white/70 shadow-[inset_0_2px_0_rgba(15,23,42,0.06)] ${
                isDragActive ? 'border-[#7c3aed]/50 bg-white' : 'border-black/10 hover:border-[#7c3aed]/40'
              } ${resumeFile ? 'border-[#22c55e]/50 bg-white' : ''}`}
              id="resume-dropzone"
            >
              <input {...getInputProps()} />
              {resumeFile ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-10 h-10 text-[#16a34a]" />
                  <p className="text-slate-950 font-extrabold">{resumeFile.name}</p>
                  <p className="text-xs text-slate-600">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                  <button
                    className="text-xs text-red-700 hover:text-red-800 mt-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20"
                    onClick={(e) => { e.stopPropagation(); setResumeFile(null) }}
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Upload className="w-10 h-10 text-slate-500" />
                  <p className="text-slate-800 font-semibold">
                    {isDragActive ? 'Drop your resume here...' : 'Drag & drop your resume PDF'}
                  </p>
                  <p className="text-xs text-slate-600">or click to browse</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: JD Input */}
          <div className="clay-card p-8">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#7c3aed]" />
              Paste Job Description
            </h2>
            <p className="text-sm text-slate-600 mb-3">Minimum 50 words for accurate analysis</p>

            {/* Sample JD Dropdown */}
            <div className="mb-3">
              <select
                id="sample-jd-select"
                className="w-full bg-white/80 border border-black/10 rounded-2xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#7c3aed]/40 cursor-pointer shadow-[inset_0_2px_0_rgba(15,23,42,0.06)]"
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
              className="w-full h-[215px] bg-white/80 border border-black/10 rounded-[26px] p-4 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/40 focus:ring-1 focus:ring-[#7c3aed]/15 transition-all resize-none text-sm shadow-[inset_0_2px_0_rgba(15,23,42,0.06)]"
              placeholder="Paste the full job description here...&#10;&#10;Include responsibilities, qualifications, and required skills for the best analysis."
              value={jdText}
              onChange={(e) => { setJdText(e.target.value); setError('') }}
            />

            <div className="flex justify-between items-center mt-3">
              <span className={`text-xs px-3 py-1 rounded-full bg-white border border-black/10 shadow-[0_8px_0_rgba(15,23,42,0.08),0_14px_30px_rgba(15,23,42,0.05)] ${
                jdText.trim().split(/\s+/).filter(Boolean).length < 50 ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {jdText.trim().split(/\s+/).filter(Boolean).length} words
                {jdText.trim().split(/\s+/).filter(Boolean).length < 50 && ' (min 50)'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 rounded-[22px] bg-white/80 border border-red-500/20 shadow-[0_10px_0_rgba(15,23,42,0.10),0_18px_40px_rgba(15,23,42,0.06)] flex items-center gap-3 animate-fade-in max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Analyze Button */}
        <div className="text-center mt-10">
          <button
            id="analyze-button"
            className="clay-btn text-lg px-12 py-4 inline-flex items-center gap-3"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
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
