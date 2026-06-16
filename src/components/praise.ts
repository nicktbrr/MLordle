export interface ToastMessage {
  id: number;
  text: string;
  tone: 'win' | 'lose';
}

// Wordle-style praise keyed by the number of attempts (1 = best).
const PRAISE = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];

export function praiseFor(attempts: number, solved: boolean): ToastMessage {
  if (!solved) return { id: Date.now(), text: 'Next time!', tone: 'lose' };
  const word = PRAISE[Math.min(attempts, PRAISE.length) - 1] ?? 'Solved';
  return { id: Date.now(), text: `${word}! 🟩`, tone: 'win' };
}
