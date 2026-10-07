import { useEffect, useState } from 'react';

// Demos are fetched live from the free ExerciseDB API (no key) and kept in memory only.
const EXDB = 'https://oss.exercisedb.dev/api/v1/exercises';

export interface Demo {
  exerciseId: string; name: string; gifUrl: string;
  targetMuscles: string[]; secondaryMuscles: string[]; equipments: string[]; instructions: string[];
}

const cache = new Map<string, Demo[]>();
export async function fetchDemos(q: string, limit: number): Promise<Demo[]> {
  const key = `${q}|${limit}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const res = await fetch(`${EXDB}?name=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const data: Demo[] = Array.isArray(json?.data) ? json.data : [];
  cache.set(key, data);
  return data;
}

export const ytUrl = (name: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${name} proper form`)}`;
export const cleanStep = (t: string) => t.replace(/^Step:\s*\d+\s*/i, '');

export function useDemos(q: string | null, limit: number) {
  const [state, setState] = useState<{ data: Demo[] | null; error: boolean }>({ data: null, error: false });
  useEffect(() => {
    if (!q) { setState({ data: null, error: false }); return; }
    let live = true;
    setState({ data: null, error: false });
    const t = setTimeout(() => {
      fetchDemos(q, limit)
        .then(data => { if (live) setState({ data, error: false }); })
        .catch(() => { if (live) setState({ data: null, error: true }); });
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [q, limit]);
  return state;
}

