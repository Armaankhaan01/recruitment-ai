const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

// Shared fetch wrapper that automatically handles token refresh and retries on 401
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;

  let res = await fetch(url, { ...options, headers });

  // If 401, check if it's token expired and try to refresh
  if (res.status === 401) {
    const clone = res.clone();
    try {
      const data = await clone.json();
      if (data.error?.code === "TOKEN_EXPIRED" || data.error?.code === "INVALID_TOKEN") {
        const refresh = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
        if (refresh) {
          // Attempt refresh
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: refresh }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (typeof window !== "undefined") {
              localStorage.setItem("token", refreshData.token);
            }

            // Retry original request with new token
            const retryHeaders = {
              ...options.headers,
              Authorization: `Bearer ${refreshData.token}`,
            } as Record<string, string>;

            res = await fetch(url, { ...options, headers: retryHeaders });
            return res;
          }
        }
      }
    } catch {
      // JSON parsing failed, fallback
    }

    // If refresh failed or was not possible, redirect to login
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      if (!window.location.pathname.startsWith("/auth/login") && window.location.pathname !== "/") {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
  }

  return res;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function refreshToken(token: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: token }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  return res.json();
}

export async function logout() {
  await apiFetch(`${API_BASE}/auth/logout`, {
    method: "POST",
  });
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }
}

export async function me() {
  const res = await apiFetch(`${API_BASE}/auth/me`);
  if (!res.ok) throw new Error("Fetch user failed");
  return res.json();
}

export async function createTeam(name: string) {
  const res = await apiFetch(`${API_BASE}/auth/team/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error?.message || "Failed to create team");
  }
  return res.json();
}

export async function joinTeam(inviteCode: string) {
  const res = await apiFetch(`${API_BASE}/auth/team/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteCode }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error?.message || "Failed to join team");
  }
  return res.json();
}

export async function register(data: { email: string; password: string; fullName: string; role: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error?.message || "Registration failed");
  }
  return res.json();
}
