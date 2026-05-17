import { apiFetch } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export async function listJobs(params?: { status?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams(params as unknown as Record<string, string>);
  const res = await apiFetch(`${API_BASE}/jobs?${qs}`);
  if (!res.ok) throw new Error("Failed to list jobs");
  return res.json();
}

export async function getJob(id: string) {
  const res = await apiFetch(`${API_BASE}/jobs/${id}`);
  if (!res.ok) throw new Error("Failed to get job");
  return res.json();
}

export async function createJob(data: { title: string; description: string; skillRequirements: unknown[]; minExperienceYears?: number; seniorityLevel?: string; salaryRangeMin?: number; salaryRangeMax?: number }) {
  const res = await apiFetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create job");
  return res.json();
}

export async function updateJob(id: string, data: Record<string, unknown>) {
  const res = await apiFetch(`${API_BASE}/jobs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update job");
  return res.json();
}

export async function publishJob(id: string) {
  const res = await apiFetch(`${API_BASE}/jobs/${id}/publish`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to publish job");
  return res.json();
}

export async function closeJob(id: string) {
  const res = await apiFetch(`${API_BASE}/jobs/${id}/close`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to close job");
  return res.json();
}

export async function getCandidates(jobId: string, params?: { status?: string; minScore?: number; page?: number; limit?: number }) {
  const qs = new URLSearchParams(params as unknown as Record<string, string>);
  const res = await apiFetch(`${API_BASE}/jobs/${jobId}/candidates?${qs}`);
  if (!res.ok) throw new Error("Failed to get candidates");
  return res.json();
}

export async function listPublicJobs(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams(params as unknown as Record<string, string>);
  const res = await fetch(`${API_BASE}/jobs/public?${qs}`);
  if (!res.ok) throw new Error("Failed to list public jobs");
  return res.json();
}

export async function getPublicJob(id: string) {
  const res = await fetch(`${API_BASE}/jobs/public/${id}`);
  if (!res.ok) throw new Error("Failed to fetch job details");
  return res.json();
}
