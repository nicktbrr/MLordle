import { useMemo, useState } from 'react';
import type { DailyPuzzle } from '../game/daily';
import { evaluateRound3Guess, type Round3Guess, type Warmth } from '../game/round3';
import { STATUS_EMOJI } from '../game/feedback';
import type { Cause } from '../data/types';
import type { RoundOutcome } from '../state/progress';

const MAX_GUESSES = 6;

const WARMTH_BADGE: Record<Warmth, string> = {
  correct: '🎯 Correct',
  hot: '🔥 Hot',
  warm: '🌤️ Warm',
  cold: '🧊 Cold',
};

export default function Round3Diagnose({
  puzzle,
  stageName,
  onComplete,
  onNext,
  nextLabel = 'Next question →',
}: {
  puzzle: DailyPuzzle;
  stageName: (id: string) => string;
  onComplete: (o: RoundOutcome) => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const [guesses, setGuesses] = useState<Round3Guess[]>([]);
  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.causeId)), [guesses]);
  const solved = guesses.some((g) => g.correct);
  const finished = solved || guesses.length >= MAX_GUESSES;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return puzzle.round3Pool
      .filter((c) => !guessedIds.has(c.id))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.aliases.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, puzzle.round3Pool, guessedIds]);

  function guess(c: Cause) {
    if (finished) return;
    const result = evaluateRound3Guess(c, puzzle.round3Answer, stageName);
    const next = [...guesses, result];
    setGuesses(next);
    setQuery('');
    if (result.correct || next.length >= MAX_GUESSES) {
      const rows = next.map((g) => g.attrs.map((a) => STATUS_EMOJI[a.status]).join(''));
      onComplete({ solved: result.correct, attempts: next.length, rows });
    }
  }

  return (
    <section className="round">
      <header className="round__head">
        <span className="round__tag">Round 3 · What breaks?</span>
        <h2>Diagnose the failure</h2>
        <blockquote className="symptom">“{puzzle.round3Symptom.description}”</blockquote>
        <p className="round__hint">
          Guess the root cause. Each guess shows attribute matches and a warmth
          reading (🔥 / 🌤️ / 🧊).
        </p>
      </header>

      {!finished && (
        <div className="combo">
          <input
            className="combo__input"
            placeholder="Name the cause… (e.g. Data Drift, Overfitting)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul className="combo__list">
              {suggestions.map((c) => (
                <li key={c.id}>
                  <button className="combo__opt" onClick={() => guess(c)}>
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ul className="guesses">
        {guesses.map((g, i) => (
          <li key={i} className={`guess ${g.correct ? 'guess--win' : ''}`}>
            <span className="guess__name">
              {g.name} <span className={`warmth warmth--${g.warmth}`}>{WARMTH_BADGE[g.warmth]}</span>
            </span>
            <span className="guess__attrs">
              {g.attrs.map((a) => (
                <span key={a.key} className={`chip chip--${a.status}`}>
                  <span className="chip__label">{a.label}</span>
                  <span className="chip__value">{a.value}</span>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>

      {finished && (
        <div className="reveal">
          <p className={`round__verdict ${solved ? 'is-win' : 'is-loss'}`}>
            {solved ? `Correct — ${puzzle.round3Answer.name}! 🎯` : 'Out of guesses.'}
          </p>
          <p className="reveal__label">Cause: {puzzle.round3Answer.name}</p>
        </div>
      )}

      <div className="round__foot">
        <span className="round__counter">
          {Math.min(guesses.length + (finished ? 0 : 1), MAX_GUESSES)} / {MAX_GUESSES}
        </span>
        {finished && (
          <button className="btn" onClick={onNext}>
            {nextLabel}
          </button>
        )}
      </div>
    </section>
  );
}
