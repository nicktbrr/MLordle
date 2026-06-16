import { useEffect, useState } from 'react';
import type { ToastMessage } from './praise';

export default function Toast({ message }: { message: ToastMessage | null }) {
  // Track which message has been auto-dismissed; visibility is derived from
  // that rather than toggled synchronously inside the effect.
  const [dismissedId, setDismissedId] = useState<number | null>(null);

  useEffect(() => {
    if (!message) return;
    const { id } = message;
    const t = setTimeout(() => setDismissedId(id), 1600);
    return () => clearTimeout(t);
  }, [message]);

  if (!message || message.id === dismissedId) return null;
  return (
    <div className={`toast toast--${message.tone}`} role="status" aria-live="polite">
      {message.text}
    </div>
  );
}
