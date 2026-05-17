import { apiFetch } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export async function getApplication(id: string) {
  const res = await apiFetch(`${API_BASE}/applications/${id}`);
  if (!res.ok) throw new Error("Failed to get application");
  return res.json();
}

export async function submitDecision(applicationId: string, decisionType: string, rationale: string) {
  const res = await apiFetch(`${API_BASE}/applications/${applicationId}/decision`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decisionType, rationale }),
  });
  if (!res.ok) throw new Error("Failed to submit decision");
  return res.json();
}

export async function getDecisions(applicationId: string) {
  const res = await apiFetch(`${API_BASE}/applications/${applicationId}/decisions`);
  if (!res.ok) throw new Error("Failed to get decisions");
  return res.json();
}

export async function reprocess(applicationId: string) {
  const res = await apiFetch(`${API_BASE}/applications/${applicationId}/reprocess`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reprocess");
  return res.json();
}

export async function getApplications(page: number = 1, limit: number = 20) {
  const res = await apiFetch(`${API_BASE}/applications?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to get applications");
  return res.json();
}
