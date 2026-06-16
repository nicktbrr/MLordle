import { useState } from 'react';
import type { DayResult, RoundOutcome } from '../state/progress';
import type { DailyStats } from '../data/statsRepository';

const ROUND_LABELS: [keyof Pick<DayResult, 'round1' | 'round2' | 'round3'>, string][] = [
  ['round1', 'Pipeline'],
  ['round2', 'Technique'],
  ['round3', 'Diagnosis'],
];

function summaryLine(label: string, o: RoundOutcome): string {
  return `${o.solved ? '✅' : '❌'} ${label} (${o.attempts}/6)`;
}

export function buildShareText(result: DayResult, streak: number): string {
  return [
    `MLordle — ${result.dateKey}`,
    ...ROUND_LABELS.map(([k, label]) => summaryLine(label, result[k])),
    `🔥 Streak: ${streak}`,
  ].join('\n');
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function CommunityStats({ stats, loading }: { stats: DailyStats | null; loading: boolean }) {
  if (loading) return <p className="round__hint">Loading community stats…</p>;
  if (!stats) return null;
  if (!stats.players) {
    return <p className="round__hint">You’re the first to finish today — stats appear once others play.</p>;
  }

  const rows: [string, number, number][] = [
    ['Pipeline', stats.round1_solve_rate, stats.avg_round1_attempts],
    ['Technique', stats.round2_solve_rate, stats.avg_round2_attempts],
    ['Diagnosis', stats.round3_solve_rate, stats.avg_round3_attempts],
  ];

  return (
    <div className="community">
      <h3 className="community__title">
        Today across all players <span className="community__count">· {stats.players} played</span>
      </h3>
      <table className="community__table">
        <thead>
          <tr>
            <th>Round</th>
            <th>Solved</th>
            <th>Avg tries</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, rate, avg]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{pct(rate)}</td>
              <td>{avg.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Results({
  result,
  streak,
  alreadyPlayed,
  stats,
  statsLoading,
}: {
  result: DayResult;
  streak: number;
  alreadyPlayed: boolean;
  stats: DailyStats | null;
  statsLoading: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const share = buildShareText(result, streak);
  const solvedCount = ROUND_LABELS.filter(([k]) => result[k].solved).length;

  async function copy() {
    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the block below still lets users copy manually */
    }
  }

  return (
    <section className="round results">
      <header className="round__head">
        <span className="round__tag">Done for today</span>
        <h2>{solvedCount} / 3 rounds solved</h2>
        {alreadyPlayed && (
          <p className="round__hint">Come back tomorrow for a new puzzle.</p>
        )}
      </header>

      <div className="yourgame">
        {ROUND_LABELS.map(([k, label]) => (
          <div key={k} className={`yourgame__row ${result[k].solved ? 'is-win' : 'is-loss'}`}>
            <span>{result[k].solved ? '✅' : '❌'} {label}</span>
            <span className="yourgame__tries">{result[k].attempts} {result[k].attempts === 1 ? 'try' : 'tries'}</span>
          </div>
        ))}
      </div>

      <CommunityStats stats={stats} loading={statsLoading} />

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
