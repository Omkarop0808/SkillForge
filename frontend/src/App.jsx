import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import ProcessingPage from './pages/ProcessingPage'
import ResultsDashboard from './pages/ResultsDashboard'

// Note: Replace with true Clerk Publishable Key in production
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ""

function App() {
  // Gracefully handle missing or invalid Clerk key to prevent hard crashes
  if (!PUBLISHABLE_KEY || !PUBLISHABLE_KEY.startsWith("pk_")) {
    return (
      <div className="min-h-screen bg-[#06020c] flex items-center justify-center p-8">
        <div className="glass-card p-8 max-w-lg text-center border-red-500/30">
          <h2 className="text-2xl font-bold text-white mb-4">Clerk Authentication Missing</h2>
          <p className="text-slate-300 mb-6">
            The application requires a valid Clerk Publishable Key to run.
          </p>
          <div className="bg-black/50 p-4 rounded-lg text-left text-sm font-mono text-purple-300 mb-6 overflow-x-auto">
            1. Go to <a href="https://dashboard.clerk.com" target="_blank" className="text-blue-400 underline">dashboard.clerk.com</a><br/>
            2. Create an application<br/>
            3. Copy the "Publishable key"<br/>
            4. Paste it into <code>frontend/.env</code> as:<br/>
            <span className="text-white">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</span>
          </div>
          <p className="text-xs text-slate-500">Restart the Vite server after adding the key.</p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={
            <>
              <SignedIn><UploadPage /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } />
          <Route path="/processing" element={
            <>
              <SignedIn><ProcessingPage /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } />
          <Route path="/results" element={
            <>
              <SignedIn><ResultsDashboard /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  )
}

export default App
