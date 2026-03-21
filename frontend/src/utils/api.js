/**
 * API Utility — Handles all communication with the SkillForge backend.
 */

// Use the VITE_API_URL environment variable if deployed, otherwise fallback to local proxy
export const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api` 
  : '/api';

/**
 * Upload a resume PDF and extract skills.
 */
export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload/resume`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errMsg = `Failed with status ${response.status}`;
    try {
      const err = await response.json();
      errMsg = err.detail || errMsg;
    } catch(e) { /* ignore */ }
    throw new Error(errMsg);
  }

  return response.json();
}

/**
 * Submit a Job Description (text or PDF).
 */
export async function uploadJD(jdText, file = null) {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (jdText) {
    formData.append('jd_text', jdText);
  }

  const response = await fetch(`${API_BASE}/upload/jd`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errMsg = `Failed with status ${response.status}`;
    try {
      const err = await response.json();
      errMsg = err.detail || errMsg;
    } catch(e) { /* ignore */ }
    throw new Error(errMsg);
  }

  return response.json();
}

/**
 * Run full skill gap analysis.
 */
export async function analyzeGap(sessionId, resumeSkills, jdText, domain) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      resume_skills: resumeSkills,
      jd_text: jdText,
      domain: domain,
    }),
  });

  if (!response.ok) {
    let errMsg = `Failed with status ${response.status}`;
    try {
      const err = await response.json();
      errMsg = err.detail || errMsg;
    } catch(e) { /* ignore */ }
    throw new Error(errMsg);
  }

  return response.json();
}

/**
 * Update progress — mark modules as complete.
 */
export async function updateProgress(sessionId, completedModuleIds) {
  const response = await fetch(`${API_BASE}/progress/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      completed_module_ids: completedModuleIds,
    }),
  });

  if (!response.ok) {
    let errMsg = `Failed with status ${response.status}`;
    try {
      const err = await response.json();
      errMsg = err.detail || errMsg;
    } catch(e) { /* ignore */ }
    throw new Error(errMsg);
  }

  return response.json();
}

/**
 * Scrape and summarize a URL.
 */
export async function scrapeUrl(url) {
  const response = await fetch(`${API_BASE}/scrape-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    let errMsg = `Failed with status ${response.status}`;
    try {
      const err = await response.json();
      errMsg = err.detail || errMsg;
    } catch(e) { /* ignore */ }
    throw new Error(errMsg);
  }

  return response.json();
}
