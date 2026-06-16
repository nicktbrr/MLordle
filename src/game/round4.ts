import type { Tool, ToolCategory, ToolHosting, ToolInterface } from '../data/types';
import type { AttrFeedback, SlotStatus } from './feedback';
import type { Warmth } from './round3';

export interface Round4Guess {
  toolId: string;
  name: string;
  correct: boolean;
  warmth: Warmth;
  attrs: AttrFeedback[];
}

function exactStatus(guess: string, answer: string): SlotStatus {
  return guess === answer ? 'correct' : 'absent';
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  'experiment-tracking': 'Experiment tracking',
  'vector-db': 'Vector database',
  database: 'Database / store',
  'data-versioning': 'Data versioning',
  orchestration: 'Orchestration',
  serving: 'Model serving',
  'feature-store': 'Feature store',
  monitoring: 'Monitoring',
  labeling: 'Labeling',
  'model-hub': 'Model hub',
  compute: 'Compute / training',
};

const HOSTING_LABELS: Record<ToolHosting, string> = {
  'open-source': 'Open source',
  managed: 'Managed (SaaS)',
  both: 'OSS + managed',
};

const INTERFACE_LABELS: Record<ToolInterface, string> = {
  library: 'Library / SDK',
  platform: 'Platform / UI',
  database: 'Database',
  cli: 'CLI',
};

/**
 * Compare a guessed tool against the answer across four categories (category,
 * lifecycle stage, hosting model, interface). Warmth reflects how many of the
 * four attributes match: 3–4 -> hot, 1–2 -> warm, 0 -> cold (exact id -> correct).
 * `stageName` prettifies the lifecycle-stage value for display.
 */
export function evaluateRound4Guess(
  guess: Tool,
  answer: Tool,
  stageName: (stageId: string) => string,
): Round4Guess {
  const g = guess.attributes;
  const a = answer.attributes;
  const attrs: AttrFeedback[] = [
    { key: 'category', label: 'Category', value: CATEGORY_LABELS[g.category] ?? g.category, status: exactStatus(g.category, a.category) },
    { key: 'lifecycle_stage', label: 'Lifecycle stage', value: stageName(g.lifecycle_stage), status: exactStatus(g.lifecycle_stage, a.lifecycle_stage) },
    { key: 'hosting', label: 'Hosting', value: HOSTING_LABELS[g.hosting] ?? g.hosting, status: exactStatus(g.hosting, a.hosting) },
    { key: 'interface', label: 'Interface', value: INTERFACE_LABELS[g.interface] ?? g.interface, status: exactStatus(g.interface, a.interface) },
  ];

  const correct = guess.id === answer.id;
  const matches = attrs.filter((x) => x.status === 'correct').length;
  const warmth: Warmth = correct ? 'correct' : matches >= 3 ? 'hot' : matches >= 1 ? 'warm' : 'cold';

  return { toolId: guess.id, name: guess.name, correct, warmth, attrs };
}
