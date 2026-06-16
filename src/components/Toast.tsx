import { useEffect, useState } from 'react';

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

export default function Toast({ message }: { message: ToastMessage | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(t);
  }, [message]);

  if (!message || !visible) return null;
  return (
    <div className={`toast toast--${message.tone}`} role="status" aria-live="polite">
      {message.text}
    </div>
  );
}
