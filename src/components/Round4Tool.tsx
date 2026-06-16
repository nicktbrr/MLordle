import { useMemo, useState } from 'react';
import type { DailyPuzzle } from '../game/daily';
import { evaluateRound4Guess, type Round4Guess } from '../game/round4';
import type { Warmth } from '../game/round3';
import { STATUS_EMOJI } from '../game/feedback';
import type { Tool } from '../data/types';
import type { RoundOutcome } from '../state/progress';

const MAX_GUESSES = 6;

const WARMTH_BADGE: Record<Warmth, string> = {
  correct: '🎯 Correct',
  hot: '🔥 Hot',
  warm: '🌤️ Warm',
  cold: '🧊 Cold',
};

export default function Round4Tool({
  puzzle,
  stageName,
  onComplete,
  onNext,
  nextLabel = 'See results →',
}: {
  puzzle: DailyPuzzle;
  stageName: (id: string) => string;
  onComplete: (o: RoundOutcome) => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const [guesses, setGuesses] = useState<Round4Guess[]>([]);
  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.toolId)), [guesses]);
  const solved = guesses.some((g) => g.correct);
  const finished = solved || guesses.length >= MAX_GUESSES;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return puzzle.round4Pool
      .filter((t) => !guessedIds.has(t.id))
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.aliases.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, puzzle.round4Pool, guessedIds]);

  function guess(t: Tool) {
    if (finished) return;
    const result = evaluateRound4Guess(t, puzzle.round4Answer, stageName);
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
        <span className="round__tag">Round 4 · Tooling</span>
        <h2>Name the tool</h2>
        <blockquote className="symptom">“{puzzle.round4Prompt.description}”</blockquote>
        <p className="round__hint">
          Guess the tool for the job. Each guess compares four attributes —
          category, lifecycle stage, hosting, and interface — plus a warmth
          reading (🔥 / 🌤️ / 🧊).
        </p>
      </header>

      {!finished && (
        <div className="combo">
          <input
            className="combo__input"
            placeholder="Name the tool… (e.g. MLflow, Pinecone, MongoDB)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul className="combo__list">
              {suggestions.map((t) => (
                <li key={t.id}>
                  <button className="combo__opt" onClick={() => guess(t)}>
                    {t.name}
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
            {solved ? `Correct — ${puzzle.round4Answer.name}! 🎯` : 'Out of guesses.'}
          </p>
          <p className="reveal__label">Tool: {puzzle.round4Answer.name}</p>
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
