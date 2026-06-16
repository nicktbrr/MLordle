import type { Technique } from '../data/types';
import type { AttrFeedback, SlotStatus } from './feedback';

export interface Round2Guess {
  techniqueId: string;
  name: string;
  correct: boolean;
  attrs: AttrFeedback[];
}

function modalityStatus(guess: string, answer: string): SlotStatus {
  if (guess === answer) return 'correct';
  if (guess === 'any' || answer === 'any') return 'present'; // overlaps everything
  return 'absent';
}

function exactStatus(guess: string, answer: string): SlotStatus {
  return guess === answer ? 'correct' : 'absent';
}

const WHEN_LABELS: Record<string, string> = {
  preprocessing: 'Preprocessing',
  'train-time': 'Train-time',
  'post-training': 'Post-training',
  inference: 'Inference',
};

/** Compare a guessed technique against the day's answer technique. */
export function evaluateRound2Guess(guess: Technique, answer: Technique): Round2Guess {
  const g = guess.attributes;
  const a = answer.attributes;
  const attrs: AttrFeedback[] = [
    { key: 'modality', label: 'Modality', value: g.modality, status: modalityStatus(g.modality, a.modality) },
    { key: 'when_applied', label: 'When applied', value: WHEN_LABELS[g.when_applied] ?? g.when_applied, status: exactStatus(g.when_applied, a.when_applied) },
    { key: 'type', label: 'Type', value: g.type, status: exactStatus(g.type, a.type) },
    { key: 'needs_labels', label: 'Needs labels', value: g.needs_labels ? 'Yes' : 'No', status: exactStatus(String(g.needs_labels), String(a.needs_labels)) },
  ];
  return { techniqueId: guess.id, name: guess.name, correct: guess.id === answer.id, attrs };
}
