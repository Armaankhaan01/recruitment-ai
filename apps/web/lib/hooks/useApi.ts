import { useCallback } from "react";

export function useApi() {
  const request = useCallback(async (url: string, init?: RequestInit) => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...init, headers: { ...headers, ...init?.headers } });

    if (res.status === 401) {
      const body = await res.json();
      if (body.error?.code === "TOKEN_EXPIRED") {
        const refresh = localStorage.getItem("refreshToken");
        if (refresh) {
          const refreshed = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1"}/auth/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: refresh }),
            }
          );
          if (refreshed.ok) {
            const data = await refreshed.json();
            localStorage.setItem("token", data.token);
            headers["Authorization"] = `Bearer ${data.token}`;
            return fetch(url, { ...init, headers });
          }
        }
        window.location.href = "/auth/login";
      }
    }

    return res;
  }, []);

  return { request };
}
