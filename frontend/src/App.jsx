import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import ProcessingPage from './pages/ProcessingPage'
import ResultsDashboard from './pages/ResultsDashboard'
import NotesPage from './pages/NotesPage'
import QuizArena from './pages/QuizArena'
import SkillSpherePage from './pages/SkillSpherePage'

// Note: Replace with true Clerk Publishable Key in production
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ""

function ProtectedRoute({ children }) {
  const isDemo = sessionStorage.getItem('is_demo') === 'true'
  if (isDemo || !PUBLISHABLE_KEY || !PUBLISHABLE_KEY.startsWith("pk_")) {
    return children;
  }
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}

function App() {
  const content = (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/processing" element={<ProtectedRoute><ProcessingPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><ResultsDashboard /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><QuizArena /></ProtectedRoute>} />
        <Route path="/skill-sphere" element={<ProtectedRoute><SkillSpherePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )

  if (!PUBLISHABLE_KEY || !PUBLISHABLE_KEY.startsWith("pk_")) {
    return content;
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      {content}
    </ClerkProvider>
  )
}

export default App
