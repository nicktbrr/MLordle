import type { SlotStatus } from './feedback';

export interface Round1Result {
  statuses: SlotStatus[]; // aligned to guessedOrder
  solved: boolean;
}

/**
 * Score a Round 1 ordering attempt.
 * - Decoy stages are always `absent` (they don't belong in this pipeline).
 * - Real stages are compared by their *relative* order (decoys removed): a stage
 *   is `correct` if it sits in the right slot among the real stages, else `present`.
 * Solved when the real stages, in order, exactly match the answer pipeline.
 */
export function evaluateRound1(
  guessedOrder: string[],
  answer: string[],
  decoyIds: string[],
): Round1Result {
  const decoy = new Set(decoyIds);
  const realInOrder = guessedOrder.filter((id) => !decoy.has(id));
  const rankInReal = new Map<string, number>();
  realInOrder.forEach((id, i) => rankInReal.set(id, i));

  const statuses: SlotStatus[] = guessedOrder.map((id) => {
    if (decoy.has(id)) return 'absent';
    const k = rankInReal.get(id)!;
    return answer[k] === id ? 'correct' : 'present';
  });

  const solved =
    realInOrder.length === answer.length && realInOrder.every((id, i) => id === answer[i]);

  return { statuses, solved };
}
