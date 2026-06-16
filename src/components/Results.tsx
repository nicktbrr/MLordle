import { useState } from 'react';
import type { DayResult } from '../state/progress';

function summaryLine(label: string, o: { solved: boolean; attempts: number }): string {
  return `${o.solved ? '✅' : '❌'} ${label} (${o.attempts}/6)`;
}

export function buildShareText(result: DayResult, streak: number): string {
  return [
    `MLordle — ${result.dateKey}`,
    summaryLine('Pipeline', result.round1),
    summaryLine('Technique', result.round2),
    summaryLine('Diagnosis', result.round3),
    `🔥 Streak: ${streak}`,
  ].join('\n');
}

export default function Results({
  result,
  streak,
  alreadyPlayed,
}: {
  result: DayResult;
  streak: number;
  alreadyPlayed: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const share = buildShareText(result, streak);
  const solvedCount = [result.round1, result.round2, result.round3].filter((r) => r.solved).length;

  async function copy() {
    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the textarea below still lets users copy manually */
    }
  }

  return (
    <section className="round results">
      <header className="round__head">
        <span className="round__tag">Done for today</span>
        <h2>{solvedCount} / 3 rounds solved</h2>
        {alreadyPlayed && <p className="round__hint">You already played today — come back tomorrow for a new puzzle.</p>}
      </header>

      <pre className="share">{share}</pre>

      <div className="round__foot">
        <button className="btn" onClick={copy}>
          {copied ? 'Copied!' : 'Copy results'}
        </button>
        <span className="round__counter">🔥 {streak}-day streak</span>
      </div>
    </section>
  );
}
