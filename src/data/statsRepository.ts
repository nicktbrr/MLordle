import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { DayResult } from '../state/progress';

export interface DailyStats {
  players: number;
  round1_solve_rate: number; // 0..1
  round2_solve_rate: number;
  round3_solve_rate: number;
  avg_round1_attempts: number;
  avg_round2_attempts: number;
  avg_round3_attempts: number;
  dist_rounds_solved: Record<string, number> | null; // { "0": n, "1": n, ... }
}

const CLIENT_KEY = 'mlordle:client-id';

/** Stable anonymous id for this browser (no login). */
export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}

/** Record this browser's result for the day. Idempotent (one row per client/day). */
export async function submitResult(result: DayResult): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.rpc('submit_result', {
    p_client_id: getClientId(),
    p_date_key: result.dateKey,
    p_round1_solved: result.round1.solved,
    p_round1_attempts: result.round1.attempts,
    p_round2_solved: result.round2.solved,
    p_round2_attempts: result.round2.attempts,
    p_round3_solved: result.round3.solved,
    p_round3_attempts: result.round3.attempts,
    p_rounds_solved: [result.round1, result.round2, result.round3].filter((r) => r.solved).length,
  });
  if (error) throw new Error(error.message);
}

/** Aggregate community stats for a given day, or null if Supabase isn't configured. */
export async function getDailyStats(dateKey: string): Promise<DailyStats | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('get_daily_stats', { p_date_key: dateKey });
  if (error) throw new Error(error.message);
  return data as DailyStats;
}
