import { apiFetch } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export async function getMetricsOverview(from?: string, to?: string) {
  const qs = new URLSearchParams({ from: from ?? "", to: to ?? "" });
  const res = await apiFetch(`${API_BASE}/metrics/overview?${qs}`);
  if (!res.ok) throw new Error("Failed to get metrics overview");
  return res.json();
}

export async function getTimeToFill(jobId?: string, from?: string, to?: string) {
  const params: Record<string, string> = {};
  if (jobId) params.jobId = jobId;
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiFetch(`${API_BASE}/metrics/time-to-fill?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error("Failed to get time-to-fill");
  return res.json();
}

export async function getConversion(jobId?: string, from?: string, to?: string) {
  const params: Record<string, string> = {};
  if (jobId) params.jobId = jobId;
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiFetch(`${API_BASE}/metrics/conversion?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error("Failed to get conversion");
  return res.json();
}

export async function getScoreDistribution(jobId?: string) {
  const res = await apiFetch(`${API_BASE}/metrics/score-distribution${jobId ? `?jobId=${jobId}` : ""}`);
  if (!res.ok) throw new Error("Failed to get score distribution");
  return res.json();
}

export async function getSourceEffectiveness(from?: string, to?: string) {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiFetch(`${API_BASE}/metrics/source-effectiveness?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error("Failed to get source effectiveness");
  return res.json();
}
