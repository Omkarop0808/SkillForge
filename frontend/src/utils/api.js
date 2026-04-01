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

const jsonHeaders = { 'Content-Type': 'application/json' };

async function skillSpherePost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let errMsg = `Failed with status ${response.status}`;
    try {
      const err = await response.json();
      errMsg = err.detail || errMsg;
    } catch (e) { /* ignore */ }
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  }
  return response.json();
}

export async function skillSphereCareerPersona(context) {
  return skillSpherePost('/skill-sphere/career-persona', context);
}

export async function skillSphereCareerCoach(context) {
  return skillSpherePost('/skill-sphere/career-coach', context);
}

export async function skillSphereJobMatch(payload) {
  return skillSpherePost('/skill-sphere/job-match', payload);
}

export async function skillSpherePeerLearning(payload) {
  return skillSpherePost('/skill-sphere/peer-learning', payload);
}

export async function skillSpherePersonalizedLearning(context) {
  return skillSpherePost('/skill-sphere/personalized-learning', context);
}

export async function skillSphereInterviewReport(payload) {
  return skillSpherePost('/skill-sphere/interview-report', payload);
}

export async function skillSphereJobTrends(payload) {
  return skillSpherePost('/skill-sphere/job-trends', payload);
}

export async function skillSpherePortfolio(payload) {
  return skillSpherePost('/skill-sphere/portfolio', payload);
}

/** AI: roles that fit current skills vs after closing JD gaps */
export async function skillSphereRoleTargets(payload) {
  return skillSpherePost('/skill-sphere/role-targets', payload);
}
