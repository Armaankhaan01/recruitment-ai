import { apiFetch } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export async function listCandidates(params?: { skill?: string; seniority?: string; minScore?: number; page?: number; limit?: number }) {
  const qs = new URLSearchParams(params as unknown as Record<string, string>);
  const res = await apiFetch(`${API_BASE}/candidates?${qs}`);
  if (!res.ok) throw new Error("Failed to list candidates");
  return res.json();
}

export async function getCandidate(id: string) {
  const res = await apiFetch(`${API_BASE}/candidates/${id}`);
  if (!res.ok) throw new Error("Failed to get candidate");
  return res.json();
}

export async function deleteCandidate(id: string) {
  const res = await apiFetch(`${API_BASE}/candidates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete candidate");
  return res.json();
}
