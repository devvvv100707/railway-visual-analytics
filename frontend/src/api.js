import { useEffect, useState } from "react";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function api(path, params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null));
  let r;
  try { r = await fetch(`${BASE}${path}${q.toString() ? "?" + q : ""}`); }
  catch { throw new Error("Cannot reach the backend. Is uvicorn running on port 8000?"); }
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || r.statusText); }
  return r.json();
}

// Fetches `path` whenever params/tick change. Returns {data, loading, error}.
export function useApi(path, params = {}, tick = 0) {
  const [s, set] = useState({ data: null, loading: true, error: null });
  const key = JSON.stringify(params);
  useEffect(() => {
    let live = true;
    set((p) => ({ ...p, loading: true, error: null }));
    api(path, params).then((data) => live && set({ data, loading: false, error: null }))
      .catch((error) => live && set({ data: null, loading: false, error: error.message }));
    return () => { live = false; };
  }, [path, key, tick]);
  return s;
}
