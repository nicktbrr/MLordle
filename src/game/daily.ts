import type { Cause, Content, Scenario, Stage, Symptom, Technique } from '../data/types';

export interface DailyPuzzle {
  dateKey: string;
  scenario: Scenario;
  // Round 1 — order the stages
  round1Stages: Stage[]; // ordered stages + decoys, deterministically shuffled
  round1Answer: string[]; // correct ordered stage ids
  round1DecoyIds: string[]; // stage ids that don't belong
  // Round 2 — technique-dle
  round2Stage: Stage;
  round2Answer: Technique;
  round2Pool: Technique[]; // all techniques, sorted by name (guess options)
  // Round 3 — what breaks?
  round3Symptom: Symptom;
  round3Answer: Cause;
  round3Pool: Cause[]; // all causes, sorted by name
}

/** Local-time date key, e.g. "2026-06-16". */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// cyrb53 string hash -> 32-bit-ish unsigned int seed.
function hashString(str: string): number {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0) ^ ((h1 >>> 0) << 1);
}

// mulberry32 PRNG — deterministic stream from a seed.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build the deterministic puzzle for a given date. Same dateKey + content always
 * yields the same puzzle. Throws if content is too sparse to assemble a puzzle.
 */
export function buildDailyPuzzle(content: Content, dateKey: string): DailyPuzzle {
  const { stages, scenarios, techniques, causes, symptoms } = content;
  if (!scenarios.length || !symptoms.length || !causes.length || !techniques.length) {
    throw new Error('Not enough content to build a daily puzzle.');
  }

  const stageById = new Map(stages.map((s) => [s.id, s]));
  const seed = hashString(dateKey);

  // --- scenario (Round 1) ---
  const scenario = scenarios[seed % scenarios.length];
  const round1Answer = scenario.ordered_stage_ids;
  const round1DecoyIds = scenario.decoy_stage_ids;
  const round1Stages = shuffle(
    [...round1Answer, ...round1DecoyIds]
      .map((id) => stageById.get(id))
      .filter((s): s is Stage => Boolean(s)),
    mulberry32(seed ^ 0x9e3779b9),
  );

  // --- Round 2: pick an ordered stage that actually has techniques ---
  const techniquesByStage = new Map<string, Technique[]>();
  for (const t of techniques) {
    const list = techniquesByStage.get(t.stage_id) ?? [];
    list.push(t);
    techniquesByStage.set(t.stage_id, list);
  }
  const eligibleStageIds = round1Answer.filter((id) => (techniquesByStage.get(id)?.length ?? 0) > 0);
  const r2Rng = mulberry32(seed ^ 0x85ebca6b);
  const round2StageId = eligibleStageIds.length
    ? pick(eligibleStageIds, r2Rng)
    : techniques[seed % techniques.length].stage_id;
  const round2Stage = stageById.get(round2StageId)!;
  const round2Answer = pick(techniquesByStage.get(round2StageId)!, r2Rng);
  const round2Pool = [...techniques].sort((a, b) => a.name.localeCompare(b.name));

  // --- Round 3: pick a symptom ---
  const causeById = new Map(causes.map((c) => [c.id, c]));
  const r3Rng = mulberry32(seed ^ 0xc2b2ae35);
  const round3Symptom = pick(symptoms, r3Rng);
  const round3Answer = causeById.get(round3Symptom.cause_id)!;
  const round3Pool = [...causes].sort((a, b) => a.name.localeCompare(b.name));

  return {
    dateKey,
    scenario,
    round1Stages,
    round1Answer,
    round1DecoyIds,
    round2Stage,
    round2Answer,
    round2Pool,
    round3Symptom,
    round3Answer,
    round3Pool,
  };
}
