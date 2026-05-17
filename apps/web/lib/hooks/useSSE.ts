import { useEffect, useRef, useState } from "react";

type SSEHandler = (data: unknown) => void;

export function useSSE() {
  const [connected, setConnected] = useState(false);
  const eventSource = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";
    const es = new EventSource(`${apiBase}/events`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      window.dispatchEvent(new CustomEvent("sse-event", { detail: data }));
    };

    es.addEventListener("application:processed", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string);
      window.dispatchEvent(new CustomEvent("sse-processed", { detail: data }));
    });

    es.addEventListener("application:failed", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string);
      window.dispatchEvent(new CustomEvent("sse-failed", { detail: data }));
    });

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    eventSource.current = es;
    return () => es.close();
  }, []);

  return { connected };
}
