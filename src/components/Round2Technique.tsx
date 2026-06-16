import { useMemo, useState } from 'react';
import type { DailyPuzzle } from '../game/daily';
import { evaluateRound2Guess, type Round2Guess } from '../game/round2';
import { STATUS_EMOJI } from '../game/feedback';
import type { Technique } from '../data/types';
import type { RoundOutcome } from '../state/progress';

const MAX_GUESSES = 6;

export default function Round2Technique({
  puzzle,
  onComplete,
}: {
  puzzle: DailyPuzzle;
  onComplete: (o: RoundOutcome) => void;
}) {
  const [query, setQuery] = useState('');
  const [guesses, setGuesses] = useState<Round2Guess[]>([]);
  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.techniqueId)), [guesses]);
  const solved = guesses.some((g) => g.correct);
  const finished = solved || guesses.length >= MAX_GUESSES;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return puzzle.round2Pool
      .filter((t) => !guessedIds.has(t.id))
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.aliases.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, puzzle.round2Pool, guessedIds]);

  function guess(t: Technique) {
    if (finished) return;
    const result = evaluateRound2Guess(t, puzzle.round2Answer);
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
        <span className="round__tag">Round 2 · Technique</span>
        <h2>
          Which technique fits <em>{puzzle.round2Stage.name}</em>?
        </h2>
        <p className="round__desc">{puzzle.round2Stage.description}</p>
        <p className="round__hint">
          Guess a technique. Each guess reveals how its attributes compare to the
          answer: 🟩 match · 🟨 partial · ⬛ off.
        </p>
      </header>

      {!finished && (
        <div className="combo">
          <input
            className="combo__input"
            placeholder="Type a technique… (e.g. MixUp, SMOTE, Dropout)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
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
            <span className="guess__name">{g.name}</span>
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

      <div className="round__foot">
        <span className="round__counter">
          {Math.min(guesses.length + (finished ? 0 : 1), MAX_GUESSES)} / {MAX_GUESSES}
        </span>
        {finished && (
          <p className={`round__verdict ${solved ? 'is-win' : 'is-loss'}`}>
            {solved
              ? `Correct — ${puzzle.round2Answer.name}! 🟩`
              : `The answer was ${puzzle.round2Answer.name}.`}
          </p>
        )}
      </div>
    </section>
  );
}
