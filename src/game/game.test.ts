import { describe, expect, it } from 'vitest';
import { fallbackContent } from '../data/fallbackContent';
import { buildDailyPuzzle, todayKey } from './daily';
import { evaluateRound1 } from './round1';
import { evaluateRound2Guess } from './round2';
import { evaluateRound3Guess } from './round3';

const stageName = (id: string) =>
  fallbackContent.stages.find((s) => s.id === id)?.name ?? id;

describe('daily puzzle selection', () => {
  it('is deterministic for the same date key', () => {
    const a = buildDailyPuzzle(fallbackContent, '2026-06-16');
    const b = buildDailyPuzzle(fallbackContent, '2026-06-16');
    expect(a.scenario.id).toBe(b.scenario.id);
    expect(a.round2Answer.id).toBe(b.round2Answer.id);
    expect(a.round3Answer.id).toBe(b.round3Answer.id);
    expect(a.round1Stages.map((s) => s.id)).toEqual(b.round1Stages.map((s) => s.id));
  });

  it('picks a Round 2 stage that contains the answer technique', () => {
    const p = buildDailyPuzzle(fallbackContent, '2026-07-01');
    expect(p.round2Answer.stage_id).toBe(p.round2Stage.id);
    expect(p.round2Stage.id).toBe(p.round2Answer.stage_id);
  });

  it('Round 3 answer matches the symptom cause', () => {
    const p = buildDailyPuzzle(fallbackContent, '2026-07-01');
    expect(p.round3Answer.id).toBe(p.round3Symptom.cause_id);
  });

  it('includes decoys among the Round 1 tiles', () => {
    const p = buildDailyPuzzle(fallbackContent, '2026-06-16');
    const ids = p.round1Stages.map((s) => s.id);
    expect(ids.length).toBe(p.round1Answer.length + p.round1DecoyIds.length);
    for (const d of p.round1DecoyIds) expect(ids).toContain(d);
  });

  it('produces a usable todayKey', () => {
    expect(todayKey(new Date('2026-06-16T10:00:00'))).toBe('2026-06-16');
  });
});

describe('evaluateRound1', () => {
  const answer = ['a', 'b', 'c'];
  const decoys = ['x'];

  it('marks a perfect order solved with all greens (decoy absent)', () => {
    const r = evaluateRound1(['a', 'b', 'c', 'x'], answer, decoys);
    expect(r.solved).toBe(true);
    expect(r.statuses).toEqual(['correct', 'correct', 'correct', 'absent']);
  });

  it('solves even when a decoy is interleaved (relative order intact)', () => {
    const r = evaluateRound1(['a', 'x', 'b', 'c'], answer, decoys);
    expect(r.solved).toBe(true);
    expect(r.statuses).toEqual(['correct', 'absent', 'correct', 'correct']);
  });

  it('flags wrong-position real stages as present', () => {
    const r = evaluateRound1(['b', 'a', 'c', 'x'], answer, decoys);
    expect(r.solved).toBe(false);
    expect(r.statuses).toEqual(['present', 'present', 'correct', 'absent']);
  });
});

describe('evaluateRound2Guess', () => {
  const find = (id: string) => fallbackContent.techniques.find((t) => t.id === id)!;

  it('marks the exact technique correct on every attribute', () => {
    const mixup = find('mixup');
    const g = evaluateRound2Guess(mixup, mixup);
    expect(g.correct).toBe(true);
    expect(g.attrs.every((a) => a.status === 'correct')).toBe(true);
  });

  it('treats "any" modality as a partial (present) overlap', () => {
    const answer = find('mixup'); // image
    const guess = find('dropout'); // any
    const g = evaluateRound2Guess(guess, answer);
    expect(g.correct).toBe(false);
    expect(g.attrs.find((a) => a.key === 'modality')!.status).toBe('present');
  });

  it('marks mismatched discrete attributes absent', () => {
    const answer = find('mixup'); // text? no, image train-time synthetic
    const guess = find('one-hot'); // tabular preprocessing transform
    const g = evaluateRound2Guess(guess, answer);
    expect(g.attrs.find((a) => a.key === 'when_applied')!.status).toBe('absent');
    expect(g.attrs.find((a) => a.key === 'type')!.status).toBe('absent');
  });
});

describe('evaluateRound3Guess', () => {
  const find = (id: string) => fallbackContent.causes.find((c) => c.id === id)!;

  it('is correct + hot for the exact cause', () => {
    const drift = find('data-drift');
    const g = evaluateRound3Guess(drift, drift, stageName);
    expect(g.correct).toBe(true);
    expect(g.warmth).toBe('correct');
  });

  it('is hot when both attributes match but id differs', () => {
    const g = evaluateRound3Guess(find('data-drift'), find('concept-drift'), stageName);
    expect(g.correct).toBe(false);
    expect(g.warmth).toBe('hot'); // same stage (monitoring) + same category (data)
  });

  it('is cold when nothing matches', () => {
    const g = evaluateRound3Guess(find('overfitting'), find('data-drift'), stageName);
    expect(g.warmth).toBe('cold');
  });
});
