import { describe, expect, it } from 'vitest';
import { fallbackContent } from '../data/fallbackContent';
import { buildDailyPuzzle, todayKey } from './daily';
import { evaluateRound1Graph } from './round1';
import type { StageEdge } from '../data/types';
import { evaluateRound2Guess } from './round2';
import { evaluateRound3Guess } from './round3';
import { evaluateRound4Guess } from './round4';

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

describe('evaluateRound1Graph', () => {
  // Answer graph with a cycle: a → b → c → a
  const answer = { nodeIds: ['a', 'b', 'c'], edges: [['a', 'b'], ['b', 'c'], ['c', 'a']] as StageEdge[] };

  it('solves when nodes and directed edges match exactly (cycle included)', () => {
    const r = evaluateRound1Graph(
      { nodeIds: ['a', 'b', 'c'], edges: [['a', 'b'], ['b', 'c'], ['c', 'a']] },
      answer,
    );
    expect(r.solved).toBe(true);
    expect(Object.values(r.nodeStatus)).toEqual(['correct', 'correct', 'correct']);
    expect(r.missingEdges).toEqual([]);
  });

  it('is not solved if the cycle edge is missing', () => {
    const r = evaluateRound1Graph(
      { nodeIds: ['a', 'b', 'c'], edges: [['a', 'b'], ['b', 'c']] },
      answer,
    );
    expect(r.solved).toBe(false);
    expect(r.missingEdges).toEqual([['c', 'a']]);
    // a and c touch the missing edge -> yellow; b is fully wired -> green
    expect(r.nodeStatus.a).toBe('present');
    expect(r.nodeStatus.b).toBe('correct');
    expect(r.nodeStatus.c).toBe('present');
  });

  it('marks a node that does not belong as absent and the edge to it as wrong', () => {
    const r = evaluateRound1Graph(
      { nodeIds: ['a', 'b', 'c', 'x'], edges: [['a', 'b'], ['b', 'c'], ['c', 'a'], ['a', 'x']] },
      answer,
    );
    expect(r.solved).toBe(false);
    expect(r.nodeStatus.x).toBe('absent');
    expect(r.edgeStatus['a->x']).toBe('absent');
    expect(r.edgeStatus['a->b']).toBe('correct');
  });

  it('reports nodes the player never placed as missing', () => {
    const r = evaluateRound1Graph({ nodeIds: ['a', 'b'], edges: [['a', 'b']] }, answer);
    expect(r.missingNodeIds).toEqual(['c']);
    expect(r.solved).toBe(false);
  });

  it('treats direction as significant (b→a is wrong when answer is a→b)', () => {
    const r = evaluateRound1Graph(
      { nodeIds: ['a', 'b', 'c'], edges: [['b', 'a'], ['b', 'c'], ['c', 'a']] },
      answer,
    );
    expect(r.edgeStatus['b->a']).toBe('absent');
    expect(r.solved).toBe(false);
  });
});

describe('daily puzzle Round 1 edges', () => {
  it('exposes directed edges and includes a retraining cycle for monitored scenarios', () => {
    const p = buildDailyPuzzle(fallbackContent, '2026-06-16');
    expect(p.round1Edges.length).toBeGreaterThan(0);
    if (p.round1Answer.includes('monitoring')) {
      expect(p.round1Edges).toContainEqual(['monitoring', 'model-training']);
    }
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

describe('evaluateRound4Guess', () => {
  const find = (id: string) => fallbackContent.tools.find((t) => t.id === id)!;

  it('is correct + correct warmth for the exact tool', () => {
    const mlflow = find('mlflow');
    const g = evaluateRound4Guess(mlflow, mlflow, stageName);
    expect(g.correct).toBe(true);
    expect(g.warmth).toBe('correct');
    expect(g.attrs).toHaveLength(4);
    expect(g.attrs.every((a) => a.status === 'correct')).toBe(true);
  });

  it('is hot when 3 of 4 attributes match', () => {
    // Milvus vs Weaviate: same category/stage/interface, hosting differs
    const g = evaluateRound4Guess(find('milvus'), find('weaviate'), stageName);
    expect(g.correct).toBe(false);
    expect(g.warmth).toBe('hot');
  });

  it('is warm when some but few attributes match', () => {
    // MLflow vs Ray: same lifecycle stage + interface only
    const g = evaluateRound4Guess(find('mlflow'), find('ray'), stageName);
    expect(g.warmth).toBe('warm');
  });

  it('is cold when nothing matches', () => {
    const g = evaluateRound4Guess(find('mlflow'), find('pinecone'), stageName);
    expect(g.warmth).toBe('cold');
  });
});

describe('daily puzzle Round 4', () => {
  it('answer matches the prompt tool and the pool holds every tool', () => {
    const p = buildDailyPuzzle(fallbackContent, '2026-07-01');
    expect(p.round4Answer.id).toBe(p.round4Prompt.tool_id);
    expect(p.round4Pool).toHaveLength(fallbackContent.tools.length);
  });
});
