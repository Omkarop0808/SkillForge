/**
 * API Utility — Handles all communication with the SkillForge backend.
 */

const API_BASE = '/api';

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
    const err = await response.json();
    throw new Error(err.detail || 'Failed to upload resume');
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
    const err = await response.json();
    throw new Error(err.detail || 'Failed to process JD');
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
    const err = await response.json();
    throw new Error(err.detail || 'Analysis failed');
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
    const err = await response.json();
    throw new Error(err.detail || 'Progress update failed');
  }

  return response.json();
}
