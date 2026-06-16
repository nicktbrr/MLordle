import type { Cause } from '../data/types';
import type { AttrFeedback, SlotStatus } from './feedback';

export type Warmth = 'correct' | 'hot' | 'warm' | 'cold';

export interface Round3Guess {
  causeId: string;
  name: string;
  correct: boolean;
  warmth: Warmth;
  attrs: AttrFeedback[];
}

function exactStatus(guess: string, answer: string): SlotStatus {
  return guess === answer ? 'correct' : 'absent';
}

const CATEGORY_LABELS: Record<string, string> = {
  data: 'Data',
  model: 'Model',
  process: 'Process',
  infra: 'Infra',
};

/**
 * Compare a guessed cause against the answer. Warmth reflects how many attributes
 * match: both -> hot, one -> warm, none -> cold (exact id match -> correct).
 * `stageName` prettifies the lifecycle-stage value for display.
 */
export function evaluateRound3Guess(
  guess: Cause,
  answer: Cause,
  stageName: (stageId: string) => string,
): Round3Guess {
  const g = guess.attributes;
  const a = answer.attributes;
  const attrs: AttrFeedback[] = [
    { key: 'lifecycle_stage', label: 'Lifecycle stage', value: stageName(g.lifecycle_stage), status: exactStatus(g.lifecycle_stage, a.lifecycle_stage) },
    { key: 'category', label: 'Category', value: CATEGORY_LABELS[g.category] ?? g.category, status: exactStatus(g.category, a.category) },
  ];

  const correct = guess.id === answer.id;
  const matches = attrs.filter((x) => x.status === 'correct').length;
  const warmth: Warmth = correct ? 'correct' : matches === 2 ? 'hot' : matches === 1 ? 'warm' : 'cold';

  return { causeId: guess.id, name: guess.name, correct, warmth, attrs };
}
