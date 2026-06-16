import { useCallback, useState } from 'react';

export interface RoundOutcome {
  solved: boolean;
  attempts: number;
  rows: string[]; // emoji rows for sharing
}

export interface DayResult {
  dateKey: string;
  round1: RoundOutcome;
  round2: RoundOutcome;
  round3: RoundOutcome;
  round4: RoundOutcome;
  completedAt: string;
}

interface ProgressState {
  results: Record<string, DayResult>;
}

const STORAGE_KEY = 'mlordle:progress:v1';

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProgressState;
  } catch {
    /* ignore malformed storage */
  }
  return { results: {} };
}

function save(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable; progress is best-effort */
  }
}

function prevDayKey(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Consecutive days completed ending at todayKey (or yesterday if today unplayed). */
export function computeStreak(results: Record<string, DayResult>, todayKey: string): number {
  let cursor = results[todayKey] ? todayKey : prevDayKey(todayKey);
  let streak = 0;
  while (results[cursor]) {
    streak++;
    cursor = prevDayKey(cursor);
  }
  return streak;
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(() => load());

  const saveDay = useCallback((result: DayResult) => {
    setState((prev) => {
      const next = { ...prev, results: { ...prev.results, [result.dateKey]: result } };
      save(next);
      return next;
    });
  }, []);

  return { results: state.results, saveDay };
}
