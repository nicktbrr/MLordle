import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Round1Order from './components/Round1Order';
import Round2Technique from './components/Round2Technique';
import Round3Diagnose from './components/Round3Diagnose';
import Results from './components/Results';
import { getContentRepository } from './data/contentRepository';
import { isSupabaseConfigured } from './lib/supabase';
import type { Content } from './data/types';
import { buildDailyPuzzle, todayKey, type DailyPuzzle } from './game/daily';
import { computeStreak, useProgress, type RoundOutcome } from './state/progress';

type Phase = 'round1' | 'round2' | 'round3' | 'results';

export default function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dateKey = useMemo(() => todayKey(), []);
  const { results, saveDay } = useProgress();

  const [phase, setPhase] = useState<Phase>('round1');
  const [r1, setR1] = useState<RoundOutcome | null>(null);
  const [r2, setR2] = useState<RoundOutcome | null>(null);

  useEffect(() => {
    let active = true;
    getContentRepository()
      .getContent()
      .then((c) => active && setContent(c))
      .catch((e) => active && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      active = false;
    };
  }, []);

  const puzzle: DailyPuzzle | null = useMemo(
    () => (content ? buildDailyPuzzle(content, dateKey) : null),
    [content, dateKey],
  );
  const stageName = useMemo(() => {
    const map = new Map((content?.stages ?? []).map((s) => [s.id, s.name]));
    return (id: string) => map.get(id) ?? id;
  }, [content]);

  const savedToday = results[dateKey];
  const streak = computeStreak(results, dateKey);

  // If today was already completed in a previous session, jump to results.
  useEffect(() => {
    if (savedToday) setPhase('results');
  }, [savedToday]);

  function finishRound3(o3: RoundOutcome) {
    saveDay({
      dateKey,
      round1: r1!,
      round2: r2!,
      round3: o3,
      completedAt: new Date().toISOString(),
    });
    setPhase('results');
  }

  if (error) {
    return (
      <div className="app">
        <Header streak={streak} dateKey={dateKey} />
        <main className="stage">
          <section className="round">
            <h2>Couldn’t load today’s puzzle</h2>
            <p className="round__hint">{error}</p>
          </section>
        </main>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="app">
        <Header streak={streak} dateKey={dateKey} />
        <main className="stage">
          <p className="loading">Loading today’s puzzle…</p>
        </main>
      </div>
    );
  }

  const phaseIndex = ['round1', 'round2', 'round3', 'results'].indexOf(phase);

  return (
    <div className="app">
      <Header streak={streak} dateKey={dateKey} />

      <nav className="steps" aria-label="rounds">
        {(['round1', 'round2', 'round3'] as const).map((p, i) => (
          <span
            key={p}
            className={`steps__dot ${phase === p ? 'is-active' : ''} ${phaseIndex > i ? 'is-done' : ''}`}
          >
            {i + 1}
          </span>
        ))}
      </nav>

      <main className="stage">
        {phase === 'round1' && (
          <Round1Order
            puzzle={puzzle}
            onComplete={(o) => {
              setR1(o);
              setPhase('round2');
            }}
          />
        )}
        {phase === 'round2' && (
          <Round2Technique
            puzzle={puzzle}
            onComplete={(o) => {
              setR2(o);
              setPhase('round3');
            }}
          />
        )}
        {phase === 'round3' && (
          <Round3Diagnose puzzle={puzzle} stageName={stageName} onComplete={finishRound3} />
        )}
        {phase === 'results' && savedToday && (
          <Results result={savedToday} streak={streak} alreadyPlayed />
        )}
      </main>

      {!isSupabaseConfigured && (
        <footer className="banner">
          Running on bundled demo content — set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to load from Supabase.
        </footer>
      )}
    </div>
  );
}
